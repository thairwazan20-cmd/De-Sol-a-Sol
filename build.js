// Genera la web completa en la carpeta dist/. Uso: npm run build
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const D = require('./datos');
const C = require('./contenido');

const DIST = path.join(__dirname, 'dist');
const CACHE = path.join(__dirname, '.cache-img');
const ANCHOS = [480, 960, 1600];
const CON_MARCA = ['exterior-dia', 'exterior-noche', 'terraza-noche', 'bungalow-fachada', 'familiar-literas', 'familiar-cama']; // llevan el logo en la esquina inferior: se recorta
const dim = {};

async function procesarFotos() {
  fs.mkdirSync(CACHE, { recursive: true });
  const dest = path.join(DIST, 'assets/img');
  fs.mkdirSync(dest, { recursive: true });
  for (const f of fs.readdirSync(path.join(__dirname, 'fotos'))) {
    const nombre = path.parse(f).name;
    const orig = path.join(__dirname, 'fotos', f);
    if (nombre === 'logo' || nombre === 'favicon') continue;
    const m = await sharp(orig).metadata();
    const alto = CON_MARCA.includes(nombre) ? Math.round(m.height * 0.85) : m.height;
    dim[nombre] = alto / m.width;
    for (const w of ANCHOS) {
      const cache = path.join(CACHE, `${nombre}-${w}.webp`);
      if (!fs.existsSync(cache)) {
        await sharp(orig).extract({ left: 0, top: 0, width: m.width, height: alto }).resize({ width: w }).webp({ quality: w > 960 ? 74 : 78 }).toFile(cache);
      }
      fs.copyFileSync(cache, path.join(dest, `${nombre}-${w}.webp`));
    }
  }
  const logo = sharp(path.join(__dirname, 'fotos/logo.png')).trim();
  await logo.clone().resize({ width: 300 }).png({ compressionLevel: 9, palette: true }).toFile(path.join(dest, 'logo.png'));
  const lm = await sharp(path.join(dest, 'logo.png')).metadata();
  dim.logo = lm.height / lm.width;
  await sharp(path.join(__dirname, 'fotos/favicon.png')).toFile(path.join(DIST, 'favicon.png'));
  await sharp(path.join(__dirname, 'fotos/favicon.png')).resize(180, 180).toFile(path.join(DIST, 'apple-touch-icon.png'));
  await sharp(path.join(__dirname, 'fotos/exterior-noche.png')).resize(1200, 630, { fit: 'cover', position: 'top' }).jpeg({ quality: 78 }).toFile(path.join(dest, 'compartir.jpg'));
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function img(nombre, alt, sizes, { prioridad = false, ancho = 960 } = {}) {
  const set = ANCHOS.map((w) => `/assets/img/${nombre}-${w}.webp ${w}w`).join(', ');
  const h = Math.round(ancho * dim[nombre]);
  const carga = prioridad ? 'fetchpriority="high"' : 'loading="lazy"';
  return `<img src="/assets/img/${nombre}-960.webp" srcset="${set}" sizes="${sizes}" width="${ancho}" height="${h}" alt="${esc(alt)}" decoding="async" ${carga}>`;
}

const I = {
  wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>',
  fb: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"/></svg>',
  ig: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"/></svg>',
  globo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.500 5.600 12 3z"/></svg>',
  burger: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  cama: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6M3 16h18M3 18v2M21 18v2M6 10V7a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v3"/></svg>',
  ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.500 4.500 4.500L19 7.500"/></svg>',
  wifi: '<path d="M3 9.500a14 14 0 0 1 18 0M6.500 13a9 9 0 0 1 11 0M10 16.500a4 4 0 0 1 4 0"/><circle cx="12" cy="19.500" r=".6"/>',
  pool: '<path d="M3 18c1.500 0 1.500 1 3 1s1.500-1 3-1 1.500 1 3 1 1.500-1 3-1 1.500 1 3 1 1.500-1 3-1M3 14c1.500 0 1.500 1 3 1s1.500-1 3-1 1.500 1 3 1 1.500-1 3-1 1.500 1 3 1 1.500-1 3-1M8 12V6a2 2 0 0 1 4 0M15 12V6a2 2 0 0 1 4 0M8 9h7"/>',
  bath: '<path d="M3 12h18v2a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5zM6 12V6a2 2 0 0 1 3.500-1.300M7 19l-1 2M17 19l1 2"/>',
  tv: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M8 21h8M9 2l3 4 3-4"/>',
  fan: '<circle cx="12" cy="11" r="8"/><circle cx="12" cy="11" r="1.300"/><path d="M12 19v2M8 22h8M12 9.700c0-2 .8-3.700 2-3.700s2 1.500.5 3-2.500 1-2.500.7zM13.200 11.600c1.700 1 2.800 2.600 2.200 3.600s-2.300.6-2.900-1.400-.1-2.400.7-2.200zM10.800 11.600c-1.700 1-3.700 1.100-4.200.1s.7-2.300 2.700-1.800 1.800 1.400 1.500 1.700z"/>',
  wash: '<rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="13" r="4.500"/><path d="M7.500 6.500h.01M10.500 6.500h.01"/>',
};
const icono = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>`;

const FOTO = { matrimonial: 'matrimonial', terraza: 'terraza', doble: 'doble', vista: 'vista', triple: 'triple', grupal: 'grupal', familiar: 'familiar-literas' };
const ORDEN = Object.keys(FOTO);
const RUTAS = { 404: '/', inicio: '/', bungalows: '/bungalows/', experiencias: '/experiencias/', contacto: '/contacto/', privacidad: '/privacidad/' };
const url = (t, r) => t.prefijo + RUTAS[r];
const waUrl = (texto) => `https://wa.me/${D.whatsapp}?text=${encodeURIComponent(texto)}`;

// Logo de una red social; con conTexto muestra también el nombre al lado
function red(n, nombre, href, conTexto = false, texto = nombre) {
  return `<a class="red-enlace" href="${href}" target="_blank" rel="noopener"${conTexto ? '' : ` aria-label="${esc(nombre)}" title="${esc(nombre)}"`}><span class="red red--${n}">${I[n]}</span>${conTexto ? texto : ''}</a>`;
}

// Respuestas automáticas del chat, armadas con los mismos datos que muestra la web
function chatCfg(t) {
  const c = t.chat, e = t.exp, lista = t.habitaciones.lista;
  return {
    hola: c.hola, otra: c.otra, saludo: c.saludo,
    respuestas: {
      precios: [c.preciosIntro, ...ORDEN.map((k) => `${lista[k][0]}: ${D.precios[k] ? `S/${D.precios[k]} ${t.porNoche}` : t.consultar}`)].join('\n'),
      servicios: t.habitaciones.texto,
      tours: [`${e.eyebrow}: ${e.texto}`, e.temporada, `${e.otras}: ${e.lista.join(', ')}.`].join('\n\n'),
      llegar: t.contacto.rutas.map(([a, x]) => `${a}: ${x}`).join('\n\n'),
    },
  };
}

// Banda de datos destacados; el primero muestra el precio más bajo de datos.js
function destacados(t) {
  const minimo = Math.min(...Object.values(D.precios).filter(Boolean));
  return `<section class="destacados"><div class="envoltura destacados__fila">${t.destacados.map(([v, n], i) => `<div class="destacado"><p class="destacado__nota">${n}</p><p class="destacado__valor">${i === 0 ? `S/${minimo} <small>${v}</small>` : v}</p></div>`).join('')}</div></section>`;
}

// Cabecera de las páginas interiores, con foto de fondo
const subheroFoto = (foto) => `<div class="subhero__foto">${img(foto, '', '100vw', { prioridad: true, ancho: 1600 })}</div>`;

function chat(t) {
  const c = t.chat;
  return `<section class="chat" id="chat" aria-label="${esc(c.titulo)}" hidden>
  <header class="chat__cabecera"><span class="red red--wa">${I.wa}</span><div><p class="chat__nombre">${c.titulo}</p><p class="chat__estado">${c.estado}</p></div><button class="chat__cerrar" type="button" aria-label="${t.cerrar}">×</button></header>
  <div class="chat__registro" aria-live="polite"></div>
  <div class="chat__opciones">${Object.entries(c.op).map(([k, v]) => `<button type="button" data-op="${k}">${v}</button>`).join('')}</div>
  <form class="chat__form"><label class="oculto" for="chat-texto">${c.escribe}</label><input id="chat-texto" name="texto" placeholder="${esc(c.escribe)}" autocomplete="off"><button type="submit" aria-label="${esc(c.enviar)}" title="${esc(c.enviar)}">${I.wa}</button></form>
</section>`;
}

function formReserva(t, idBase) {
  const f = t.form;
  const op = ORDEN.map((k) => `<option value="${k}">${esc(t.habitaciones.lista[k][0])}</option>`).join('');
  const hues = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `<option${n === 2 ? ' selected' : ''}>${n}</option>`).join('') + `<option>${f.masDe}</option>`;
  return `<form class="reserva js-reserva" novalidate>
  <p class="reserva__titulo">${f.titulo}</p>
  <div class="reserva__campos">
    <div class="campo"><label for="${idBase}-llegada">${f.llegada}</label><input id="${idBase}-llegada" name="llegada" type="date" required></div>
    <div class="campo"><label for="${idBase}-salida">${f.salida}</label><input id="${idBase}-salida" name="salida" type="date" required></div>
    <div class="campo campo--ancho"><label for="${idBase}-huespedes">${f.huespedes}</label><select id="${idBase}-huespedes" name="huespedes">${hues}</select></div>
    <div class="campo campo--ancho"><label for="${idBase}-bungalow">${f.bungalow}</label><select id="${idBase}-bungalow" name="bungalow"><option value="">${f.cualquiera}</option>${op}</select></div>
    <button class="btn btn--wa" type="submit">${I.wa}${f.enviar}</button>
  </div>
  <p class="error" role="alert" hidden></p>
  <div class="reserva__pie"><span>${f.nota}</span><span class="reserva__total" aria-live="polite"></span></div>
</form>`;
}

