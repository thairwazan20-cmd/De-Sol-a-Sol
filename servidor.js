// Servidor local para ver la web antes de subirla. Uso: npm start
const http = require('http');
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, 'dist');
const PUERTO = Number(process.env.PORT) || 8080;
const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'application/javascript', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain' };
const CSP = "default-src 'self'; img-src 'self' data:; frame-src https://www.google.com; base-uri 'self'; object-src 'none'";

http.createServer((req, res) => {
  const ruta = decodeURIComponent(req.url.split('?')[0]);
  let archivo = path.normalize(path.join(RAIZ, ruta));
  if (!archivo.startsWith(RAIZ)) { res.writeHead(403); return res.end(); }
  if (ruta.endsWith('/')) archivo = path.join(archivo, 'index.html');
  fs.readFile(archivo, (err, datos) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': TIPOS['.html'], 'Content-Security-Policy': CSP });
      return res.end(fs.readFileSync(path.join(RAIZ, '404.html')));
    }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(archivo)] || 'application/octet-stream', 'Content-Security-Policy': CSP });
    res.end(datos);
  });
}).listen(PUERTO, () => console.log(`Web lista en http://localhost:${PUERTO}  (Ctrl+C para cerrar)`));
