# analog-ssr-hello-world-app

Analog (Angular meta-framework) SSR via Nitro node-server preset with PostgreSQL and bundled migration script on Zerops nodejs@24.

## Zerops service facts

- HTTP port: `3000`
- Siblings: `db` (PostgreSQL) — env: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`
- Runtime base: `nodejs@24`

## Zerops dev

`setup: dev` idles on `zsc noop --silent`; the agent starts the dev server.

- Dev command: `npm run dev`
- In-container rebuild without deploy: `npm run build`

**All platform operations (start/stop/status/logs of the dev server, deploy, env / scaling / storage / domains) go through the Zerops development workflow via `zcp` MCP tools. Don't shell out to `zcli`.**

## Notes

- Nitro preset is `node-server` — output is `dist/analog/server/index.mjs`, self-contained (no `node_modules` at prod runtime).
- `migrate.cjs` is pre-bundled with `pg` via `scripts/bundle-migrate.mjs` so it runs in `initCommands` without `NODE_PATH` gymnastics.
- Favicon lives in `public/favicon.ico`.