function tarjeta(t, k) {
  const [nombre, desc, camas, alt] = t.habitaciones.lista[k];
  const p = D.precios[k];
  const precio = p ? `<p class="precio">S/${p}<small>${t.porNoche}</small></p>` : `<p class="precio precio--consulta">${t.consultar}</p>`;
  return `<article class="tarjeta">
  <div class="tarjeta__foto">${img(FOTO[k], alt, '(max-width: 620px) 100vw, (max-width: 980px) 50vw, 33vw')}</div>
  <div class="tarjeta__cuerpo">
    <h3>${esc(nombre)}</h3>
    <p>${esc(desc)}</p>
    <p class="camas">${I.cama}<span>${esc(camas)}</span></p>
    <div class="tarjeta__pie">${precio}<button class="btn btn--mar" type="button" data-reservar="${k}">${t.reservar}</button></div>
  </div>
</article>`;
}

function pagina(t, ruta, cuerpo, { titulo, desc, noindex = false } = {}) {
  const [mt, md] = t.meta[ruta] || [titulo, desc];
  const otra = t.lang === 'es' ? C.en : C.es;
  const canon = D.dominio + url(t, ruta);
  const nav = ['inicio', 'bungalows', 'experiencias', 'contacto'].map((r) => `<li><a href="${url(t, r)}"${r === ruta ? ' aria-current="page"' : ''}>${t.nav[r]}</a></li>`).join('');
  const preciosCfg = JSON.stringify({
    whatsapp: D.whatsapp, correo: D.correo, precios: D.precios,
    t: { ...t.form, hola: t.contacto.msgHola, asunto: t.contacto.asunto, errForm: t.contacto.errForm }, chat: chatCfg(t),
  }).replace(/</g, '\\u003c');
  const ld = ruta === 'inicio' ? `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org', '@type': 'LodgingBusiness', name: 'De Sol a Sol Bungalows', url: D.dominio + '/', image: D.dominio + '/assets/img/compartir.jpg',
    telephone: D.telefonos[0].enlace, email: D.correo, priceRange: 'S/140+', sameAs: [D.facebook, D.instagram],
    address: { '@type': 'PostalAddress', streetAddress: 'Puerto Antiguo', addressLocality: 'Los Órganos', addressRegion: 'Piura', postalCode: '20811', addressCountry: 'PE' },
    amenityFeature: ['Wifi', 'Pool', 'Laundry'].map((name) => ({ '@type': 'LocationFeatureSpecification', name, value: true })),
  })}</script>` : '';
  const alternos = noindex ? '' : `<link rel="canonical" href="${canon}">
<link rel="alternate" hreflang="es" href="${D.dominio + url(C.es, ruta)}">
<link rel="alternate" hreflang="en" href="${D.dominio + url(C.en, ruta)}">
<link rel="alternate" hreflang="x-default" href="${D.dominio + url(C.es, ruta)}">`;
  return `<!doctype html>
<html lang="${t.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(mt)}</title>
<meta name="description" content="${esc(md)}">
${noindex ? '<meta name="robots" content="noindex">' : ''}
${alternos}
<meta property="og:type" content="website">
<meta property="og:site_name" content="De Sol a Sol Bungalows">
<meta property="og:title" content="${esc(mt)}">
<meta property="og:description" content="${esc(md)}">
<meta property="og:url" content="${canon}">
<meta property="og:image" content="${D.dominio}/assets/img/compartir.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="${t.locale}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#08303c">
<link rel="icon" href="/favicon.png" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preload" href="/assets/fuentes/fraunces-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/style.css">
${ld}
</head>
<body>
<a class="saltar" href="#contenido">${t.saltar}</a>
<header class="top">
  <div class="envoltura top__fila">
    <a class="logo" href="${url(t, 'inicio')}"><img src="/assets/img/logo.png" width="300" height="${Math.round(300 * dim.logo)}" alt="${esc(t.logoAlt)}"></a>
    <nav class="nav" id="menu" aria-label="${t.lang === 'es' ? 'Principal' : 'Main'}"><ul>${nav}</ul></nav>
    <a class="idioma" href="${url(otra, ruta)}" hreflang="${otra.lang}" lang="${otra.lang}" aria-label="${esc(t.idiomaAria)}">${I.globo}${t.otro}</a>
    <button class="btn btn--sol" type="button" data-reservar="">${t.reservar}</button>
    <button class="burger" type="button" aria-controls="menu" aria-expanded="false" aria-label="${t.menu}">${I.burger}</button>
  </div>
</header>
<main id="contenido">
${cuerpo}
</main>
<footer class="pie">
  <div class="envoltura">
    <div class="pie__rejilla">
      <div><p class="pie__marca">De Sol a Sol Bungalows</p><p>${t.pie.lema}</p><p>${esc(t.contacto.dirTexto)}</p></div>
      <div><h2>${t.pie.explora}</h2><ul>${['inicio', 'bungalows', 'experiencias', 'contacto'].map((r) => `<li><a href="${url(t, r)}">${t.nav[r]}</a></li>`).join('')}</ul></div>
      <div><h2>${t.pie.contacto}</h2><ul>
        ${D.telefonos.map((x) => `<li><a href="tel:${x.enlace}">${x.texto}</a></li>`).join('')}
        <li><a href="mailto:${D.correo}">${D.correo}</a></li>
        <li class="redes">${red('wa', 'WhatsApp', waUrl(t.chat.saludo))}${red('fb', 'Facebook', D.facebook)}${red('ig', 'Instagram', D.instagram)}</li>
      </ul></div>
    </div>
    <div class="pie__base"><span>© ${new Date().getFullYear()} De Sol a Sol Bungalows. ${t.pie.derechos}</span><span><a href="${url(t, 'privacidad')}">${t.pie.privacidad}</a>${D.libroReclamaciones ? ` · <a href="${D.libroReclamaciones}" target="_blank" rel="noopener">${t.pie.reclamos}</a>` : ''}</span></div>
  </div>
</footer>
${chat(t)}
<a class="wa-flotante" href="${waUrl(t.chat.saludo)}" target="_blank" rel="noopener" aria-label="${esc(t.wa)}" title="${esc(t.wa)}" aria-controls="chat" aria-expanded="false">${I.wa}</a>
<dialog class="dialogo" id="dialogo-reserva" aria-label="${esc(t.form.titulo)}"><button class="cerrar" type="button" aria-label="${t.cerrar}">×</button>${formReserva(t, 'dlg')}</dialog>
<script type="application/json" id="config">${preciosCfg}</script>
<script src="/assets/main.js" defer></script>
</body>
</html>
`;
}

