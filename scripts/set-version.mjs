// Sets the version of every publishable package. All packages are versioned together.
//
// Usage: node scripts/set-version.mjs <version>

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const version = process.argv[2];

if (!version || !/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version)) {
  console.error('Usage: node scripts/set-version.mjs <version>');
  process.exit(1);
}

const packagesDir = join(import.meta.dirname, '..', 'packages');

for (const dir of readdirSync(packagesDir)) {
  const packageJsonPath = join(packagesDir, dir, 'package.json');

  let packageJson;
  try {
    packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  } catch {
    continue;
  }

  if (packageJson.private) continue;

  packageJson.version = version;
  writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);

  console.log(`${packageJson.name}@${version}`);
}
