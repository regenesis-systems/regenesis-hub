// Unauthenticated liveness probe for Uptime Kuma.
// Intentionally minimal: confirms serverless function cold-start + TLS + DNS.
module.exports = (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send('ok');
};