function inicio(t) {
  const h = t.home, e = t.exp;
  const fotos = [['bungalow-fachada', 0], ['patio', 1], ['rancho', 2], ['entrada', 3], ['hamaca', 4], ['corredor', 5]];
  return `<section class="hero">
  <div class="hero__foto">${img('exterior-noche', t.hero.alt, '100vw', { prioridad: true, ancho: 1600 })}</div>
  <div class="envoltura hero__txt">
    <p class="eyebrow">${t.hero.lugar}</p>
    <h1>${t.hero.titulo}</h1>
    <p class="lead">${t.hero.texto}</p>
    <p class="hero__acciones"><a class="btn btn--sol" href="${url(t, 'bungalows')}">${h.verTodos}</a><button class="btn btn--cristal" type="button" data-reservar="">${t.reservar}</button></p>
  </div>
</section>
<div class="envoltura reserva-flotante">${formReserva(t, 'ini')}</div>
${destacados(t)}
<section class="seccion"><div class="envoltura intro">
  <div class="intro__fotos">${img('exterior-dia', t.intro.a1, '(max-width: 980px) 90vw, 45vw')}${img('terraza-noche', t.intro.a2, '(max-width: 980px) 50vw, 24vw')}</div>
  <div><p class="eyebrow">${t.intro.eyebrow}</p><h2>${t.intro.titulo}</h2><p class="lead">${t.intro.texto}</p></div>
</div></section>
<section class="seccion seccion--arena"><div class="envoltura">
  <div class="cabecera-sec"><div><p class="eyebrow">${h.habEyebrow}</p><h2>${h.habTitulo}</h2></div><a class="btn btn--linea" href="${url(t, 'bungalows')}">${h.verTodos}</a></div>
  <div class="rejilla">${['matrimonial', 'vista', 'familiar'].map((k) => tarjeta(t, k)).join('')}</div>
</div></section>
<section class="seccion seccion--mar"><div class="envoltura">
  <div class="cabecera-sec"><div><p class="eyebrow">${h.servEyebrow}</p><h2>${h.servTitulo}</h2></div></div>
  <div class="servicios">${t.servicios.map(([i, n, d]) => `<div class="servicio">${icono(i)}<div><h3>${n}</h3><p>${d}</p></div></div>`).join('')}</div>
</div></section>
<section class="seccion"><div class="envoltura dividido">
  <div class="mosaico">${img('ballena', e.aBallena, '(max-width: 980px) 90vw, 45vw')}${img('tortugas', e.aTortuga, '(max-width: 980px) 45vw, 22vw')}${img('paddle', e.aPaddle, '(max-width: 980px) 45vw, 22vw')}</div>
  <div><p class="eyebrow">${h.expEyebrow}</p><h2>${h.expTitulo}</h2><p class="lead">${h.expTexto}</p>
    <div class="descuentos">${e.dcto.map(([p, d]) => `<div class="descuento"><b>${p}</b>${d}</div>`).join('')}</div>
    <p class="nota">${e.dctoNota}</p><p class="con-aire"><a class="btn btn--mar" href="${url(t, 'experiencias')}">${h.expVer}</a></p>
  </div>
</div></section>
<section class="seccion seccion--arena"><div class="envoltura">
  <div class="cabecera-sec"><h2>${h.galeria}</h2></div>
  <div class="galeria">${fotos.map(([f, i]) => `<button type="button" data-foto="/assets/img/${f}-1600.webp" aria-label="${esc(t.verFoto)}: ${esc(t.galeriaAlts[i])}">${img(f, t.galeriaAlts[i], '(max-width: 620px) 50vw, 40vw')}<span class="galeria__pie" aria-hidden="true">${esc(t.galeriaAlts[i])}</span></button>`).join('')}</div>
</div></section>
<section class="seccion cta"><div class="cta__foto">${img('rancho', '', '100vw', { ancho: 1600 })}</div><div class="envoltura"><h2>${h.ctaTitulo}</h2><p class="lead">${h.ctaTexto}</p><button class="btn btn--sol" type="button" data-reservar="">${t.reservar}</button></div></section>
<dialog class="visor" id="visor"><button class="cerrar" type="button" aria-label="${t.cerrar}">×</button><img src="/assets/img/bungalow-fachada-480.webp" alt=""></dialog>`;
}

