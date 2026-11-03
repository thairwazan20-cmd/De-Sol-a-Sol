(function () {
  'use strict';
  var cfg = JSON.parse(document.getElementById('config').textContent);
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  function abrirWhatsApp(texto) {
    window.open('https://wa.me/' + cfg.whatsapp + '?text=' + encodeURIComponent(texto), '_blank', 'noopener');
  }

  // Fecha local en formato AAAA-MM-DD (toISOString daría la fecha de otro huso horario)
  function hoy() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function noches(a, b) {
    return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);
  }
  function diaSiguiente(a) {
    return new Date(Date.parse(a + 'T00:00:00Z') + 86400000).toISOString().slice(0, 10);
  }
  // AAAA-MM-DD → DD/MM/AAAA, como se escribe en Perú
  function fecha(a) {
    return a.split('-').reverse().join('/');
  }

  // Mensajes automáticos de WhatsApp: los usan los formularios y el chat
  function mensaje(intro, pares) {
    var lineas = pares.filter(function (p) { return p[1]; }).map(function (p) { return '• ' + p[0] + ': ' + p[1]; });
    return [intro, ''].concat(lineas, ['', cfg.t.desdeWeb]).join('\n');
  }
  // d: { llegada, salida, huespedes, bungalow (clave), bungalowTxt, nombre }
  function mensajeReserva(d) {
    var m = cfg.t.msg, n = noches(d.llegada, d.salida), precio = cfg.precios[d.bungalow];
    return mensaje(m[0], [
      [m[1], fecha(d.llegada)], [m[2], fecha(d.salida)], [m[5], n], [m[3], d.huespedes],
      [m[4], d.bungalowTxt], [m[6], precio ? 'S/' + precio * n : ''], [m[7], d.nombre],
    ]);
  }
  // d: { servicio (clave), fecha, personas, nombre, detalles }
  function mensajeCotizacion(d) {
    var m = cfg.cot.msg;
    return mensaje(m[0], [
      [m[1], cfg.cot.opciones[d.servicio]], [m[2], d.fecha ? fecha(d.fecha) : cfg.cot.porDefinir],
      [m[3], d.personas], [m[4], d.nombre], [m[5], d.detalles],
    ]);
  }

  // Efectos al hacer scroll (se omiten si el visitante pidió reducir el movimiento)
  var sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var top = $('.top');
  var fotos = $$('.hero__foto, .subhero__foto');
  var pendiente = false;
  function alDesplazar() {
    pendiente = false;
    var y = window.pageYOffset;
    top.classList.toggle('top--bajo', y > 24);
    if (!sinMovimiento && window.innerWidth > 980 && y < 1200) {
      fotos.forEach(function (f) { f.style.transform = 'translateY(' + Math.round(y * 0.22) + 'px)'; });
    }
  }
  window.addEventListener('scroll', function () {
    if (!pendiente) {
      pendiente = true;
      window.requestAnimationFrame(alDesplazar);
    }
  }, { passive: true });
  alDesplazar();

  function contar(el) {
    var partes = el.textContent.match(/^(\d+)(.*)$/);
    if (!partes) return;
    var fin = Number(partes[1]), inicio = null;
    function paso(t) {
      if (inicio === null) inicio = t;
      var p = Math.min((t - inicio) / 1000, 1);
      el.textContent = Math.round(fin * (1 - Math.pow(1 - p, 3))) + partes[2];
      if (p < 1) window.requestAnimationFrame(paso);
    }
    window.requestAnimationFrame(paso);
  }

  if (!sinMovimiento && 'IntersectionObserver' in window) {
    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        observador.unobserve(el);
        el.classList.add('rv--visto');
        $$('.descuento b', el).forEach(contar);
        // Al terminar se quitan las clases para no interferir con los efectos de hover
        setTimeout(function () {
          el.classList.remove('rv', 'rv--visto');
          el.style.transitionDelay = '';
        }, 1400);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    $$('.cabecera-sec, .tarjeta, .servicio, .intro > *, .seccion .dividido > *, .destacado, .dia, .galeria button, .rutas > div, .faq details, .aviso, .cta .envoltura, .datos, .panel, .seccion > .envoltura > h2').forEach(function (el) {
      var i = Array.prototype.indexOf.call(el.parentNode.children, el);
      el.classList.add('rv');
      el.style.transitionDelay = (i % 4) * 90 + 'ms';
      observador.observe(el);
    });
  }

  // Menú móvil
  var burger = $('.burger'), nav = $('.nav');
  burger.addEventListener('click', function () {
    var abierto = nav.classList.toggle('abierto');
    burger.setAttribute('aria-expanded', String(abierto));
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('abierto')) {
      nav.classList.remove('abierto');
      burger.setAttribute('aria-expanded', 'false');
      burger.focus();
    }
  });

  // Formularios de reserva
  $$('.js-reserva').forEach(function (form) {
    var llegada = form.elements.llegada, salida = form.elements.salida;
    var error = $('.error', form), total = $('.reserva__total', form);
    llegada.min = hoy();
    salida.min = hoy();

    function validar() {
      if (!llegada.value || !salida.value) return cfg.t.errFechas;
      if (llegada.value < hoy()) return cfg.t.errPasado;
      if (salida.value <= llegada.value) return cfg.t.errOrden;
      return '';
    }
    function actualizar() {
      if (llegada.value) {
        salida.min = diaSiguiente(llegada.value);
        if (salida.value && salida.value <= llegada.value) salida.value = '';
      }
      error.hidden = true;
      total.textContent = '';
      if (validar()) return;
      var n = noches(llegada.value, salida.value);
      var precio = cfg.precios[form.elements.bungalow.value];
      var txt = n + ' ' + (n === 1 ? cfg.t.noche : cfg.t.noches);
      if (precio) txt += ' · S/' + (precio * n) + ' ' + cfg.t.estimado;
      total.textContent = txt;
    }
    [llegada, salida, form.elements.bungalow].forEach(function (c) { c.addEventListener('change', actualizar); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = validar();
      if (msg) {
        error.textContent = msg;
        error.hidden = false;
        return;
      }
      var b = form.elements.bungalow, h = form.elements.huespedes;
      abrirWhatsApp(mensajeReserva({
        llegada: llegada.value, salida: salida.value, huespedes: h.options[h.selectedIndex].text,
        bungalow: b.value, bungalowTxt: b.options[b.selectedIndex].text,
      }));
    });
    form._actualizar = actualizar;
  });

  // Diálogo de reserva: los botones [data-reservar] preseleccionan el bungalow
  var dialogo = $('#dialogo-reserva');
  $$('[data-reservar]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var form = $('form', dialogo);
      form.elements.bungalow.value = btn.getAttribute('data-reservar');
      form._actualizar();
      dialogo.showModal();
    });
  });

  // Cotizador de tours y servicios: los botones [data-cotizar] preseleccionan el servicio
  var dialogoCot = $('#dialogo-cotizar'), formCot = $('form', dialogoCot);
  formCot.elements.fecha.min = hoy();
  $$('[data-cotizar]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      formCot.elements.servicio.value = btn.getAttribute('data-cotizar');
      $('.error', formCot).hidden = true;
      dialogoCot.showModal();
    });
  });
  formCot.addEventListener('input', function () { $('.error', formCot).hidden = true; });
  formCot.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = formCot.elements, error = $('.error', formCot);
    var msg = !f.servicio.value ? cfg.cot.errServicio
      : f.fecha.value && f.fecha.value < hoy() ? cfg.t.errPasado
      : !f.nombre.value.trim() ? cfg.cot.errNombre : '';
    error.textContent = msg;
    error.hidden = !msg;
    if (msg) return;
    abrirWhatsApp(mensajeCotizacion({
      servicio: f.servicio.value, fecha: f.fecha.value, personas: f.personas.value,
      nombre: f.nombre.value.trim(), detalles: f.detalles.value.trim(),
    }));
  });

  // Cerrar diálogos con el botón o haciendo clic fuera
  $$('dialog').forEach(function (d) {
    $('.cerrar', d).addEventListener('click', function () { d.close(); });
    d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
  });

  // Galería
  var visor = $('#visor');
  if (visor) {
    var img = $('img', visor);
    $$('[data-foto]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        img.src = btn.getAttribute('data-foto');
        img.alt = $('img', btn).alt;
        visor.showModal();
      });
    });
  }

  // ─── Chat automático ───
  // Responde con los datos de la web, guía la reserva o la cotización paso a paso
  // y deja el mensaje listo para enviarlo por WhatsApp.
  var C = cfg.chat, F = C.flujo;
  var chat = $('#chat'), flotante = $('.wa-flotante'), aviso = $('.chat-aviso');
  var registro = $('.chat__registro', chat), opciones = $('.chat__opciones', chat);
  var formChat = $('.chat__form', chat), entrada = formChat.elements.texto;
  var CLAVE = 'dsas-chat-' + document.documentElement.lang;
  var historial = [], flujo = null, ocupado = false;

  function leer(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function guardar(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* sin almacenamiento */ } }

  function burbuja(texto, clase, sinGuardar) {
    var p = document.createElement('p');
    p.className = 'chat__burbuja' + (clase ? ' ' + clase : '');
    p.textContent = texto;
    registro.appendChild(p);
    registro.scrollTop = registro.scrollHeight;
    if (!sinGuardar) {
      historial.push([texto, clase || '']);
      guardar(CLAVE, JSON.stringify(historial.slice(-40)));
    }
    return p;
  }
  function usuario(texto) { burbuja(texto, 'chat__burbuja--yo'); }

  // Botones de respuesta rápida: {t, f} ejecuta una acción, {t, href} abre un enlace, {fecha, f} pide una fecha
  function chips(lista) {
    opciones.textContent = '';
    lista.forEach(function (c) {
      if (c.fecha) return opciones.appendChild(selectorFecha(c));
      var el = document.createElement(c.href ? 'a' : 'button');
      el.textContent = c.t;
      if (c.wa) el.className = 'chat__chip--wa';
      if (c.href) {
        el.href = c.href;
        if (/^https?:/.test(c.href)) { el.target = '_blank'; el.rel = 'noopener'; }
      } else {
        el.type = 'button';
        el.addEventListener('click', function () { if (!ocupado) c.f(); });
      }
      opciones.appendChild(el);
    });
  }
  function selectorFecha(c) {
    var caja = document.createElement('div'), inp = document.createElement('input'), ok = document.createElement('button');
    caja.className = 'chat__fecha';
    inp.type = 'date';
    inp.min = c.fecha;
    inp.setAttribute('aria-label', c.t);
    ok.type = 'button';
    ok.textContent = F.ok;
    ok.addEventListener('click', function () {
      if (ocupado) return;
      if (!inp.value || inp.value < inp.min) {
        inp.classList.add('chat__fecha--error');
        inp.focus();
        return;
      }
      c.f(inp.value);
    });
    caja.appendChild(inp);
    caja.appendChild(ok);
    return caja;
  }

  function responder(textos, siguientes) {
    ocupado = true;
    chips([]);
    var puntos = burbuja('', 'chat__burbuja--escribiendo', true);
    puntos.innerHTML = '<span></span><span></span><span></span>';
    setTimeout(function () {
      puntos.remove();
      var primera = textos.map(function (t) { return burbuja(t); })[0];
      // Las respuestas largas se leen desde su inicio, no desde el final
      registro.scrollTop = primera.offsetTop - 14;
      ocupado = false;
      chips(siguientes || menu());
    }, 450 + Math.min(textos.join('').length, 500));
  }

  var masOpciones = function () { return { t: C.masOpciones, f: function () { responder([C.otra], menu()); } }; };
  function enviarWa(texto) {
    abrirWhatsApp(texto);
    responder([C.abriendo], [masOpciones()]);
  }
  function menu() {
    var acciones = {
      reservar: function () { iniciar('reserva', {}); },
      cotizar: function () { iniciar('cotizar', {}); },
      persona: function () { usuario(C.op.persona); enviarWa(C.saludo); },
    };
    return Object.keys(C.op).map(function (k) {
      return { t: C.op[k], f: acciones[k] || function () { usuario(C.op[k]); intencion(k); } };
    });
  }

  // Respuesta a cada intención, con los botones que tienen sentido después
  function intencion(k) {
    var R = C.r, cotizar = function (s) { return { t: C.cotizarTour, f: function () { iniciar('cotizar', s ? { servicio: s } : {}); } }; };
    var reservar = { t: C.op.reservar, f: function () { iniciar('reserva', {}); } };
    if (k.indexOf('b:') === 0) {
      var b = k.slice(2);
      return responder([C.bungalows[b].r], [
        { t: C.reservarEste, f: function () { iniciar('reserva', { bungalow: b }); } },
        { t: C.verFotos, href: C.urlBungalows }, masOpciones(),
      ]);
    }
    switch (k) {
      case 'reservar': return iniciar('reserva', {});
      case 'cotizar': return iniciar('cotizar', {});
      case 'bungalows':
        return responder([R.bungalows], C.orden.map(function (b) {
          return { t: C.bungalows[b].n, f: function () { usuario(C.bungalows[b].n); intencion('b:' + b); } };
        }).concat(masOpciones()));
      case 'precios': return responder([R.precios], [reservar, { t: C.op.bungalows, f: function () { usuario(C.op.bungalows); intencion('bungalows'); } }, masOpciones()]);
      case 'tours': return responder([R.tours], [cotizar(''), masOpciones()]);
      case 'paquete': return responder([R.paquete], [cotizar('paquete'), masOpciones()]);
      case 'ballenas': return responder([R.ballenas], [cotizar('ballenas'), masOpciones()]);
      case 'tortugas': return responder([R.tortugas], [cotizar('tortugas'), masOpciones()]);
      case 'surf': return responder([R.surf], [cotizar('surf'), masOpciones()]);
      case 'descuentos': return responder([R.descuentos], [cotizar('paddle'), reservar, masOpciones()]);
      case 'llegar': return responder([R.llegar], [{ t: C.verMapa, href: C.mapa }, masOpciones()]);
      case 'persona':
      case 'contacto':
        return responder([R[k]], [{ t: C.abrirWa, wa: true, f: function () { enviarWa(C.saludo); } }, masOpciones()]);
      default: return responder([R[k], C.otra]);
    }
  }

  // Busca la intención del texto libre (sin tildes ni signos; palabras cortas deben coincidir enteras)
  function normalizar(s) {
    return ' ' + s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim() + ' ';
  }
  function detectar(texto) {
    var t = normalizar(texto), mejor = null, max = 0;
    C.claves.forEach(function (par) {
      var peso = par[0].indexOf('b:') === 0 ? 2 : 1, puntos = 0;
      par[1].forEach(function (p) {
        if (t.indexOf(' ' + p + (p.length <= 3 ? ' ' : '')) >= 0) puntos += peso;
      });
      if (puntos > max) { max = puntos; mejor = par[0]; }
    });
    return mejor;
  }

  // Conversaciones guiadas: cada paso pide un dato; los ya conocidos se saltan
  var numeros = ['1', '2', '3', '4', '5', '6', '7', '8', cfg.t.masDe];
  var PASOS = {
    reserva: [
      { campo: 'llegada', q: F.llegada, tipo: 'fecha', min: function () { return hoy(); } },
      { campo: 'salida', q: F.salida, tipo: 'fecha', min: function (d) { return diaSiguiente(d.llegada); } },
      { campo: 'huespedes', q: F.huespedes, tipo: 'lista', lista: function () { return numeros.map(function (n) { return [n, n]; }); } },
      { campo: 'bungalow', q: F.bungalow, tipo: 'lista', lista: function () {
        return [['', cfg.t.cualquiera]].concat(C.orden.map(function (b) { return [b, C.bungalows[b].n]; }));
      } },
      { campo: 'nombre', q: F.nombre, tipo: 'texto' },
    ],
    cotizar: [
      { campo: 'servicio', q: F.servicio, tipo: 'lista', lista: function () { return Object.keys(C.servicios).map(function (s) { return [s, C.servicios[s]]; }); } },
      { campo: 'fecha', q: F.fecha, tipo: 'fecha', min: function () { return hoy(); }, saltar: F.sinFecha },
      { campo: 'personas', q: F.personas, tipo: 'lista', lista: function () { return numeros.map(function (n) { return [n, n]; }); } },
      { campo: 'nombre', q: F.nombre, tipo: 'texto' },
      { campo: 'detalles', q: F.detalles, tipo: 'texto', saltar: F.sinDetalles },
    ],
  };
  function iniciar(tipo, datos) {
    flujo = { tipo: tipo, d: datos, txt: {} };
    if (datos.bungalow) flujo.txt.bungalow = C.bungalows[datos.bungalow].n;
    if (datos.servicio) flujo.txt.servicio = C.servicios[datos.servicio];
    siguiente();
  }
  function pasoActual() {
    if (!flujo) return null;
    return PASOS[flujo.tipo].filter(function (p) { return flujo.d[p.campo] === undefined; })[0] || null;
  }
  function contestar(p, valor, etiqueta) {
    usuario(etiqueta);
    flujo.d[p.campo] = valor;
    flujo.txt[p.campo] = valor ? etiqueta : '';
    siguiente();
  }
  function siguiente() {
    var p = pasoActual();
    if (!p) return resumen();
    responder([p.q], chipsPaso(p));
    if (p.tipo === 'texto') setTimeout(function () { entrada.focus(); }, 500);
  }
  function chipsPaso(p) {
    var lista = [];
    if (p.tipo === 'fecha') lista.push({ fecha: p.min(flujo.d), t: p.q, f: function (v) { contestar(p, v, fecha(v)); } });
    if (p.tipo === 'lista') {
      lista = p.lista().map(function (o) { return { t: o[1], f: function () { contestar(p, o[0], o[1]); } }; });
    }
    if (p.saltar) lista.push({ t: p.saltar, f: function () { contestar(p, '', p.saltar); } });
    lista.push({ t: F.cancelar, f: function () {
      usuario(F.cancelar);
      flujo = null;
      responder([F.cancelado, C.otra]);
    } });
    return lista;
  }
  function resumen() {
    var tipo = flujo.tipo, d = flujo.d, x = flujo.txt, texto;
    if (tipo === 'reserva') {
      texto = mensajeReserva({ llegada: d.llegada, salida: d.salida, huespedes: d.huespedes, bungalow: d.bungalow, bungalowTxt: x.bungalow || cfg.t.cualquiera, nombre: d.nombre });
    } else {
      texto = mensajeCotizacion(d);
    }
    flujo = null;
    // El resumen muestra los datos sin el saludo ni la firma del mensaje
    var datos = texto.split('\n').filter(function (l) { return l.indexOf('• ') === 0; }).join('\n');
    responder([tipo === 'reserva' ? F.resumenReserva : F.resumenCotizar, datos], [
      { t: F.enviar, wa: true, f: function () { enviarWa(texto); } },
      { t: F.reiniciar, f: function () { iniciar(tipo, {}); } },
      masOpciones(),
    ]);
  }

  formChat.addEventListener('submit', function (e) {
    e.preventDefault();
    var t = entrada.value.trim();
    if (!t || ocupado) return;
    entrada.value = '';
    var p = pasoActual();
    if (p && p.tipo === 'texto') return contestar(p, t, t);
    if (p && p.tipo === 'lista') {
      // Acepta lo escrito si coincide con una opción ("2", "familiar"…)
      var n = normalizar(t), opcion = p.lista().filter(function (o) {
        return normalizar(o[1]).indexOf(n) >= 0 || n.indexOf(normalizar(o[1])) >= 0;
      })[0];
      if (opcion) return contestar(p, opcion[0], opcion[1]);
    }
    usuario(t);
    if (p) return responder([C.elige], chipsPaso(p));
    var k = detectar(t);
    if (k) return intencion(k);
    responder([C.noEntiendo], [
      { t: C.enviarPregunta, wa: true, f: function () { enviarWa(C.preguntaWa + '\n\n' + t); } },
      masOpciones(),
    ]);
  });

  function abrirChat(abierto) {
    chat.hidden = !abierto;
    flotante.setAttribute('aria-expanded', String(abierto));
    aviso.hidden = true;
    if (!abierto) return;
    guardar('dsas-chat-visto', '1');
    if (!registro.firstChild) responder([C.hola]);
    else if (!opciones.firstChild && !ocupado) chips(menu());
    // En el móvil no se enfoca la caja de texto para que el teclado no tape las opciones
    if (window.matchMedia('(pointer: fine)').matches) entrada.focus();
  }
  flotante.addEventListener('click', function (e) {
    e.preventDefault();
    abrirChat(chat.hidden);
  });
  $('.chat__cerrar', chat).addEventListener('click', function () {
    abrirChat(false);
    flotante.focus();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !chat.hidden) {
      abrirChat(false);
      flotante.focus();
    }
  });

  // La conversación sigue al cambiar de página dentro de la misma visita
  try { historial = JSON.parse(leer(CLAVE)) || []; } catch (e) { historial = []; }
  historial.forEach(function (b) { burbuja(b[0], b[1], true); });

  // Aviso junto al botón, una vez por visita
  if (!leer('dsas-chat-visto')) {
    setTimeout(function () { if (chat.hidden) aviso.hidden = false; }, 7000);
  }
  $('.chat-aviso__abrir', aviso).addEventListener('click', function () { abrirChat(true); });
  $('.chat-aviso__cerrar', aviso).addEventListener('click', function () {
    aviso.hidden = true;
    guardar('dsas-chat-visto', '1');
  });

  // Formulario de contacto: abre WhatsApp o el correo con el mensaje listo
  var contacto = $('#form-contacto');
  if (contacto) {
    var leerContacto = function () {
      var f = contacto.elements, nombre = f.nombre.value.trim(), texto = f.mensaje.value.trim();
      var err = $('.error', contacto);
      err.hidden = !!(nombre && texto);
      if (!err.hidden) { err.textContent = cfg.t.errForm; return null; }
      return cfg.t.hola + ' ' + nombre + '.\n• ' + cfg.t.motivo + ': ' + f.motivo.value + '\n\n' + texto + '\n\n' + cfg.t.desdeWeb;
    };
    contacto.addEventListener('submit', function (e) {
      e.preventDefault();
      var t = leerContacto();
      if (t) abrirWhatsApp(t);
    });
    $('#enviar-correo').addEventListener('click', function () {
      var t = leerContacto();
      if (t) location.href = 'mailto:' + cfg.correo + '?subject=' + encodeURIComponent(cfg.t.asunto) + '&body=' + encodeURIComponent(t);
    });
  }

  // ─── Cursor temático ───
  // Un halo de sol sigue al puntero y cambia según lo que señala: palmera en los bungalows,
  // cola de ballena en las experiencias, lupa en las fotos y verde en WhatsApp. Al hacer clic deja una onda.
  // Solo con ratón y si el visitante no pidió reducir el movimiento.
  if (!sinMovimiento && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var svg = function (d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>'; };
    var ICONOS = {
      palma: svg('<path d="M12 21c.4-4 .2-8-1-11"/><path d="M11 10c-1.500-2.500-4.500-3-7-2 2.500.2 4.500 1 7 2zM11 10c.5-3 3-5 6.500-5-2.500 1-4.500 2.500-6.500 5zM11 10c2.500-1 5.500 0 7 2.500-2.500-1-4.500-1.500-7-2.500zM11 10c-2-.5-4.500.5-5.500 3 1.500-1.500 3.500-2.500 5.500-3z"/><path d="M7 21h10"/>'),
      ballena: svg('<path d="M12 21v-5"/><path d="M12 16c-.5-3.500-3.500-6-8-7 1.500 2.500 4.500 4 8 7zM12 16c.5-3.500 3.500-6 8-7-1.500 2.500-4.500 4-8 7z"/><path d="M3 20c1.500 0 1.500-1 3-1s1.500 1 3 1M15 20c1.500 0 1.500-1 3-1s1.500 1 3 1"/>'),
      foto: svg('<circle cx="11" cy="11" r="6"/><path d="m20 20-4.500-4.500M11 8.500v5M8.500 11h5"/>'),
      wa: svg('<path d="M4 20l1.300-3.800A8 8 0 1 1 8 19z"/><path d="M9 9.500c.3 2 2.500 4.200 4.500 4.500l1-1 2 1"/>'),
    };
    var cursor = document.createElement('div');
    cursor.className = 'cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML = '<span class="cursor__halo"></span>' + Object.keys(ICONOS).map(function (k) {
      return '<span class="cursor__icono" data-icono="' + k + '">' + ICONOS[k] + '</span>';
    }).join('');
    document.body.appendChild(cursor);

    var px = 0, py = 0, cx = 0, cy = 0, moviendo = false;
    function seguir() {
      cx += (px - cx) * 0.22;
      cy += (py - cy) * 0.22;
      cursor.style.transform = 'translate(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px)';
      if (Math.abs(px - cx) + Math.abs(py - cy) > 0.3) window.requestAnimationFrame(seguir);
      else moviendo = false;
    }
    document.addEventListener('mousemove', function (e) {
      px = e.clientX;
      py = e.clientY;
      if (!cursor.classList.contains('cursor--visible')) {
        cx = px; cy = py;
        cursor.classList.add('cursor--visible');
      }
      if (!moviendo) {
        moviendo = true;
        window.requestAnimationFrame(seguir);
      }
    }, { passive: true });
    document.addEventListener('mouseout', function (e) {
      // Al salir de la ventana o entrar al mapa (un iframe) el halo se oculta
      if (!e.relatedTarget || e.relatedTarget.tagName === 'IFRAME') cursor.classList.remove('cursor--visible');
    });

    var MODOS = [
      ['texto', 'input, textarea, select, .chat__registro'],
      ['wa', '.btn--wa, .wa-flotante, .red--wa, a[href*="wa.me"], .chat__chip--wa'],
      ['foto', '[data-foto]'],
      ['palma', '.tarjeta, [data-reservar]'],
      ['ballena', '.mosaico, .dia, .descuento, [data-cotizar], .incluye'],
      ['enlace', 'a, button, summary, label'],
    ];
    document.addEventListener('mouseover', function (e) {
      var modo = '';
      for (var i = 0; i < MODOS.length; i++) {
        if (e.target.closest && e.target.closest(MODOS[i][1])) { modo = MODOS[i][0]; break; }
      }
      cursor.setAttribute('data-modo', modo);
    });
    document.addEventListener('mousedown', function (e) {
      var onda = document.createElement('span');
      onda.className = 'cursor-onda';
      onda.setAttribute('aria-hidden', 'true');
      onda.style.left = e.clientX + 'px';
      onda.style.top = e.clientY + 'px';
      document.body.appendChild(onda);
      setTimeout(function () { onda.remove(); }, 700);
    });
  }
})();
