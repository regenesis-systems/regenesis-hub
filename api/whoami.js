const crypto = require('crypto');

module.exports = (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Basic ')) {
    res.status(401).send('');
    return;
  }
  const decoded = Buffer.from(auth.split(' ')[1], 'base64').toString();
  const user = decoded.split(':')[0];
  res.setHeader('Content-Type', 'text/plain');
  res.status(200).send(user);
};