function bungalows(t) {
  const h = t.habitaciones;
  return `<section class="subhero subhero--foto">${subheroFoto('bungalow-fachada')}<div class="envoltura"><p class="eyebrow">${t.hero.lugar}</p><h1>${h.titulo}</h1><p class="lead">${h.texto}</p></div></section>
<section class="seccion seccion--arena"><div class="envoltura"><div class="rejilla">${ORDEN.map((k) => tarjeta(t, k)).join('')}</div></div></section>
<section class="seccion"><div class="envoltura">${formReserva(t, 'pag')}</div></section>`;
}

function experiencias(t) {
  const e = t.exp;
  const dia = (d, f, a) => `<article class="dia">${img(f, a, '(max-width: 620px) 100vw, 50vw')}<div><p class="eyebrow">${d[0]}</p><h3>${d[1]}</h3><p>${d[2]}</p></div></article>`;
  return `<section class="subhero subhero--foto">${subheroFoto('ballena')}<div class="envoltura dividido">
  <div><p class="eyebrow">${e.eyebrow}</p><h1>${e.titulo}</h1><p class="lead">${e.texto}</p><p class="con-aire"><a class="btn btn--wa" href="https://wa.me/${D.whatsapp}?text=${encodeURIComponent(e.eyebrow + ': ' + e.titulo)}" target="_blank" rel="noopener">${I.wa}${e.consultar}</a></p></div>
  <div><h2>${e.incluye}</h2><ul class="incluye">${e.items.map((x) => `<li>${I.ok}${x}</li>`).join('')}</ul></div>
</div></section>
<section class="seccion seccion--arena"><div class="envoltura">
  <h2>${e.itin}</h2>
  <div class="dias">${dia(e.dia1, 'ballena', e.aBallena)}${dia(e.dia2, 'tortugas', e.aTortuga)}</div>
  <p class="aviso">${e.temporada}</p>
</div></section>
<section class="seccion"><div class="envoltura dividido">
  <div><h2>${e.otras}</h2><p class="lead">${e.otrasTexto}</p><ul class="pastillas">${e.lista.map((x) => `<li>${x}</li>`).join('')}</ul>
    <h3 class="con-aire">${e.dctoT}</h3><div class="descuentos">${e.dcto.map(([p, d]) => `<div class="descuento"><b>${p}</b>${d}</div>`).join('')}</div><p class="nota">${e.dctoNota}</p></div>
  <div>${img('paddle', e.aPaddle, '(max-width: 980px) 90vw, 45vw')}</div>
</div></section>`;
}

