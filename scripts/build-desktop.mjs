import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const outdir = path.join(repoRoot, 'apps/desktop/build');

await mkdir(outdir, { recursive: true });

await build({
  entryPoints: [
    path.join(repoRoot, 'apps/desktop/src/main.ts'),
    path.join(repoRoot, 'apps/desktop/src/preload.ts'),
  ],
  outdir,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  sourcemap: true,
  external: ['electron'],
  logLevel: 'info',
});
