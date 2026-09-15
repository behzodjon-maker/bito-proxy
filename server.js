const express = require('express');
const cors = require('cors');
const https = require('https');

const app = express();
app.use(cors());

const TARGET_HOST = '65.21.188.215';

app.use('/proxy', (req, res) => {
  const fullUrl = new URL(req.url, `https://${TARGET_HOST}`);

  // Allow passing the token as ?_auth_token=... for easy browser testing
  const tokenFromQuery = fullUrl.searchParams.get('_auth_token');
  fullUrl.searchParams.delete('_auth_token');

  const authHeader = tokenFromQuery
    ? `Bearer ${tokenFromQuery}`
    : (req.headers['authorization'] || '');

  const options = {
    hostname: TARGET_HOST,
    port: 443,
    path: fullUrl.pathname + fullUrl.search,
    method: req.method,
    headers: {
      Authorization: authHeader,
      Accept: 'application/json',
    },
    rejectUnauthorized: false,
  };

  const proxyReq = https.request(options, (proxyRes) => {
    let data = [];
    proxyRes.on('data', (chunk) => data.push(chunk));
    proxyRes.on('end', () => {
      const body = Buffer.concat(data).toString();
      res.writeHead(proxyRes.statusCode, {
        'Content-Type': proxyRes.headers['content-type'] || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-Proxy-Target-Status': proxyRes.statusCode,
      });
      res.end(body);
    });
  });

  proxyReq.on('error', (err) => {
    res.status(502).json({ error: 'proxy_failed', message: err.message });
  });

  proxyReq.end();
});

app.get('/', (req, res) => {
  res.send('BITO proxy ishlayapti. /proxy/api/v1/... orqali foydalaning.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
