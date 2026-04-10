const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { withSentry } = require('./_observability');

const USERS = {"justin": "1a66334eaa10bc7be7d8a6668470037f239ab744d2a73052e2bcd5d643606992", "barrie": "c5271e0da36df65e0e6a5a623dcbcb34d6d608bd4254b7805cce90f04d68bbb8", "ami": "7cf9be16dfbfd3c4da44084d85adee2b23a316c1f1539f8f06581c2909ad2539", "tav": "644d969832ded0b1b5fdf1561cffd360358e845ed15d15e2e310c0e8306893a3", "matt": "8f19feeb996e6fdecb9b7c8fa15c997b9f2d3b629c0ea03a1d3b9e3fbd458dff"};

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

module.exports = withSentry(async (req, res) => {
  // Check Authorization header
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Regenesis Dashboard"');
    res.status(401).send('Authentication required.');
    return;
  }

  const decoded = Buffer.from(auth.split(' ')[1], 'base64').toString();
  const [user, pass] = decoded.split(':');
  const hashed = sha256(pass || '');

  if (!USERS[user] || USERS[user] !== hashed) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Regenesis Dashboard"');
    res.status(401).send('Invalid credentials.');
    return;
  }

  // Auth passed — serve the requested file
  let reqPath = req.url.replace(/\?.*$/, '');  // strip query string
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';

  // Only serve HTML files from the root
  const safeName = path.basename(reqPath);
  const filePath = path.join(__dirname, '..', safeName);

  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const ext = path.extname(safeName).toLowerCase();
      const mimeTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml',
      };
      res.setHeader('Content-Type', mimeTypes[ext] || 'text/html');
      res.status(200).send(content);
    } else {
      // Default to index.html
      const indexPath = path.join(__dirname, '..', '_app.html');
      const content = fs.readFileSync(indexPath, 'utf8');
      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(content);
    }
  } catch (e) {
    // Report to Sentry/GlitchTip but preserve the original user-facing
    // 500 response so auth/redirect behavior stays identical.
    try {
      const { ensureInit } = require('./_observability');
      const s = ensureInit();
      if (s) s.captureException(e);
    } catch (_) { /* never mask original error */ }
    res.status(500).send('Internal error');
  }
}, 'serve');
