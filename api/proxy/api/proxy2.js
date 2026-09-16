const https = require('https');

module.exports = async function handler(req, res) {
  const TARGET_HOST = '65.21.188.215';

  const urlObj = new URL(req.url, 'http://localhost');

  const targetPath = urlObj.searchParams.get('_path') || '/';
  urlObj.searchParams.delete('_path');

  const tokenFromQuery = urlObj.searchParams.get('_auth_token');
  urlObj.searchParams.delete('_auth_token');

  const authHeader = tokenFromQuery
    ? `Bearer ${tokenFromQuery}`
    : (req.headers['authorization'] || '');

  const options = {
    hostname: TARGET_HOST,
    port: 443,
    path: targetPath + urlObj.search,
    method: req.method,
    headers: {
      Authorization: authHeader,
      Accept: 'application/json',
    },
    rejectUnauthorized: false,
  };

  await new Promise((resolve) => {
    const proxyReq = https.request(options, (proxyRes) => {
      let chunks = [];
      proxyRes.on('data', (chunk) => chunks.push(chunk));
      proxyRes.on('end', () => {
        const body = Buffer.concat(chunks).toString();
        res.status(proxyRes.statusCode);
        res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(body);
        resolve();
      });
    });

    proxyReq.on('error', (err) => {
      res.status(502).json({ error: 'proxy_failed', message: err.message });
      resolve();
    });

    proxyReq.end();
  });
};
