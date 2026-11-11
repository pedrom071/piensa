/* Agenda P!ensa — utilidades compartidas por el sitio público y el creador. */
(function () {
  'use strict';
  var AP = window.AP = window.AP || {};
  AP.config = window.AGENDA_CONFIG || {};

  /* ---------- DOM ---------- */
  AP.h = function (tag, props) {
    var el = document.createElement(tag);
    if (props) Object.keys(props).forEach(function (k) {
      var v = props[k];
      if (v === undefined || v === null || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'value') el.value = v;
      else if (k === 'checked') el.checked = !!v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    });
    AP.agregar(el, Array.prototype.slice.call(arguments, 2));
    return el;
  };

  AP.agregar = function (el, hijos) {
    hijos.forEach(function (c) {
      if (c === null || c === undefined || c === false || c === '') return;
      if (Array.isArray(c)) return AP.agregar(el, c);
      el.appendChild(typeof c === 'object' ? c : document.createTextNode(String(c)));
    });
    return el;
  };

  AP.pintar = function (el) {
    el.replaceChildren();
    return AP.agregar(el, Array.prototype.slice.call(arguments, 1));
  };

  /* ---------- API (Apps Script) ---------- */
  AP.api = function (accion, datos) {
    if (AP.apiLocal) return AP.apiLocal(accion, datos || {}); // vista previa y pruebas
    if (!AP.config.api) return Promise.reject(new Error('Falta configurar la dirección de la API en js/config.js.'));
    var cuerpo = JSON.stringify(Object.assign({ accion: accion }, datos || {}));
    return fetch(AP.config.api, { method: 'POST', body: cuerpo, credentials: 'omit', redirect: 'follow' })
      .then(function (r) {
        if (!r.ok) throw new Error('No pudimos conectar con la agenda (error ' + r.status + '). Intenta de nuevo.');
        return r.json();
      }, function () {
        throw new Error('No pudimos conectar con la agenda. Revisa tu conexión a internet e intenta de nuevo.');
      })
      .then(function (j) {
        if (!j || !j.ok) {
          var err = new Error((j && j.error) || 'Ocurrió un error.');
          throw err;
        }
        return j.datos;
      });
  };

  /** Separa el código interno de algunos errores ("TOMADO|mensaje"). */
  AP.codigoError = function (err) {
    var m = String((err && err.message) || err || '');
    var k = m.indexOf('|');
    return k > 0 && /^[A-Z]+$/.test(m.slice(0, k)) ? { codigo: m.slice(0, k), mensaje: m.slice(k + 1) } : { codigo: '', mensaje: m };
  };

  /* ---------- Fechas y horas ---------- */
  var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  AP.DIAS = DIAS;
  AP.MESES = MESES;
  var mayus = function (s) { return s.charAt(0).toUpperCase() + s.slice(1); };
  AP.mayus = mayus;

  AP.partesFecha = function (fecha) {
    var p = String(fecha).split('-').map(Number);
    var dow = new Date(Date.UTC(p[0], p[1] - 1, p[2])).getUTCDay();
    return {
      anio: p[0], mesNum: p[1], num: p[2], dow: DIAS[dow], dowCorto: DIAS[dow].slice(0, 3), mes: MESES[p[1] - 1], mesCorto: MESES[p[1] - 1].slice(0, 3),
      larga: mayus(DIAS[dow]) + ' ' + p[2] + ' de ' + MESES[p[1] - 1],
      corta: mayus(DIAS[dow].slice(0, 3)) + ' ' + p[2] + ' ' + MESES[p[1] - 1].slice(0, 3),
    };
  };

  AP.aMin = function (hhmm) { var p = String(hhmm).split(':'); return (+p[0]) * 60 + (+p[1]); };
  AP.deMin = function (n) { return ('0' + Math.floor(n / 60)).slice(-2) + ':' + ('0' + (n % 60)).slice(-2); };

  AP.etiquetaVentana = function (desde, hasta) {
    var h = AP.aMin(desde) / 60;
    return { parte: h < 13 ? 'Mañana' : (h < 19 ? 'Tarde' : 'Noche'), rango: desde + ' a ' + hasta };
  };

  /** Arma los días y horarios a partir de los bloques (igual que el servidor). Para la vista previa del creador. */
  AP.calcularDias = function (horarios, duracion, pausa) {
    duracion = Math.max(5, +duracion || 30);
    var paso = Math.max(5, duracion + Math.max(0, +pausa || 0));
    var ventanas = (horarios || []).filter(function (h) { return h.fecha && /^\d{2}:\d{2}$/.test(h.desde) && /^\d{2}:\d{2}$/.test(h.hasta) && AP.aMin(h.hasta) > AP.aMin(h.desde); })
      .slice().sort(function (a, b) { return (a.fecha + a.desde) < (b.fecha + b.desde) ? -1 : 1; });
    var dias = [], vistos = {};
    ventanas.forEach(function (v) {
      var dia = dias[dias.length - 1];
      if (!dia || dia.fecha !== v.fecha) {
        var e = AP.partesFecha(v.fecha);
        dia = { fecha: v.fecha, etiqueta: e.larga, corta: e.corta, libres: 0, ventanas: [] };
        dias.push(dia);
      }
      var bloques = [];
      for (var ini = AP.aMin(v.desde); ini + duracion <= AP.aMin(v.hasta); ini += paso) {
        var clave = v.fecha + ' ' + AP.deMin(ini);
        if (vistos[clave]) continue;
        vistos[clave] = true;
        bloques.push({ clave: clave, hora: AP.deMin(ini), termino: AP.deMin(ini + duracion) });
      }
      var et = AP.etiquetaVentana(v.desde, v.hasta);
      dia.ventanas.push({ etiqueta: et.parte + ' · ' + et.rango, bloques: bloques });
      dia.libres += bloques.length;
    });
    return dias;
  };

  /* ---------- Marca ---------- */
  AP.rgba = function (hex, a) {
    var x = String(hex || '#000').replace('#', '');
    if (x.length === 3) x = x.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(x, 16) || 0;
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  };

  AP.textoSobre = function (hex) {
    var x = String(hex || '#000').replace('#', '');
    if (x.length === 3) x = x.split('').map(function (c) { return c + c; }).join('');
    var lin = [0, 2, 4].map(function (i) {
      var c = parseInt(x.substr(i, 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2] > 0.45 ? '#16202c' : '#ffffff';
  };

  AP.esColor = function (v) { return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(v || '').trim()); };

  AP.aplicarMarca = function (el, inst) {
    var c1 = AP.esColor(inst.color1) ? inst.color1 : '#1d2b4f';
    var c2 = AP.esColor(inst.color2) ? inst.color2 : '#e5533d';
    el.style.setProperty('--c1', c1);
    el.style.setProperty('--c2', c2);
    el.style.setProperty('--t1', AP.textoSobre(c1));
    el.style.setProperty('--t2', AP.textoSobre(c2));
    el.style.setProperty('--tinte', AP.rgba(c1, 0.08));
  };

  /** Convierte links de Google Drive a una dirección de imagen directa. */
  AP.urlImagen = function (v) {
    var s = String(v || '').trim();
    if (!s) return '';
    if (/drive\.google\.com|docs\.google\.com/.test(s)) {
      var m = s.match(/(?:\/d\/|[?&]id=)([\w-]{20,})/);
      return m ? 'https://lh3.googleusercontent.com/d/' + m[1] : '';
    }
    if (/^[\w-]{25,}$/.test(s)) return 'https://lh3.googleusercontent.com/d/' + s;
    if (/^(https?:)?\/\//i.test(s) || /^data:image\//.test(s)) return s;
    return '';
  };

  AP.mapa = function (lugar) { return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(lugar); };

  /* ---------- Varios ---------- */
  AP.esCorreo = function (s) { return /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]{2,}$/.test(String(s || '').trim()); };
  AP.primerNombre = function (n) { return String(n || '').trim().split(/\s+/)[0] || ''; };
  AP.urlSitio = function () { return location.origin + location.pathname.replace(/[^/]*$/, ''); };

  AP.avisar = function (texto, malo) {
    document.querySelectorAll('.aviso').forEach(function (a) { a.remove(); });
    var a = AP.h('div', { class: 'aviso' + (malo ? ' malo' : ''), role: 'status' }, texto);
    document.body.appendChild(a);
    setTimeout(function () { a.remove(); }, malo ? 6000 : 3800);
  };

  AP.copiar = function (texto, mensaje) {
    var listo = function () { AP.avisar(mensaje || 'Link copiado.'); };
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(texto).then(listo, function () { AP.copiarRespaldo(texto); listo(); });
    }
    AP.copiarRespaldo(texto);
    listo();
  };
  AP.copiarRespaldo = function (texto) {
    var t = AP.h('textarea', { style: { position: 'fixed', opacity: '0' } });
    t.value = texto;
    document.body.appendChild(t);
    t.select();
    try { document.execCommand('copy'); } catch (e) { /* nada */ }
    t.remove();
  };

  AP.guardarLocal = function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } };
  AP.leerLocal = function (k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
})();
