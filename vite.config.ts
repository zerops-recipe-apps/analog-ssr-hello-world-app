/// <reference types="vitest" />

import { defineConfig } from 'vite';
import analog from '@analogjs/platform';
import angular from '@analogjs/vite-plugin-angular';
import nitro from '@analogjs/vite-plugin-nitro';
import { readFileSync } from 'node:fs';

// Read version at build time — node_modules must be installed first (npm ci)
const analogPkg = JSON.parse(
  readFileSync('./node_modules/@analogjs/platform/package.json', 'utf-8')
) as { version: string };

const ANALOG_VERSION = JSON.stringify(analogPkg.version);
const BUILD_TIME = JSON.stringify(new Date().toISOString());

export default defineConfig(({ mode }) => ({
  plugins: [
    // Analog 3 no longer composes Angular or Nitro. analog() keeps SSR
    // options; nitro() writes dist/analog/server, which zerops.yaml starts.
    analog({
      ssr: true,
    }),
    angular(),
    nitro({
      preset: 'node-server',
      // Applied by Nitro's Rollup build to server routes in dev and prod.
      // Top-level define below covers the Angular client bundle.
      replace: {
        __ANALOG_VERSION__: ANALOG_VERSION,
        __BUILD_TIME__: BUILD_TIME,
      },
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
