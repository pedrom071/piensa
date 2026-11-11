/* Agenda P!ensa — editor de logos: quitar fondo, recortar márgenes y versión blanca (todo en el navegador). */
(function () {
  'use strict';
  var AP = window.AP;
  var h = AP.h;

  /** Busca el color de fondo mirando el borde de la imagen. Devuelve [r, g, b] o null si ya es transparente o no es parejo. */
  function detectarFondo(px, w, alto) {
    var grupos = {}, total = 0, transparentes = 0;
    var paso = Math.max(1, Math.floor((w + alto) / 500));
    function muestra(x, y) {
      var i = (y * w + x) * 4;
      total++;
      if (px[i + 3] < 30) { transparentes++; return; }
      var k = (px[i] >> 4) + ',' + (px[i + 1] >> 4) + ',' + (px[i + 2] >> 4);
      var g = grupos[k] || (grupos[k] = { n: 0, r: 0, g: 0, b: 0 });
      g.n++; g.r += px[i]; g.g += px[i + 1]; g.b += px[i + 2];
    }
    for (var x = 0; x < w; x += paso) { muestra(x, 0); muestra(x, alto - 1); }
    for (var y = 0; y < alto; y += paso) { muestra(0, y); muestra(w - 1, y); }
    if (transparentes > total * 0.5) return null;
    var mejor = null;
    Object.keys(grupos).forEach(function (k) { if (!mejor || grupos[k].n > mejor.n) mejor = grupos[k]; });
    if (!mejor || mejor.n < (total - transparentes) * 0.35) return null;
    return [mejor.r / mejor.n, mejor.g / mejor.n, mejor.b / mejor.n];
  }

  /** Procesa la imagen según las opciones. Devuelve { canvas, fondo }. */
  AP.procesarLogo = function (img, op) {
    var w0 = img.naturalWidth || img.width || 600, h0 = img.naturalHeight || img.height || 200;
    var k = Math.min(1200 / w0, 480 / h0, w0 < 400 ? 2 : 1);
    var w = Math.max(1, Math.round(w0 * k)), alto = Math.max(1, Math.round(h0 * k));
    var c = document.createElement('canvas');
    c.width = w; c.height = alto;
    var ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, w, alto);
    var datos = ctx.getImageData(0, 0, w, alto), px = datos.data;
    var fondo = null;

    if (op.quitar) {
      fondo = detectarFondo(px, w, alto);
      if (fondo) {
        var tol = 8 + op.sens * 1.6, suave = 24 + op.sens * 0.4;
        var dist = function (i) {
          var dr = px[i] - fondo[0], dg = px[i + 1] - fondo[1], db = px[i + 2] - fondo[2];
          return Math.sqrt(dr * dr + dg * dg + db * db);
        };
        var aplicar = function (i, d) {
          if (d <= tol) px[i + 3] = 0;
          else if (d < tol + suave) px[i + 3] = Math.round(px[i + 3] * (d - tol) / suave);
        };
        if (op.interior) {
          for (var i = 0; i < px.length; i += 4) if (px[i + 3]) aplicar(i, dist(i));
        } else {
          var visto = new Uint8Array(w * alto), cola = new Int32Array(w * alto), ini = 0, fin = 0;
          var empujar = function (x, y) {
            var p = y * w + x;
            if (visto[p]) return;
            visto[p] = 1;
            var i = p * 4, d = px[i + 3] === 0 ? 0 : dist(i);
            if (d < tol + suave) { aplicar(i, d); if (d <= tol) cola[fin++] = p; }
          };
          for (var x = 0; x < w; x++) { empujar(x, 0); empujar(x, alto - 1); }
          for (var y = 0; y < alto; y++) { empujar(0, y); empujar(w - 1, y); }
          while (ini < fin) {
            var p = cola[ini++], px0 = p % w, py0 = (p / w) | 0;
            if (px0 > 0) empujar(px0 - 1, py0);
            if (px0 < w - 1) empujar(px0 + 1, py0);
            if (py0 > 0) empujar(px0, py0 - 1);
            if (py0 < alto - 1) empujar(px0, py0 + 1);
          }
        }
      }
    }
    if (op.blanco) {
      for (var j = 0; j < px.length; j += 4) if (px[j + 3]) { px[j] = 255; px[j + 1] = 255; px[j + 2] = 255; }
    }
    ctx.putImageData(datos, 0, 0);

    if (op.recortar) {
      var x1 = w, y1 = alto, x2 = -1, y2 = -1;
      for (var yy = 0; yy < alto; yy++) {
        for (var xx = 0; xx < w; xx++) {
          if (px[(yy * w + xx) * 4 + 3] > 12) {
            if (xx < x1) x1 = xx; if (xx > x2) x2 = xx;
            if (yy < y1) y1 = yy; if (yy > y2) y2 = yy;
          }
        }
      }
      if (x2 >= x1 && y2 >= y1 && (x2 - x1 + 1 < w || y2 - y1 + 1 < alto)) {
        var pad = Math.round(Math.min(w, alto) * 0.03);
        x1 = Math.max(0, x1 - pad); y1 = Math.max(0, y1 - pad);
        x2 = Math.min(w - 1, x2 + pad); y2 = Math.min(alto - 1, y2 + pad);
        var r = document.createElement('canvas');
        r.width = x2 - x1 + 1; r.height = y2 - y1 + 1;
        r.getContext('2d').drawImage(c, x1, y1, r.width, r.height, 0, 0, r.width, r.height);
        c = r;
      }
    }
    return { canvas: c, fondo: fondo };
  };

  function hex(rgb) {
    return '#' + rgb.map(function (v) { return ('0' + Math.round(v).toString(16)).slice(-2); }).join('');
  }

  /**
   * Abre el editor de logos. fuente: { archivo: File } o { dataUrl: '...' }.
   * Devuelve una promesa con { base64, blanco } o null si se cancela.
   */
  AP.editorLogo = function (fuente, opciones) {
    opciones = opciones || {};
    return new Promise(function (resolver) {
      var op = { quitar: true, sens: 30, interior: true, recortar: true, blanco: false };
      var img = new Image();
      var vistas = [h('img', { alt: '' }), h('img', { alt: '' }), h('img', { alt: '' })];
      var info = h('span', { class: 'info-fondo' }, 'Cargando la imagen…');
      var controles = h('div', { class: 'dlg-ops' });
      var resultado = null, temporizador = null, urlObjeto = null;
      var dlg = h('dialog', { class: 'dlg', 'aria-label': 'Ajustar logo' });
      var usar = h('button', { class: 'b b-prin', type: 'button', disabled: true, onclick: function () {
        if (resultado) cerrar({ base64: resultado.canvas.toDataURL('image/png').split(',')[1], blanco: op.blanco });
      } }, 'Usar este logo');

      function cerrar(valor) {
        if (urlObjeto) URL.revokeObjectURL(urlObjeto);
        dlg.close(); dlg.remove(); resolver(valor);
      }
      dlg.addEventListener('cancel', function (e) { e.preventDefault(); cerrar(null); });

      function figura(im, texto, clase, estilo) {
        return h('figure', null, h('div', { class: clase, style: estilo || null }, im), h('figcaption', null, texto));
      }
      AP.pintar(dlg, h('div', { class: 'dlg-int' },
        h('div', { class: 'dlg-cab' }, h('h2', null, opciones.titulo || 'Ajustar logo'),
          h('button', { type: 'button', class: 'dlg-x', 'aria-label': 'Cerrar', onclick: function () { cerrar(null); } }, '×')),
        h('div', { class: 'dlg-vistas' },
          figura(vistas[0], 'Fondo transparente', 'v tablero'),
          figura(vistas[1], 'Sobre blanco', 'v', { background: '#ffffff' }),
          figura(vistas[2], 'Sobre el color principal', 'v', { background: opciones.color1 || '#1d2b4f' })),
        controles,
        h('div', { class: 'dlg-pie' }, h('button', { class: 'b b-borde', type: 'button', onclick: function () { cerrar(null); } }, 'Cancelar'), usar)));
      document.body.appendChild(dlg);
      dlg.showModal();
      pintarControles();

      img.onload = function () { usar.disabled = false; procesar(); };
      img.onerror = function () { info.textContent = 'No pudimos leer esa imagen. Prueba con un PNG o JPG.'; };
      if (fuente.archivo) { urlObjeto = URL.createObjectURL(fuente.archivo); img.src = urlObjeto; }
      else img.src = fuente.dataUrl;

      function procesar() {
        clearTimeout(temporizador);
        temporizador = setTimeout(function () {
          if (!img.complete || !img.naturalWidth && !img.width) return;
          resultado = AP.procesarLogo(img, op);
          var url = resultado.canvas.toDataURL('image/png');
          vistas.forEach(function (v) { v.src = url; });
          if (!op.quitar) info.textContent = '';
          else if (resultado.fondo) AP.pintar(info, 'Fondo detectado: ', h('span', { class: 'muestra-color', style: { background: hex(resultado.fondo) } }), hex(resultado.fondo) + '.');
          else info.textContent = 'No encontramos un fondo parejo: tu logo ya parece tener fondo transparente.';
        }, 40);
      }

      function fila(clave, titulo, ayuda) {
        return h('label', { class: 'toggle-fila' },
          h('input', { type: 'checkbox', class: 'interruptor', checked: op[clave], onchange: function (e) { op[clave] = e.target.checked; pintarControles(); procesar(); } }),
          h('div', null, h('b', null, titulo), ayuda ? h('span', null, ayuda) : null));
      }

      function pintarControles() {
        AP.pintar(controles,
          fila('quitar', 'Quitar el fondo', info),
          op.quitar ? h('div', { class: 'f sens' }, h('label', { for: 'sens-logo' }, 'Sensibilidad'),
            h('input', { id: 'sens-logo', type: 'range', min: 0, max: 100, value: op.sens, oninput: function (e) { op.sens = +e.target.value; procesar(); } }),
            h('span', { class: 'ayuda' }, 'Súbela si quedan restos del fondo; bájala si se borran partes del logo.')) : null,
          op.quitar ? fila('interior', 'Quitar también el fondo dentro de las letras', 'Por ejemplo, el blanco dentro de una "o". Apágalo si tu logo tiene partes del mismo color que el fondo.') : null,
          fila('recortar', 'Recortar los bordes vacíos', 'Así todos los logos se ven del mismo alto.'),
          fila('blanco', 'Versión blanca', 'Pinta el logo de blanco para ponerlo directo sobre el color principal.'));
      }
    });
  };
})();