function contacto(t) {
  const c = t.contacto;
  const q = encodeURIComponent('Hotel De Sol a Sol, Los Órganos, Piura, Perú');
  return `<section class="subhero subhero--foto">${subheroFoto('exterior-dia')}<div class="envoltura"><h1>${c.titulo}</h1><p class="lead">${c.texto}</p></div></section>
<section class="seccion seccion--arena"><div class="envoltura contacto">
  <div class="datos">
    <div><h2>${c.direccion}</h2><p>${esc(c.dirTexto)}</p></div>
    <div><h2>${c.tel}</h2><div class="datos__enlaces">${D.telefonos.map((x) => `<a href="tel:${x.enlace}">${x.texto}</a>`).join('')}</div></div>
    <div><h2>WhatsApp</h2>${red('wa', 'WhatsApp', waUrl(t.chat.saludo), true, D.telefonos[0].texto)}</div>
    <div><h2>${c.correo}</h2><a href="mailto:${D.correo}">${D.correo}</a></div>
    <div><h2>${c.redes}</h2><div class="datos__enlaces">${red('fb', 'Facebook', D.facebook, true)}${red('ig', 'Instagram', D.instagram, true)}</div></div>
  </div>
  <form class="panel" id="form-contacto" novalidate>
    <h2>${c.formT}</h2>
    <div class="campo"><label for="c-nombre">${c.nombre}</label><input id="c-nombre" name="nombre" autocomplete="name" required></div>
    <div class="campo"><label for="c-mensaje">${c.mensaje}</label><textarea id="c-mensaje" name="mensaje" required></textarea></div>
    <div class="panel__botones"><button class="btn btn--wa" type="submit">${I.wa}${c.porWa}</button><button class="btn btn--linea" type="button" id="enviar-correo">${c.porMail}</button></div>
    <p class="error" role="alert" hidden></p>
  </form>
</div></section>
<section class="seccion" id="llegar"><div class="envoltura">
  <div class="cabecera-sec"><h2>${c.llegar}</h2><a class="btn btn--linea" href="https://www.google.com/maps/search/?api=1&amp;query=${q}" target="_blank" rel="noopener">${c.abrirMapa}</a></div>
  <div class="rutas">${c.rutas.map(([a, b]) => `<div><h3>${a}</h3><p>${b}</p></div>`).join('')}</div>
  <iframe class="mapa" title="${esc(c.mapa)}" src="https://www.google.com/maps?q=${q}&amp;z=15&amp;output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
</div></section>
<section class="seccion seccion--arena"><div class="envoltura faq">
  <h2 class="sin-aire-abajo">${c.faqT}</h2>
  ${c.faq.map(([p, r]) => `<details><summary>${esc(p)}</summary><p>${esc(r)}</p></details>`).join('\n  ')}
</div></section>`;
}

