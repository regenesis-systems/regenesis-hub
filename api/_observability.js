/**
 * Sentry/GlitchTip bootstrap for regenesis-hub serverless functions.
 *
 * GlitchTip is fully Sentry-API-compatible, so we use the standard
 * @sentry/node package -- it just sends events to our GlitchTip URL
 * (https://errors.thequietpilgrim.com) instead of sentry.io.
 *
 * Pattern:
 *
 *   const { withSentry } = require('./_observability');
 *
 *   module.exports = withSentry(async (req, res) => {
 *     // ... handler logic
 *   }, 'my-handler');
 *
 * The DSN is read from the SENTRY_DSN environment variable (set in
 * Vercel project settings). If unset or empty, Sentry is a safe no-op.
 *
 * Note the leading underscore in the filename: Vercel does NOT treat
 * files whose names start with `_` as routable serverless functions,
 * so this helper lives alongside api/*.js without creating a route.
 */

let initialized = false;
let Sentry = null;

function ensureInit() {
  if (initialized) return Sentry;
  initialized = true;

  const dsn = (process.env.SENTRY_DSN || '').trim();
  if (!dsn) return null;

  try {
    Sentry = require('@sentry/node');
  } catch (e) {
    Sentry = null;
    return null;
  }

  Sentry.init({
    dsn,
    environment: process.env.ENVIRONMENT || 'production',
    release: process.env.RELEASE_VERSION || 'unknown',
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
    profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'),
    sendDefaultPii: false,
  });

  return Sentry;
}

/**
 * Wrap a Vercel serverless handler so uncaught exceptions are reported
 * to GlitchTip before being re-thrown to Vercel's default error handling.
 *
 * @param {Function} handler  - async (req, res) => ...
 * @param {string}   [route]  - Optional route tag (e.g. 'serve', 'whoami')
 * @returns {Function} wrapped handler
 */
function withSentry(handler, route) {
  return async function wrappedHandler(req, res) {
    const s = ensureInit();
    if (!s) {
      // Sentry disabled -- run the handler as-is.
      return handler(req, res);
    }

    try {
      if (route) s.setTag('route', `hub-${route}`);
      return await handler(req, res);
    } catch (err) {
      try {
        s.captureException(err);
        // Give Sentry a moment to flush before the lambda terminates.
        if (typeof s.flush === 'function') {
          await s.flush(2000);
        }
      } catch (_) {
        // Never let observability failures mask the original error.
      }
      throw err;
    }
  };
}

module.exports = { withSentry, ensureInit };
