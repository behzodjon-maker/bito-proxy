const express = require('express');
const cors = require('cors');
const https = require('https');

const app = express();
app.use(cors());

const TARGET_HOST = '65.21.188.215';

app.use('/proxy', (req, res) => {
  const options = {
    hostname: TARGET_HOST,
    port: 443,
    path: req.url,
    method: req.method,
    headers: {
      Authorization: req.headers['authorization'] || '',
      Accept: 'application/json',
    },
    rejectUnauthorized: false,
  };

  const proxyReq = https.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    proxyRes.pipe(res);
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