function privacidad(t) {
  const p = t.privacidad;
  return `<section class="subhero"><div class="envoltura legal"><h1>${p.titulo}</h1>${p.bloques.map(([a, b]) => `<h2>${a}</h2><p>${b}</p>`).join('')}<p class="con-aire"><a href="mailto:${D.correo}">${D.correo}</a></p></div></section>`;
}

function escribir(rel, html) {
  const f = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, html);
}

const HTACCESS = `ErrorDocument 404 /404.html
Options -Indexes
RewriteEngine On

# Siempre HTTPS y sin www
RewriteCond %{HTTPS} off [OR]
RewriteCond %{HTTP_HOST} ^www\\. [NC]
RewriteRule ^(.*)$ https://desolasolbungalows.com/$1 [R=301,L]

# Direcciones de la web anterior
RewriteRule ^home/?$ / [R=301,L]
RewriteRule ^wp-sitemap\\.xml$ /sitemap.xml [R=301,L]

<IfModule mod_headers.c>
  Header always set Strict-Transport-Security "max-age=31536000"
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Content-Security-Policy "default-src 'self'; img-src 'self' data:; frame-src https://www.google.com; base-uri 'self'; object-src 'none'"
</IfModule>
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript image/svg+xml
</IfModule>
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType font/woff2 "access plus 1 year"
  ExpiresByType text/css "access plus 1 week"
  ExpiresByType application/javascript "access plus 1 week"
</IfModule>
`;

