/// <reference types="vitest" />

import { defineConfig } from 'vite';
import analog from '@analogjs/platform';
import { readFileSync } from 'node:fs';

// Read version at build time — node_modules must be installed first (npm ci)
const analogPkg = JSON.parse(
  readFileSync('./node_modules/@analogjs/platform/package.json', 'utf-8')
) as { version: string };

const ANALOG_VERSION = JSON.stringify(analogPkg.version);
const BUILD_TIME = JSON.stringify(new Date().toISOString());

export default defineConfig(({ mode }) => ({
  plugins: [
    analog({
      nitro: {
        // node-server preset produces .output/server/index.mjs —
        // a self-contained Nitro bundle with all dependencies.
        preset: 'node-server',

        // replace: applied by Nitro's Rollup build to server routes in
        // both dev (Nitro dev server) and prod (bundled .output/).
        // Use this for server-side constants — top-level 'define' below
        // covers the Angular client bundle.
        replace: {
          __ANALOG_VERSION__: ANALOG_VERSION,
          __BUILD_TIME__: BUILD_TIME,
        },
      },
      ssr: true,
    }),
  ],

  // define: applied by Vite to client-side (Angular) code.
  // Combined with nitro.replace above, both bundles receive the values.
  define: {
    __ANALOG_VERSION__: ANALOG_VERSION,
    __BUILD_TIME__: BUILD_TIME,
  },

  build: {
    target: ['es2020'],
  },

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['**/*.spec.ts'],
  },
}));
