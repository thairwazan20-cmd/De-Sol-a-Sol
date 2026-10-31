# Web de De Sol a Sol Bungalows

## Verla en tu computadora
Haz doble clic en `ver-sitio.bat`. Se abre en http://localhost:8080. Para cerrarla, cierra la ventana negra.

## Cambiar precios, teléfono o WhatsApp
1. Edita `datos.js` (los textos están en `contenido.js`).
2. Abre una terminal en esta carpeta y ejecuta `npm run build`.
3. Sube de nuevo el contenido de `dist/`.

## Publicarla en el hosting
Esto reemplaza la web actual de WordPress. Hazlo en este orden:
1. Crea una copia de seguridad completa desde el panel del hosting.
2. Saca WordPress de `public_html` (muévelo a una carpeta de respaldo, no lo borres todavía).
3. Sube a `public_html` **todo el contenido** de `dist/`, incluido el archivo oculto `.htaccess`.
4. Purga la caché del hosting.
5. Comprueba: `http://` redirige a `https://`, `/home/` redirige al inicio y el botón de idioma funciona.
6. En Google Search Console, envía `https://desolasolbungalows.com/sitemap.xml`.
