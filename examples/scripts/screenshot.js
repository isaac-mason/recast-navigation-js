/**
 * Screenshot automation for examples.
 *
 * Starts `pnpm run dev` (Vite dev server), navigates Playwright Chromium to
 * each example, waits for the three.js WebGL canvas to render, clips to the
 * <canvas> element, and writes PNGs to examples/public/screenshots/<key>.png.
 *
 * Usage:
 *   pnpm run screenshot                          (from examples/)
 *   node scripts/screenshot.js <example-key>     (single example)
 *   SCREENSHOT_TIMEOUT=4000 pnpm run screenshot
 */

import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const examplesDir = resolve(__dirname, '..');

const TIMEOUT_MS = Number(process.env.SCREENSHOT_TIMEOUT ?? 3500);
const VIEWPORT = { width: 1280, height: 720 };

// ---------------------------------------------------------------------------
// Read example registry
// ---------------------------------------------------------------------------

const examples = JSON.parse(
    readFileSync(resolve(examplesDir, 'src/examples.json'), 'utf8'),
);
// Optionally screenshot a single example: `node scripts/screenshot.js <key>`
const onlyKey = process.argv[2];
const exampleKeys = onlyKey
    ? Object.keys(examples).filter((k) => k === onlyKey)
    : Object.keys(examples);
if (onlyKey && exampleKeys.length === 0) {
    throw new Error(`Unknown example key: ${onlyKey}`);
}

// ---------------------------------------------------------------------------
// Ensure output directory exists
// ---------------------------------------------------------------------------

const screenshotsDir = resolve(examplesDir, 'public/screenshots');
mkdirSync(screenshotsDir, { recursive: true });

// ---------------------------------------------------------------------------
// Start Vite dev server and wait until it's ready
// ---------------------------------------------------------------------------

function startDevServer() {
    return new Promise((resolve, reject) => {
        const proc = spawn(
            'pnpm',
            ['run', 'dev', '--', '--port', '5199', '--strictPort'],
            {
                cwd: examplesDir,
                stdio: ['ignore', 'pipe', 'pipe'],
            },
        );

        let resolved = false;

        const onData = (data) => {
            const text = data.toString();
            process.stdout.write(`[vite] ${text}`);

            // Vite prints "Local: http://localhost:<port>/" when ready
            const match = text.match(/Local:\s+(http:\/\/localhost:\d+)/);
            if (match && !resolved) {
                resolved = true;
                resolve({ proc, url: match[1] });
            }
        };

        proc.stdout.on('data', onData);
        proc.stderr.on('data', onData);

        proc.on('error', reject);
        proc.on('exit', (code) => {
            if (!resolved) reject(new Error(`Vite exited early with code ${code}`));
        });
    });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

let viteProc = null;

try {
    console.log('Starting Vite dev server...');
    const { proc, url } = await startDevServer();
    viteProc = proc;
    console.log(`Vite ready at ${url}`);

    const browser = await chromium.launch({
        // Headless by default so the run doesn't steal desktop focus.
        // Set HEADED=1 to watch it drive a real window.
        headless: process.env.HEADED !== '1',
        // Use ANGLE/Metal for a real GPU path on macOS, and keep any fallback
        // headed window shoved far offscreen.
        args: [
            '--use-angle=metal',
            '--ignore-gpu-blocklist',
            '--enable-unsafe-swiftshader',
            '--window-position=-10000,-10000',
        ],
    });

    const context = await browser.newContext({ viewport: VIEWPORT });
    const page = await context.newPage();

    // Surface any page errors so we know if init fails
    page.on('pageerror', (err) => console.error(`[page error] ${err.message}`));
    page.on('console', (msg) => {
        if (msg.type() === 'error') console.error(`[console error] ${msg.text()}`);
    });

    const failed = [];

    for (const key of exampleKeys) {
        const pageUrl = `${url}/${key}.html`;
        console.log(`\n→ ${key}`);

        try {
            await page.goto(pageUrl, { waitUntil: 'networkidle' });
        } catch (err) {
            console.warn(`  navigation issue: ${err.message}`);
        }
        await page.waitForTimeout(TIMEOUT_MS);

        const canvas = page.locator('canvas').first();
        let box = null;
        try {
            box = await canvas.boundingBox();
        } catch {
            /* no canvas */
        }

        if (!box) {
            console.warn(`  No <canvas> found — skipping`);
            failed.push(key);
            continue;
        }

        const outPath = resolve(screenshotsDir, `${key}.png`);
        await page.screenshot({ path: outPath, clip: box });
        console.log(`  Saved → ${outPath}`);
    }

    await browser.close();
    console.log('\nAll screenshots captured.');
    if (failed.length) {
        console.warn(`Failed / skipped: ${failed.join(', ')}`);
    }
} finally {
    if (viteProc) {
        viteProc.kill('SIGTERM');
    }
}