(async () => {
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(path.join(DIST, 'assets/fuentes'), { recursive: true });
  await procesarFotos();
  fs.copyFileSync(path.join(__dirname, 'assets/style.css'), path.join(DIST, 'assets/style.css'));
  fs.copyFileSync(path.join(__dirname, 'assets/main.js'), path.join(DIST, 'assets/main.js'));
  for (const f of fs.readdirSync(path.join(__dirname, 'fuentes'))) fs.copyFileSync(path.join(__dirname, 'fuentes', f), path.join(DIST, 'assets/fuentes', f));

  const PAG = { inicio, bungalows, experiencias, contacto, privacidad };
  for (const t of [C.es, C.en]) {
    for (const r of Object.keys(PAG)) {
      escribir(path.join(url(t, r).slice(1), 'index.html'), pagina(t, r, PAG[r](t)));
    }
  }
  const e = C.es.e404, n = C.en.e404;
  escribir('404.html', pagina(C.es, '404', `<section class="subhero"><div class="envoltura"><h1>${e.titulo}</h1><p class="lead">${e.texto}</p><p class="con-aire"><a class="btn btn--mar" href="/">${e.volver}</a></p><p class="con-aire" lang="en">${n.titulo}. <a href="/en/">${n.volver}</a></p></div></section>`, { titulo: e.titulo + ' | De Sol a Sol Bungalows', desc: e.texto, noindex: true }).replace(/<meta property="og:url"[^>]*>\n/, ''));

  const hoy = new Date().toISOString().slice(0, 10);
  const urls = Object.keys(PAG).flatMap((r) => [C.es, C.en].map((t) => `<url><loc>${D.dominio + url(t, r)}</loc><lastmod>${hoy}</lastmod><xhtml:link rel="alternate" hreflang="es" href="${D.dominio + url(C.es, r)}"/><xhtml:link rel="alternate" hreflang="en" href="${D.dominio + url(C.en, r)}"/></url>`));
  escribir('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`);
  escribir('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${D.dominio}/sitemap.xml\n`);
  escribir('.htaccess', HTACCESS);
  console.log('Web generada en dist/');
})().catch((err) => { console.error(err); process.exit(1); });
