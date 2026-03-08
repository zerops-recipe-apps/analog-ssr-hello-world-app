# Analog SSR Hello World Recipe App

<!--#ZEROPS_EXTRACT_START:intro#-->
A server-side rendered [Analog](https://analogjs.org) application — Angular's meta-framework powered by Vite and Nitro — connected to a PostgreSQL database on [Zerops](https://zerops.io). Demonstrates idempotent database migrations and a health check endpoint that queries live data from the database.
<!--#ZEROPS_EXTRACT_END:intro#-->
Used within [Analog SSR Hello World recipe](https://app.zerops.io/recipes/analog-ssr-hello-world) for [Zerops](https://zerops.io) platform.

⬇️ **Full recipe page and deploy with one-click**

[![Deploy on Zerops](https://github.com/zeropsio/recipe-shared-assets/blob/main/deploy-button/light/deploy-button.svg)](https://app.zerops.io/recipes/analog-ssr-hello-world?environment=small-production)

![analog cover](https://github.com/zeropsio/recipe-shared-assets/blob/main/covers/svg/cover-analog.svg)

## Integration Guide

<!--#ZEROPS_EXTRACT_START:integration-guide#-->

### 1. Adding `zerops.yaml`

The main application configuration file you place at the root of your repository. It tells Zerops how to build, deploy, and run your application.

```yaml
# Zerops build/deploy pipeline for Analog SSR.
# Two setups: 'prod' for optimized SSR deployments,
# 'dev' for interactive SSH development.
zerops:
  - setup: prod
    build:
      base: nodejs@22

      buildCommands:
        # npm ci installs exact versions from package-lock.json —
        # deterministic builds, no unexpected dep upgrades.
        - npm ci
        # Bundle pg into migrate.cjs before the main build so the
        # migration script is self-contained (no NODE_PATH required).
        - node scripts/bundle-migrate.mjs
        # Vite/Analog build: compiles Angular client bundle and runs
        # Nitro to produce dist/analog/ — a self-contained server
        # artifact. No node_modules needed at runtime.
        - npm run build

      deployFiles:
        # Analog's Nitro preset bundles all server dependencies into
        # dist/analog/ — no node_modules needed at runtime. Only the
        # migration script (with pg bundled inside) is listed separately.
        - dist/analog
        - migrate.cjs

      cache:
        - node_modules

    # Readiness check: Zerops verifies each new container passes
    # before the project balancer routes traffic to it.
    deploy:
      readinessCheck:
        httpGet:
          port: 3000
          path: /

    run:
      base: nodejs@22

      # Migration runs once per deploy version across all containers.
      # initCommands — not buildCommands — so schema and code change
      # atomically; a failed deploy cannot leave a migrated DB with
      # old application code.
      # zsc execOnce prevents concurrent execution when minContainers > 1.
      initCommands:
        - zsc execOnce ${appVersionId} -- node migrate.cjs

      ports:
        - port: 3000
          httpSupport: true

      envVariables:
        NODE_ENV: production
        # DB_NAME matches the hostname of the db service below.
        DB_NAME: db
        # Referencing pattern: ${hostname_key} resolves at runtime
        # using Zerops-generated variables for the 'db' service.
        DB_HOST: ${db_hostname}
        DB_PORT: ${db_port}
        DB_USER: ${db_user}
        DB_PASS: ${db_password}

      start: node dist/analog/server/index.mjs

  - setup: dev
    build:
      base: nodejs@22
      # Ubuntu gives a richer toolset (git, editors, debuggers)
      # for interactive development via SSH.
      os: ubuntu

      buildCommands:
        # npm install (not npm ci) — tolerates missing lock file
        # in fresh developer checkouts.
        - npm install

      # Deploy full source tree so the developer has everything
      # available after SSH-ing in.
      deployFiles: ./

      cache:
        - node_modules

    run:
      base: nodejs@22
      os: ubuntu

      # Migration still runs in dev so the database is ready
      # immediately when the developer SSH-s in.
      initCommands:
        - zsc execOnce ${appVersionId} -- node migrate.js

      ports:
        - port: 3000
          httpSupport: true

      envVariables:
        NODE_ENV: development
        DB_NAME: db
        DB_HOST: ${db_hostname}
        DB_PORT: ${db_port}
        DB_USER: ${db_user}
        DB_PASS: ${db_password}

      # zsc noop keeps the container running without starting a server.
      # The developer SSH-s in and runs 'npm run dev' manually.
      start: zsc noop --silent
```

<!--#ZEROPS_EXTRACT_END:integration-guide#-->
