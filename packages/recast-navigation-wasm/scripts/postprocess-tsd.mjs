// Reshape embind's --emit-tsd output into the merged function+namespace shape that
// @recast-navigation/core consumes (the same shape webidl-dts-gen produced):
//
//   declare namespace Recast {
//     interface ClassHandle { ... }
//     interface NavMeshQuery extends ClassHandle { ... }   // instance type
//     const NavMeshQuery: { new (): NavMeshQuery };         // constructor value
//     const RC_MAX_TIMERS: number;                          // constants
//     const HEAPF32: Float32Array;                          // heap views
//   }
//   declare function Recast(options?: unknown): Promise<typeof Recast>;
//   export default Recast;
//
// So core's `typeof RawModule` has both the instance types (InstanceType<...>) and
// the constructor values it news up. Fails loud on missing anchors (emsdk drift).
import { readFileSync, writeFileSync } from 'node:fs';

const IN = process.argv[2];
const OUT = process.argv[3];
if (!IN || !OUT) {
  console.error('usage: node postprocess-tsd.mjs <in.d.ts> <out.d.ts>');
  process.exit(1);
}
const NS = 'Recast';

let src = readFileSync(IN, 'utf8');

// embind types every raw-pointer return/param as `T | null`. The WebIDL binder
// typed these non-null and core handles null at runtime via Raw.isNull, so strip
// `| null` to restore the prior contract (avoids ~40 spurious core type errors).
src = src.replace(/ \| null/g, '');

const die = (msg) => {
  console.error(`postprocess-tsd: ANCHOR MISSING — ${msg}. Did emsdk output change?`);
  process.exit(1);
};

// --- 1. HEAP views from `declare namespace RuntimeExports { let HEAPF32: ...; }` ---
const rt = src.match(/declare namespace RuntimeExports \{([\s\S]*?)\n\}/);
if (!rt) die('RuntimeExports block');
const heapLines = [...rt[1].matchAll(/let (\w+): ([^;]+);/g)].map(
  (m) => `  const ${m[1]}: ${m[2]};`,
);
// Runtime exports embind's --emit-tsd omits but core consumes (EXPORTED_FUNCTIONS /
// EXPORTED_RUNTIME_METHODS). Present at runtime; injected into the type surface.
const runtimeExtras = [
  '  function _malloc(size: number): number;',
  '  function _free(ptr: number): void;',
  '  function UTF8ToString(ptr: number): string;',
];

// --- 2. interface blocks: ClassHandle + every `export interface X ... { ... }` ---
const interfaces = [];
// All interfaces: ClassHandle + `X extends ClassHandle` + subclass `X extends <Base>`.
for (const m of src.matchAll(/export interface \w+(?: extends \w+)? \{[\s\S]*?\n\}/g)) {
  interfaces.push(m[0].replace(/^export /, '  ').replace(/\n/g, '\n  '));
}
if (!interfaces.some((i) => i.includes('interface ClassHandle'))) die('ClassHandle interface');

// --- 3. EmbindModule members -> namespace values (constructors, constants, fns) ---
const em = src.match(/interface EmbindModule \{([\s\S]*?)\n\}/);
if (!em) die('EmbindModule block');
const body = em[1];
const values = [];
// Constructors are multi-line (`  X: {\n    new(...): X;\n  };`) — match and
// REMOVE them first so their nested `new()` lines don't get mis-parsed as fns.
// Any multi-line object member -> a `const`: constructors (`new(...)`) AND
// static-only classes (e.g. FastRand: { getSeed(): number; ... }, no `new`).
const objRe = /^  (\w+): \{\n((?:    [^\n]*\n)+?)  \};/gm;
for (const m of body.matchAll(objRe)) {
  const inner = m[2].trimEnd();
  values.push(`  const ${m[1]}: {\n${inner}\n  };`);
}
const rest = body.replace(objRe, '');
// Remaining top-level (2-space indent) members: free functions then constants.
for (const line of rest.split('\n')) {
  const fn = line.match(/^  (\w+)\(([^)]*)\): (.+);$/);
  if (fn) { values.push(`  function ${fn[1]}(${fn[2]}): ${fn[3]};`); continue; }
  const c = line.match(/^  (\w+): (.+);$/);
  if (c) { values.push(`  const ${c[1]}: ${c[2]};`); }
}
if (!values.length) die('EmbindModule members');

// --- 4. emit merged namespace + factory ---
const out = `// Generated from embind --emit-tsd, reshaped by scripts/postprocess-tsd.mjs.
// Do not edit by hand.
/* eslint-disable */

declare namespace ${NS} {
${interfaces.join('\n\n')}

${values.join('\n')}
${runtimeExtras.join('\n')}
${heapLines.join('\n')}
}

declare function ${NS}(options?: unknown): Promise<typeof ${NS}>;
export default ${NS};
`;

writeFileSync(OUT, out);
console.log(`postprocess-tsd: wrote ${OUT} (${interfaces.length} interfaces, ${values.length} values)`);
