// Bundles migrate.js + pg into a self-contained migrate.cjs.
// Runs in buildCommands after npm ci, before npm run build.
// Result is deployed alongside .output/ and used in initCommands.

import { build } from 'esbuild';

await build({
  entryPoints: ['migrate.js'],
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'cjs',
  outfile: 'migrate.cjs',
  // pg uses native bindings optionally — mark pg-native as external
  // so esbuild skips it (pure-JS pg works fine without it).
  external: ['pg-native'],
});

console.log('migrate.cjs bundled successfully');
