const crypto = require('crypto');
const { withSentry } = require('./_observability');

module.exports = withSentry(async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Basic ')) {
    res.status(401).send('');
    return;
  }
  const decoded = Buffer.from(auth.split(' ')[1], 'base64').toString();
  const user = decoded.split(':')[0];
  res.setHeader('Content-Type', 'text/plain');
  res.status(200).send(user);
}, 'whoami');
