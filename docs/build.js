import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * README generator.
 *
 * Expands `<Examples />` and `<ExamplesTable ids="a,b,c" />` directives in
 * `README.template.md` using the examples registry at
 * `../examples/src/examples.json`, and writes TWO real files:
 *
 *   - repo-root `../README.md`               → relative image paths, so the
 *     gallery renders locally and on the GitHub repo landing page.
 *   - `../packages/recast-navigation/README.md` → absolute raw URLs, so it
 *     renders on npm (where relative repo paths can't resolve).
 *
 * The root README used to be a symlink to the package README; a symlink forces
 * absolute image URLs (a relative path can't resolve from both the repo root
 * and packages/recast-navigation/). Generating both lets the root use relative.
 *
 * Edit the template, not the generated READMEs.
 */

const here = path.dirname(fileURLToPath(import.meta.url));

const EXAMPLES_JSON = path.join(here, '../examples/src/examples.json');

// Screenshots live at repo-root examples/public/screenshots.
// Root README: relative path (renders locally + on GitHub, no network).
const IMAGE_BASE_RELATIVE = './examples/public/screenshots';
// Package README (npm): absolute raw URL, since relative paths can't reach the
// repo root from the published package.
const IMAGE_BASE_ABSOLUTE =
    'https://raw.githubusercontent.com/isaac-mason/recast-navigation-js/main/examples/public/screenshots';

// Deployed examples site, keyed by example id via the URL hash.
const EXAMPLE_PAGES_BASE = 'https://recast-navigation-js.isaacmason.com/examples/#';

const EXAMPLES_COLS = 3;

function loadExamples() {
    if (!fs.existsSync(EXAMPLES_JSON)) {
        console.warn(`examples.json not found: ${EXAMPLES_JSON}`);
        return null;
    }
    return JSON.parse(fs.readFileSync(EXAMPLES_JSON, 'utf-8'));
}

function cell(key, data, width, height, imageBase) {
    const title = data[key].title || key;
    const img = `${imageBase}/${key}.png`;
    const href = `${EXAMPLE_PAGES_BASE}${key}`;
    return (
        `    <td align="center">\n` +
        `      <a href="${href}">\n` +
        `        <img src="${img}" width="${width}" height="${height}" style="object-fit:cover;"/><br/>\n` +
        `        ${title}\n` +
        `      </a>\n` +
        `    </td>`
    );
}

/* A full gallery table of every example, read from examples.json. */
function renderExamples(imageBase) {
    const data = loadExamples();
    if (!data) return '';
    const keys = Object.keys(data);
    let out = '<table>\n';
    for (let i = 0; i < keys.length; i += EXAMPLES_COLS) {
        out += '  <tr>\n';
        for (let j = 0; j < EXAMPLES_COLS && i + j < keys.length; ++j) {
            out += `${cell(keys[i + j], data, 180, 120, imageBase)}\n`;
        }
        out += '  </tr>\n';
    }
    out += '</table>';
    return out;
}

/* A one-row table of one or more examples, for interleaving inside a section.
 * <ExamplesTable ids="example-obstacles-crowd,example-obstacles-path" /> */
function renderExamplesTable(idsStr, imageBase) {
    const data = loadExamples();
    if (!data) return '';
    const ids = idsStr.split(',').map((s) => s.trim());
    const valid = ids.filter(
        (id) => data[id] || console.warn(`example '${id}' not in examples.json`),
    );
    if (valid.length === 0) return '';
    const cells = valid
        .map((id) => cell(id, data, 200, 133, imageBase))
        .join('\n');
    return `<table>\n  <tr>\n${cells}\n  </tr>\n</table>`;
}

function render(text, imageBase) {
    /* <Examples /> - gallery table of all examples with screenshots */
    text = text.replace(/<Examples\s*\/>/g, () => renderExamples(imageBase));

    /* <ExamplesTable ids="a,b,c" /> - inline one-row table for a section */
    text = text.replace(
        /<ExamplesTable\s+ids=["'](.+?)["']\s*\/>/g,
        (_full, ids) => renderExamplesTable(ids, imageBase),
    );

    return text;
}

const outputs = [
    { template: './README.template.md', out: '../README.md', imageBase: IMAGE_BASE_RELATIVE },
    {
        template: './README.template.md',
        out: '../packages/recast-navigation/README.md',
        imageBase: IMAGE_BASE_ABSOLUTE,
    },
];

for (const { template, out, imageBase } of outputs) {
    const tplPath = path.join(here, template);
    if (!fs.existsSync(tplPath)) {
        console.warn(`Skipping ${template} (not found)`);
        continue;
    }
    const result = render(fs.readFileSync(tplPath, 'utf-8'), imageBase);
    const outPath = path.join(here, out);
    // The root README used to be a symlink to the package README; replace it
    // with a real generated file so it can carry its own (relative) image paths.
    if (fs.existsSync(outPath) && fs.lstatSync(outPath).isSymbolicLink()) {
        fs.unlinkSync(outPath);
    }
    fs.writeFileSync(outPath, result, 'utf-8');
    console.log(`Wrote ${path.relative(process.cwd(), outPath)}`);
}
