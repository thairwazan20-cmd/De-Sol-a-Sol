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
      var b = form.elements.bungalow, h = form.elements.huespedes, m = cfg.t.msg;
      abrirWhatsApp([
        m[0], '',
        m[1] + ': ' + llegada.value,
        m[2] + ': ' + salida.value,
        m[3] + ': ' + h.options[h.selectedIndex].text,
        m[4] + ': ' + b.options[b.selectedIndex].text,
      ].join('\n'));
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

  // Chat automático: responde con los datos de la web y sigue la conversación en WhatsApp
  var chat = $('#chat'), flotante = $('.wa-flotante');
  var registro = $('.chat__registro', chat), formChat = $('.chat__form', chat);
  var escribiendo = false;
  function burbuja(texto, clase) {
    var p = document.createElement('p');
    p.className = 'chat__burbuja' + (clase ? ' ' + clase : '');
    p.textContent = texto;
    registro.appendChild(p);
    registro.scrollTop = registro.scrollHeight;
    return p;
  }
  function responder(textos) {
    escribiendo = true;
    var puntos = burbuja('...', 'chat__burbuja--escribiendo');
    setTimeout(function () {
      puntos.remove();
      var primera = textos.map(function (t) { return burbuja(t); })[0];
      // Las respuestas largas se leen desde su inicio, no desde el final
      registro.scrollTop = primera.offsetTop - 14;
      escribiendo = false;
    }, 600);
  }
  function abrirChat(abierto) {
    chat.hidden = !abierto;
    flotante.setAttribute('aria-expanded', String(abierto));
    if (abierto) {
      if (!registro.firstChild) responder([cfg.chat.hola]);
      $('button[data-op]', chat).focus();
    }
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
  $$('[data-op]', chat).forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (escribiendo) return;
      var op = btn.getAttribute('data-op');
      if (op === 'reservar') {
        abrirChat(false);
        $('[data-reservar=""]').click();
      } else if (op === 'persona') {
        abrirWhatsApp(cfg.chat.saludo);
      } else {
        burbuja(btn.textContent, 'chat__burbuja--yo');
        responder([cfg.chat.respuestas[op], cfg.chat.otra]);
      }
    });
  });
  formChat.addEventListener('submit', function (e) {
    e.preventDefault();
    var t = formChat.elements.texto.value.trim();
    if (!t) return;
    burbuja(t, 'chat__burbuja--yo');
    formChat.reset();
    abrirWhatsApp(t);
  });

  // Formulario de contacto: abre WhatsApp o el correo con el mensaje listo
  var contacto = $('#form-contacto');
  if (contacto) {
    var leer = function () {
      var nombre = contacto.elements.nombre.value.trim(), mensaje = contacto.elements.mensaje.value.trim();
      var err = $('.error', contacto);
      err.hidden = !!(nombre && mensaje);
      if (!err.hidden) { err.textContent = cfg.t.errForm; return null; }
      return cfg.t.hola + ' ' + nombre + '.\n\n' + mensaje;
    };
    contacto.addEventListener('submit', function (e) {
      e.preventDefault();
      var t = leer();
      if (t) abrirWhatsApp(t);
    });
    $('#enviar-correo').addEventListener('click', function () {
      var t = leer();
      if (t) location.href = 'mailto:' + cfg.correo + '?subject=' + encodeURIComponent(cfg.t.asunto) + '&body=' + encodeURIComponent(t);
    });
  }
})();
