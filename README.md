# Regenesis Hub

Static HTML dashboard plus a couple of Vercel serverless functions
(`api/serve.js`, `api/whoami.js`) providing basic-auth gating.

Production URL: https://hub.regenesispod.com

## Deploying

All Regenesis web properties deploy to Vercel. This repo is wired up via
the regenesis-systems GitHub App. Pushes to `main` auto-deploy.

## Environment Variables

Set these in the Vercel project settings:

- `SENTRY_DSN` — GlitchTip project DSN (empty = disabled)
- `ENVIRONMENT` — e.g. `production` (default `production`)
- `RELEASE_VERSION` — build tag (default `unknown`)

## Error Tracking

This project sends errors to GlitchTip (Sentry-compatible) at
https://errors.thequietpilgrim.com

Both serverless handlers are wrapped with `withSentry(...)` from
`api/_observability.js`. Files starting with `_` in the `api/` directory
are NOT routable — `_observability.js` is a helper, not an endpoint.

To enable, set `SENTRY_DSN` in Vercel. The project DSN is stored in
Claude's `monitoring_stack.md` memory file.

To temporarily disable, leave `SENTRY_DSN` empty.
