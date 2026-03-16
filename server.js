const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const MIME = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff2':'font/woff2',
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,x-api-key',
};

// ── Anthropic proxy ───────────────────────────────────────────────────────────
function proxyAnthropic(req, res) {
  let body = '';
  req.on('data', c => (body += c));
  req.on('end', () => {
    const apiKey = req.headers['x-api-key'] || '';
    if (!apiKey.startsWith('sk-ant-')) {
      res.writeHead(401, { 'Content-Type': 'application/json', ...CORS_HEADERS });
      return res.end(JSON.stringify({ error: 'Missing or invalid Anthropic API key' }));
    }

    const options = {
      hostname: 'api.anthropic.com',
      path:     '/v1/messages',
      method:   'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
    };

    const proxy = https.request(options, (apiRes) => {
      let data = '';
      apiRes.on('data', c => (data += c));
      apiRes.on('end', () => {
        res.writeHead(apiRes.statusCode, {
          'Content-Type': 'application/json',
          ...CORS_HEADERS,
        });
        res.end(data);
      });
    });

    proxy.on('error', (err) => {
      res.writeHead(502, { 'Content-Type': 'application/json', ...CORS_HEADERS });
      res.end(JSON.stringify({ error: err.message }));
    });

    proxy.write(body);
    proxy.end();
  });
}

// ── Main server ───────────────────────────────────────────────────────────────
http.createServer((req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    return res.end();
  }

  // Anthropic proxy route
  if (req.method === 'POST' && req.url === '/api/generate') {
    return proxyAnthropic(req, res);
  }

  // Static file serving
  let url = req.url.split('?')[0];
  if (url === '/') url = '/index.html';
  const filePath = path.join(__dirname, url);
  const ext = path.extname(filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not found');
    }
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'text/plain',
      ...CORS_HEADERS,
    });
    res.end(data);
  });
}).listen(PORT, () =>
  console.log(`\n🚀  Maxhope.AI server  →  http://localhost:${PORT}\n   /api/generate  →  Anthropic proxy ready\n`)
);
