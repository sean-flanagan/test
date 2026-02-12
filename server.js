const http = require('http');
const fs = require('fs');
const path = require('path');

const host = '0.0.0.0';
const port = Number(process.env.PORT) || 3000;
const root = __dirname;

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

function safePath(requestPath) {
  const decoded = decodeURIComponent(requestPath.split('?')[0]);
  const normalized = path.normalize(decoded).replace(/^([.][.][/\\])+/, '');
  return path.join(root, normalized === '/' ? 'index.html' : normalized);
}

function sendFile(filePath, res) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const type = contentTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  });
}

http
  .createServer((req, res) => {
    const filePath = safePath(req.url || '/');

    if (!filePath.startsWith(root)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Forbidden');
      return;
    }

    fs.stat(filePath, (err, stats) => {
      if (!err && stats.isDirectory()) {
        return sendFile(path.join(filePath, 'index.html'), res);
      }

      sendFile(filePath, res);
    });
  })
  .listen(port, host, () => {
    console.log(`Neon Snake Arena running on http://${host}:${port}`);
  });
