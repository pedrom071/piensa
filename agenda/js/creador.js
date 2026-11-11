/* Agenda P!ensa — creador: lista de agendas, editor con vista previa y reservas. */
(function () {
  'use strict';
  var AP = window.AP;
  var h = AP.h;
  var app = document.getElementById('app');
  var CLAVE_LS = 'agendaPiensaAdmin';
  var LOGO_PIENSA = 'https://jovenesliderespiensa.cl/wp-content/uploads/2021/03/piensa.png';
  var PALETAS = [['#1d2b4f', '#e5533d'], ['#0f4c5c', '#f2a541'], ['#2d6a4f', '#e9c46a'], ['#5a2a5e', '#f28482'], ['#22223b', '#4ea8de'], ['#7a1f2b', '#f4d35e'], ['#003049', '#fcbf49']];
  var S = { clave: null, planilla: '', resumen: null, modelo: null, nueva: false, sucio: false, guardando: false, hash: '' };

  /* ---------- Clave ---------- */
  var desdeLink = location.hash.match(/k=([\w-]+)/);
  if (desdeLink) {
    AP.guardarLocal(CLAVE_LS, desdeLink[1]);
    history.replaceState(null, '', location.pathname + location.search + '#/');
  }
  S.clave = AP.leerLocal(CLAVE_LS);

  function admin(accion, datos) {
    return AP.api(accion, Object.assign({ clave: S.clave }, datos || {})).catch(function (err) {
      var e = AP.codigoError(err);
      if (e.codigo === 'CLAVE') { S.clave = null; AP.guardarLocal(CLAVE_LS, null); S.sucio = false; vistaEntrar(e.mensaje); }
      throw new Error(e.mensaje);
    });
  }

  window.addEventListener('hashchange', ruta);
  window.addEventListener('beforeunload', function (e) { if (S.sucio) { e.preventDefault(); e.returnValue = ''; } });
  if (S.clave) iniciar(); else vistaEntrar();

  function iniciar() {
    cargando('Entrando…');
    admin('admin.entrar', { sitio: AP.urlSitio() }).then(function (d) {
      S.planilla = d.planilla;
      ruta();
    }).catch(function (err) { if (S.clave) vistaEntrar(err.message); });
  }

  function ruta() {
    if (!S.clave) return vistaEntrar();
    var actual = location.hash || '#/';
    if (S.sucio && actual !== S.hash) {
      if (!window.confirm('Tienes cambios sin guardar. ¿Salir igual?')) { history.replaceState(null, '', S.hash); return; }
      S.sucio = false;
    }
    S.hash = actual;
    var p = actual.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
    if (p[0] === 'editar' && p[1]) return abrirEditor(p[1]);
    if (p[0] === 'nueva') return abrirNueva(p[1] || null);
    if (p[0] === 'reservas' && p[1]) return vistaReservas(p[1]);
    return vistaLista();
  }

  /* ---------- Estructura ---------- */
  function shell(contenido) {
    AP.pintar(app, h('div', { class: 'creador' },
      h('header', { class: 'barra' }, h('div', { class: 'barra-int' },
        h('a', { class: 'marca-app', href: '#/' }, 'Agenda P!ensa', h('span', null, 'Creador')),
        S.clave ? h('nav', null,
          h('a', { href: '#/' }, 'Tus agendas'),
          S.planilla ? h('a', { href: S.planilla, target: '_blank', rel: 'noopener' }, 'Abrir la planilla') : null,
          h('button', { type: 'button', onclick: salir }, 'Salir')) : null)),
      h('main', { class: 'pagina' }, contenido)));
  }
  function cargando(texto) { shell(h('p', { class: 'cargando-c' }, texto || 'Cargando…')); }
  function falla(err) { shell([h('a', { class: 'volver', href: '#/' }, 'Volver a tus agendas'), h('div', { class: 'error' }, err.message)]); }

  function salir() {
    if (S.sucio && !window.confirm('Tienes cambios sin guardar. ¿Salir igual?')) return;
    S.sucio = false; S.clave = null; AP.guardarLocal(CLAVE_LS, null);
    vistaEntrar();
  }

  function vistaEntrar(error) {
    shell(h('div', { class: 'entrar' },
      h('h1', null, 'Entrar al creador'),
      h('p', null, 'Pega tu clave de administración. Está en la planilla, en el menú Agenda P!ensa, opción "Abrir el creador".'),
      h('form', { onsubmit: function (e) {
          e.preventDefault();
          var v = e.target.elements.clave.value.trim();
          if (!v) return;
          S.clave = v; AP.guardarLocal(CLAVE_LS, v);
          iniciar();
        } },
        h('div', { class: 'f' }, h('label', { for: 'clave' }, 'Clave'),
          h('input', { id: 'clave', name: 'clave', type: 'text', autocomplete: 'off', spellcheck: 'false' })),
        error ? h('div', { class: 'error' }, error) : null,
        h('button', { class: 'b b-prin', type: 'submit', style: { marginTop: '16px', width: '100%' } }, 'Entrar'))));
  }

  /* ---------- Lista ---------- */
  function vistaLista() {
    cargando('Cargando tus agendas…');
    admin('admin.resumen').then(function (d) {
      S.resumen = d; S.planilla = d.planilla;
      pintarLista();
    }).catch(falla);
  }

  function pintarLista() {
    var lista = S.resumen.instancias;
    shell([
      h('div', { class: 'pagina-cab' },
        h('div', null, h('h1', null, 'Tus agendas'),
          h('p', null, 'Cada agenda tiene su link, sus colores, sus horarios y su panel de jurado.')),
        h('a', { class: 'b b-prin', href: '#/nueva' }, 'Crear agenda')),
      lista.length ? h('div', { class: 'agendas' }, lista.map(tarjeta))
        : h('div', { class: 'vacio-ag' }, h('b', null, 'Todavía no tienes agendas'), 'Crea la primera con el botón "Crear agenda".')
    ]);
  }

  function linkReserva(id) { return AP.urlSitio() + '?e=' + encodeURIComponent(id); }
  function linkJurado(id, clave) { return linkReserva(id) + '&modo=jurado&k=' + encodeURIComponent(clave); }

  function rangoFechas(d1, d2) {
    if (!d1) return 'Sin horarios';
    var a = AP.partesFecha(d1), b = AP.partesFecha(d2);
    if (d1 === d2) return a.num + ' de ' + a.mes;
    if (a.mes === b.mes && a.anio === b.anio) return 'del ' + a.num + ' al ' + b.num + ' de ' + b.mes;
    return 'del ' + a.num + ' de ' + a.mes + ' al ' + b.num + ' de ' + b.mes;
  }

  function tarjeta(a) {
    var p = a.desde ? AP.partesFecha(a.desde) : null;
    var pct = a.total ? Math.round(100 * a.agendadas / a.total) : 0;
    var interruptor = h('input', { type: 'checkbox', class: 'interruptor', checked: a.activa, onchange: function (e) {
      var v = e.target.checked;
      admin('admin.activar', { e: a.id, activa: v }).then(function () {
        a.activa = v; pintarLista();
        AP.avisar(v ? 'La agenda está abierta: recibe reservas.' : 'La agenda quedó cerrada.');
      }).catch(function (err) { e.target.checked = !v; AP.avisar(err.message, true); });
    } });
    return h('article', { class: 'ag' },
      h('div', { class: 'ag-sello', style: { background: a.color1, color: a.texto1 } },
        p ? h('div', null, h('b', null, p.num), h('small', null, p.mesCorto)) : h('small', null, 'sin fechas'),
        h('i', { style: { background: a.color2 } })),
      h('div', null,
        h('h2', null, a.titulo),
        h('p', { class: 'ag-sub' }, AP.mayus(rangoFechas(a.desde, a.hasta)) + '. ' + a.modalidad + ', ' + a.duracion + ' min.'),
        h('div', { class: 'ag-barra', role: 'img', 'aria-label': pct + '% reservado' }, h('i', { style: { width: pct + '%', background: a.color2 } })),
        h('p', { class: 'ag-cifras' }, h('b', null, a.agendadas + ' de ' + a.total), ' cupos reservados'),
        a.error ? h('p', { class: 'error' }, a.error) : null),
      h('div', { class: 'ag-acc' },
        h('label', { class: 'estado' }, interruptor, a.activa ? 'Abierta' : 'Cerrada'),
        h('a', { class: 'b b-borde b-chico', href: '#/editar/' + encodeURIComponent(a.id) }, 'Editar'),
        h('a', { class: 'b b-borde b-chico', href: '#/reservas/' + encodeURIComponent(a.id) }, 'Ver reservas'),
        h('button', { class: 'b b-borde b-chico', type: 'button', onclick: function () { AP.copiar(linkReserva(a.id), 'Link para reservar copiado.'); } }, 'Copiar link'),
        a.claveJurado ? h('button', { class: 'b b-borde b-chico', type: 'button', onclick: function () { AP.copiar(linkJurado(a.id, a.claveJurado), 'Link del jurado copiado.'); } }, 'Copiar link del jurado') : null,
        h('a', { class: 'b b-borde b-chico', href: linkReserva(a.id), target: '_blank', rel: 'noopener' }, 'Ver página'),
        h('a', { class: 'b b-borde b-chico', href: '#/nueva/' + encodeURIComponent(a.id) }, 'Duplicar')));
  }

  /* ---------- Editor ---------- */
  function abrirEditor(id) {
    cargando('Abriendo la agenda…');
    admin('admin.instancia', { e: id }).then(function (m) { iniciarEditor(m, false); }).catch(falla);
  }

  function abrirNueva(desde) {
    if (!desde) return iniciarEditor(modeloNuevo(), true);
    cargando('Copiando la agenda…');
    admin('admin.instancia', { e: desde }).then(function (m) {
      m.id = ''; m.titulo = m.titulo + ' (copia)'; m.claveJurado = ''; m.autorizados = [];
      iniciarEditor(m, true);
    }).catch(falla);
  }

  function modeloNuevo() {
    return {
      id: '', activa: true, titulo: '', subtitulo: '', descripcion: '', duracion: 20, pausa: 0, modalidad: 'presencial', lugar: '',
      color1: '#1d2b4f', color2: '#e5533d', logoPiensa: LOGO_PIENSA, logoPrograma: '', logoAliado: '', logosFondo: 'blanco',
      calendario: '', responderA: '', avisoA: '', invitadosFijos: '', claveJurado: '', maxJurados: '',
      campos: [{ etiqueta: 'Teléfono (WhatsApp)', requerido: true, opciones: [] }],
      unaPorCorreo: true, avisoMinimoHoras: 12, respetarOcupado: false, mostrarInvitados: false, recordatorioHoras: 24, mensaje: '',
      horarios: [], jurados: [], autorizados: [],
    };
  }

  function slug(t) {
    return String(t || '').replace(/!/g, 'i').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40).replace(/-+$/, '');
  }

  function hoyChile() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago' }).format(new Date()); }

  function iniciarEditor(m, nueva) {
    m.campos = m.campos || []; m.horarios = m.horarios || []; m.jurados = m.jurados || []; m.autorizados = m.autorizados || [];
    S.modelo = m; S.nueva = nueva; S.sucio = false; S.guardando = false;
    S.slugManual = !nueva || !!m.id;
    var primera = m.horarios.length ? m.horarios.slice().sort(function (a, b) { return a.fecha < b.fecha ? -1 : 1; })[0].fecha : hoyChile();
    S.mes = { y: +primera.slice(0, 4), m: +primera.slice(5, 7) };
    S.hash = location.hash || '#/';
    pintarEditor();
  }

  var E = {}; // contenedores del editor

  function cambio() {
    S.sucio = true;
    actualizarBarra();
    clearTimeout(S.tPrevia);
    S.tPrevia = setTimeout(pintarPrevia, 220);
  }

  function pintarEditor() {
    var m = S.modelo;
    E.horarios = h('div'); E.preguntas = h('div'); E.marca = h('div'); E.jurado = h('div'); E.formato = h('div');
    E.telefono = h('div', { class: 'telefono' });
    E.previa = h('aside', { class: 'previa', 'aria-label': 'Vista previa' },
      h('div', { class: 'previa-cab' }, h('div', null, h('b', null, 'Vista previa'), h('br'), h('span', null, 'Así se ve en un celular. Puedes probarla.')),
        h('button', { class: 'b b-borde b-chico abrir-previa', type: 'button', onclick: function () { E.previa.classList.remove('abierta'); } }, 'Cerrar')),
      E.telefono);
    E.msg = h('span', { class: 'msg' });
    E.btn = h('button', { class: 'b b-prin', type: 'button', onclick: guardar }, S.nueva ? 'Crear agenda' : 'Guardar cambios');

    shell([
      h('a', { class: 'volver', href: '#/' }, 'Volver a tus agendas'),
      h('div', { class: 'pagina-cab' }, h('div', null,
        h('h1', null, S.nueva ? 'Nueva agenda' : (m.titulo || 'Editar agenda')),
        h('p', null, S.nueva ? 'Completa lo básico, elige los días y revisa la vista previa antes de crearla.' : 'Los cambios se ven en la página apenas los guardas.'))),
      h('div', { class: 'editor' },
        h('div', null, secBasico(), E.formato, secHorarios(), secPreguntas(), E.marca, E.jurado, secCorreos(), secReglas()),
        E.previa),
      h('div', { class: 'guardar' }, h('div', { class: 'guardar-int' }, E.msg,
        h('button', { class: 'b b-borde abrir-previa', type: 'button', onclick: function () { E.previa.classList.add('abierta'); } }, 'Vista previa'),
        !S.nueva ? h('a', { class: 'b b-borde', href: linkReserva(m.id), target: '_blank', rel: 'noopener' }, 'Ver página') : null,
        E.btn))
    ]);
    pintarFormato(); pintarHorarios(); pintarPreguntas(); pintarMarca(); pintarJurado();
    actualizarBarra(); pintarPrevia();
  }

  function actualizarBarra() {
    E.msg.textContent = S.guardando ? 'Guardando…' : (S.sucio ? 'Tienes cambios sin guardar' : (S.nueva ? 'Todavía no está creada' : 'Todo guardado'));
    E.msg.className = 'msg' + (S.sucio && !S.guardando ? ' pendiente' : '');
    E.btn.disabled = S.guardando;
    E.btn.textContent = S.guardando ? 'Guardando…' : (S.nueva ? 'Crear agenda' : 'Guardar cambios');
  }

  /* Campos ligados al modelo */
  function texto(etq, clave, op) {
    op = op || {};
    var id = 'f-' + clave;
    var control = h(op.multi ? 'textarea' : 'input', {
      id: id, type: op.multi ? null : (op.tipo || 'text'), value: S.modelo[clave] == null ? '' : String(S.modelo[clave]), placeholder: op.ph || null,
      min: op.min, max: op.max, inputmode: op.modo || null,
      oninput: function (e) { S.modelo[clave] = e.target.value; if (op.alCambiar) op.alCambiar(e.target.value); cambio(); }
    });
    return h('div', { class: 'f' }, h('label', { for: id }, etq), control, op.ayuda ? h('span', { class: 'ayuda' }, op.ayuda) : null);
  }

  function interruptor(clave, titulo, ayuda) {
    return h('label', { class: 'toggle-fila' },
      h('input', { type: 'checkbox', class: 'interruptor', checked: !!S.modelo[clave], onchange: function (e) { S.modelo[clave] = e.target.checked; cambio(); } }),
      h('div', null, h('b', null, titulo), ayuda ? h('span', null, ayuda) : null));
  }

  function seleccion(etq, clave, opciones, ayuda) {
    var actual = String(S.modelo[clave]);
    if (!opciones.some(function (o) { return String(o[0]) === actual; })) opciones = opciones.concat([[actual, actual + ' horas antes']]);
    return h('div', { class: 'f' }, h('label', { for: 'f-' + clave }, etq),
      h('select', { id: 'f-' + clave, onchange: function (e) { S.modelo[clave] = +e.target.value; cambio(); } },
        opciones.map(function (o) { return h('option', { value: o[0], selected: String(o[0]) === actual }, o[1]); })),
      ayuda ? h('span', { class: 'ayuda' }, ayuda) : null);
  }

  function panel(titulo, ayuda) {
    return h('section', { class: 'panel' }, h('h2', null, titulo), ayuda ? h('p', { class: 'ayuda' }, ayuda) : null, Array.prototype.slice.call(arguments, 2));
  }

  /* 1. Lo básico */
  function secBasico() {
    var m = S.modelo;
    var slugInput = h('input', { id: 'f-id', type: 'text', value: m.id, disabled: !S.nueva, spellcheck: 'false',
      oninput: function (e) { S.slugManual = true; m.id = slug(e.target.value); if (e.target.value !== m.id) e.target.value = m.id; cambio(); } });
    return panel('Lo básico', 'Lo primero que ve la persona al abrir el link.',
      texto('Título', 'titulo', { ph: 'Entrevistas Jóvenes Líderes P!ensa 2026', alCambiar: function (v) {
        if (S.nueva && !S.slugManual) { m.id = slug(v); slugInput.value = m.id; }
      } }),
      texto('Texto sobre el título (opcional)', 'subtitulo', { ph: 'Concurso Jóvenes Líderes P!ensa, etapa de entrevistas' }),
      texto('Descripción', 'descripcion', { multi: true, ph: 'Qué es, cuánto dura y qué pasa después de reservar.' }),
      h('div', { class: 'f' }, h('label', { for: 'f-id' }, 'Link'),
        h('div', { class: 'prefijo' }, h('span', null, AP.urlSitio().replace(/^https?:\/\//, '') + '?e='), slugInput),
        h('span', { class: 'ayuda' }, S.nueva ? 'Solo letras minúsculas, números y guiones. Después de crear la agenda no se puede cambiar.' : 'El link no se puede cambiar porque ya puede estar compartido.')),
      interruptor('activa', 'Recibe reservas', 'Apágalo para cerrar la agenda sin borrarla.'));
  }

  /* 2. Formato y lugar */
  function pintarFormato() {
    var m = S.modelo;
    var fichas = function (clave, valores, sufijo) {
      return h('div', { class: 'fichas' }, valores.map(function (v) {
        return h('button', { class: 'ficha', type: 'button', 'aria-pressed': String(+m[clave] === v), onclick: function () {
          m[clave] = v; cambio(); pintarFormato(); pintarHorarios();
        } }, v + sufijo);
      }), h('input', { class: 'inp', type: 'number', min: clave === 'duracion' ? 5 : 0, max: 480, value: m[clave], style: { width: '92px' }, 'aria-label': 'Otro valor',
        onchange: function (e) { m[clave] = Math.max(clave === 'duracion' ? 5 : 0, Math.round(+e.target.value || 0)); cambio(); pintarFormato(); pintarHorarios(); } }));
    };
    var modos = [['presencial', 'Presencial', 'En un lugar físico'], ['meet', 'Google Meet', 'Crea un link por cita'], ['link', 'Link propio', 'Zoom, Teams u otro']];
    AP.pintar(E.formato, panel('Formato y lugar', null,
      h('div', { class: 'f' }, h('span', { class: 'etiqueta' }, 'Duración de cada cita'), fichas('duracion', [15, 20, 30, 45, 60], ' min')),
      h('div', { class: 'f' }, h('span', { class: 'etiqueta' }, 'Pausa entre citas'), fichas('pausa', [0, 5, 10, 15], ' min'),
        h('span', { class: 'ayuda' }, 'Tiempo libre entre una persona y la siguiente. Con pausa salen menos cupos.')),
      h('div', { class: 'f' }, h('span', { class: 'etiqueta' }, 'Modalidad'),
        h('div', { class: 'opciones' }, modos.map(function (o) {
          return h('button', { class: 'opcion', type: 'button', 'aria-pressed': String(m.modalidad === o[0]), onclick: function () { m.modalidad = o[0]; cambio(); pintarFormato(); } },
            h('b', null, o[1]), h('span', null, o[2]));
        }))),
      m.modalidad === 'presencial' ? texto('Dirección', 'lugar', { ph: 'Errázuriz 755, oficina 506, Valparaíso', ayuda: 'Aparece en la página, en el correo y en el evento, con un botón "Cómo llegar".' })
        : (m.modalidad === 'link' ? texto('Link de la videollamada', 'lugar', { tipo: 'url', ph: 'https://zoom.us/j/…' })
          : h('p', { class: 'ayuda', style: { marginTop: '14px' } }, 'Cada cita tendrá su propio link de Google Meet, que llega en la invitación.'))));
  }

  /* 3. Días y horarios */
  function secHorarios() {
    return panel('Días y horarios', 'Marca los días en el calendario y ajusta los bloques de cada día. Los cupos se calculan solos con la duración y la pausa.', E.horarios);
  }

  function pintarHorarios() {
    var m = S.modelo;
    var porFecha = {};
    m.horarios.forEach(function (b) { (porFecha[b.fecha] = porFecha[b.fecha] || []).push(b); });
    var fechas = Object.keys(porFecha).sort();
    var hoy = hoyChile();
    var dias = AP.calcularDias(m.horarios, m.duracion, m.pausa);
    var total = dias.reduce(function (s, d) { return s + d.libres; }, 0);

    // Calendario
    var y = S.mes.y, mes = S.mes.m;
    var primero = new Date(Date.UTC(y, mes - 1, 1)).getUTCDay();
    var desfase = (primero + 6) % 7; // lunes primero
    var largo = new Date(Date.UTC(y, mes, 0)).getUTCDate();
    var celdas = ['lu', 'ma', 'mi', 'ju', 'vi', 'sá', 'do'].map(function (d) { return h('span', { class: 'dsem' }, d); });
    for (var i = 0; i < desfase; i++) celdas.push(h('span'));
    for (var d = 1; d <= largo; d++) {
      (function (d) {
        var f = y + '-' + ('0' + mes).slice(-2) + '-' + ('0' + d).slice(-2);
        var clases = [porFecha[f] ? 'sel' : '', f === hoy ? 'hoy' : '', f < hoy ? 'pasado' : ''].join(' ').trim();
        celdas.push(h('button', { type: 'button', class: clases || null, 'aria-pressed': String(!!porFecha[f]), 'aria-label': AP.partesFecha(f).larga,
          onclick: function () { alternarDia(f); } }, d));
      })(d);
    }
    var cal = h('div', { class: 'cal' },
      h('div', { class: 'cal-cab' },
        h('button', { type: 'button', 'aria-label': 'Mes anterior', onclick: function () { moverMes(-1); } }, '‹'),
        h('b', null, AP.mayus(AP.MESES[mes - 1]) + ' ' + y),
        h('button', { type: 'button', 'aria-label': 'Mes siguiente', onclick: function () { moverMes(1); } }, '›')),
      h('div', { class: 'cal-grid' }, celdas));

    var lista = fechas.length ? h('div', { class: 'dias-ed' }, fechas.map(function (f) {
      var p = AP.partesFecha(f);
      var cupDia = (dias.filter(function (x) { return x.fecha === f; })[0] || { libres: 0 }).libres;
      return h('div', { class: 'dia-ed' },
        h('div', { class: 'dia-ed-cab' },
          h('b', null, p.larga, h('span', { style: { color: 'var(--gris)', fontWeight: '500' } }, '  ' + cupDia + (cupDia === 1 ? ' cupo' : ' cupos'))),
          h('div', { class: 'linea' },
            fechas.length > 1 ? h('button', { class: 'b b-texto b-chico', type: 'button', onclick: function () { copiarATodos(f); } }, 'Usar estos bloques en todos los días') : null,
            h('button', { class: 'b b-texto b-chico', type: 'button', style: { color: 'var(--peligro)' }, onclick: function () { alternarDia(f); } }, 'Quitar día'))),
        porFecha[f].map(function (b) {
          var cupos = AP.calcularDias([b], m.duracion, m.pausa).reduce(function (s, x) { return s + x.libres; }, 0);
          return h('div', { class: 'bloque-ed' },
            h('input', { class: 'inp', type: 'time', value: b.desde, step: 300, 'aria-label': 'Desde', onchange: function (e) { b.desde = e.target.value; cambio(); pintarHorarios(); } }),
            h('span', null, 'a'),
            h('input', { class: 'inp', type: 'time', value: b.hasta, step: 300, 'aria-label': 'Hasta', onchange: function (e) { b.hasta = e.target.value; cambio(); pintarHorarios(); } }),
            h('span', { class: 'cupos' }, cupos + (cupos === 1 ? ' cupo' : ' cupos')),
            h('button', { class: 'b b-texto b-chico', type: 'button', onclick: function () { m.horarios.splice(m.horarios.indexOf(b), 1); cambio(); pintarHorarios(); } }, 'Quitar'));
        }),
        h('button', { class: 'b b-borde b-chico', type: 'button', style: { marginTop: '10px' }, onclick: function () {
          var ult = porFecha[f][porFecha[f].length - 1];
          var ini = Math.min(AP.aMin(ult.hasta) + 30, 22 * 60);
          m.horarios.push({ fecha: f, desde: AP.deMin(ini), hasta: AP.deMin(Math.min(ini + 120, 23 * 60 + 55)) });
          cambio(); pintarHorarios();
        } }, 'Agregar bloque'));
    })) : h('p', { class: 'ayuda' }, 'Toca un día en el calendario para agregarlo.');

    AP.pintar(E.horarios,
      h('div', { class: 'cal-cont' }, cal, lista),
      h('div', { class: 'resumen-cupos' }, fechas.length ? total + (total === 1 ? ' cupo' : ' cupos') + ' de ' + m.duracion + ' minutos en ' + fechas.length + (fechas.length === 1 ? ' día' : ' días') : 'Sin días todavía'));
  }

  function moverMes(n) {
    var mes = S.mes.m + n, y = S.mes.y;
    if (mes < 1) { mes = 12; y--; } else if (mes > 12) { mes = 1; y++; }
    S.mes = { y: y, m: mes };
    pintarHorarios();
  }

  function alternarDia(f) {
    var m = S.modelo;
    var tiene = m.horarios.some(function (b) { return b.fecha === f; });
    if (tiene) {
      m.horarios = m.horarios.filter(function (b) { return b.fecha !== f; });
    } else {
      var ref = m.horarios.length ? m.horarios.slice().sort(function (a, b) { return a.fecha < b.fecha ? 1 : -1; })[0].fecha : null;
      var modelo = ref ? m.horarios.filter(function (b) { return b.fecha === ref; }) : [{ desde: '10:00', hasta: '13:00' }];
      modelo.forEach(function (b) { m.horarios.push({ fecha: f, desde: b.desde, hasta: b.hasta }); });
    }
    cambio(); pintarHorarios();
  }

  function copiarATodos(f) {
    var m = S.modelo;
    var base = m.horarios.filter(function (b) { return b.fecha === f; });
    var fechas = m.horarios.map(function (b) { return b.fecha; }).filter(function (x, i, a) { return a.indexOf(x) === i; });
    m.horarios = [];
    fechas.forEach(function (x) { base.forEach(function (b) { m.horarios.push({ fecha: x, desde: b.desde, hasta: b.hasta }); }); });
    cambio(); pintarHorarios();
    AP.avisar('Todos los días quedaron con los mismos bloques.');
  }

  /* 4. Preguntas */
  function secPreguntas() {
    return panel('Preguntas del formulario', 'Nombre y correo se piden siempre. Agrega las demás. El jurado no ve las respuestas de teléfono, correo, RUT ni dirección.', E.preguntas);
  }

  function pintarPreguntas() {
    var m = S.modelo;
    var sugeridas = ['Teléfono (WhatsApp)', 'Comuna', 'Institución o colegio', 'RUT', 'Región'].filter(function (s) {
      return !m.campos.some(function (c) { return c.etiqueta.trim().toLowerCase() === s.toLowerCase(); });
    });
    AP.pintar(E.preguntas,
      h('div', { class: 'pregs' },
        h('div', { class: 'preg fija' }, h('span', null, 'Nombre y apellido'), h('span', null, 'Siempre')),
        h('div', { class: 'preg fija' }, h('span', null, 'Correo electrónico'), h('span', null, 'Siempre')),
        m.campos.map(function (c, i) {
          return h('div', { class: 'preg' },
            h('div', { class: 'preg-fila' },
              h('input', { class: 'inp', value: c.etiqueta, placeholder: 'Escribe la pregunta', 'aria-label': 'Pregunta ' + (i + 1), oninput: function (e) { c.etiqueta = e.target.value; cambio(); } }),
              h('label', { class: 'linea', style: { fontSize: '14px', fontWeight: '600', gap: '6px' } },
                h('input', { type: 'checkbox', checked: c.requerido, onchange: function (e) { c.requerido = e.target.checked; cambio(); } }), 'Obligatoria'),
              h('div', { class: 'linea', style: { gap: '4px' } },
                i > 0 ? h('button', { class: 'b b-borde b-chico', type: 'button', 'aria-label': 'Subir', onclick: function () { mover(i, -1); } }, '↑') : null,
                i < m.campos.length - 1 ? h('button', { class: 'b b-borde b-chico', type: 'button', 'aria-label': 'Bajar', onclick: function () { mover(i, 1); } }, '↓') : null,
                h('button', { class: 'b b-texto b-chico', type: 'button', onclick: function () { m.campos.splice(i, 1); cambio(); pintarPreguntas(); } }, 'Quitar'))),
            h('textarea', { class: 'inp', value: (c.opciones || []).join('\n'), placeholder: 'Opciones de respuesta, una por línea. Déjalo vacío si la respuesta es libre.',
              oninput: function (e) { c.opciones = e.target.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean); cambio(); } }));
        })),
      h('div', { class: 'linea', style: { marginTop: '12px' } },
        h('button', { class: 'b b-borde b-chico', type: 'button', onclick: function () { agregarPregunta(''); } }, 'Agregar pregunta'),
        sugeridas.map(function (s) { return h('button', { class: 'ficha', type: 'button', onclick: function () { agregarPregunta(s); } }, '+ ' + s); })));
  }

  function agregarPregunta(t) {
    S.modelo.campos.push({ etiqueta: t, requerido: true, opciones: [] });
    cambio(); pintarPreguntas();
    if (!t) { var ins = E.preguntas.querySelectorAll('.preg .inp'); if (ins.length) ins[ins.length - 2].focus(); }
  }
  function mover(i, d) {
    var c = S.modelo.campos; var x = c[i]; c[i] = c[i + d]; c[i + d] = x;
    cambio(); pintarPreguntas();
  }

  /* 5. Marca */
  function pintarMarca() {
    var m = S.modelo;
    var color = function (clave, etq) {
      var hex = h('input', { class: 'inp', value: m[clave], 'aria-label': etq + ' (código)', style: { width: '110px' }, spellcheck: 'false',
        oninput: function (e) { if (AP.esColor(e.target.value)) { m[clave] = e.target.value; sel.value = m[clave].length === 4 ? '#' + m[clave].slice(1).split('').map(function (c) { return c + c; }).join('') : m[clave]; cambio(); pintarLogos(); } } });
      var sel = h('input', { type: 'color', value: m[clave], 'aria-label': etq, oninput: function (e) { m[clave] = e.target.value; hex.value = m[clave]; cambio(); pintarLogos(); } });
      return h('div', { class: 'f' }, h('span', { class: 'etiqueta' }, etq), h('div', { class: 'color-in' }, sel, hex));
    };
    E.logos = h('div');
    AP.pintar(E.marca, panel('Colores y logos', 'El color principal va en la franja y los botones; el de acento marca la hora elegida.',
      h('div', { class: 'colores' }, color('color1', 'Color principal'), color('color2', 'Color de acento')),
      h('div', { class: 'f' }, h('span', { class: 'etiqueta' }, 'Combinaciones sugeridas'),
        h('div', { class: 'paletas' }, PALETAS.map(function (p) {
          return h('button', { class: 'paleta', type: 'button', 'aria-label': 'Usar ' + p[0] + ' y ' + p[1], onclick: function () { m.color1 = p[0]; m.color2 = p[1]; cambio(); pintarMarca(); } },
            h('i', { style: { background: p[0] } }), h('i', { style: { background: p[1] } }));
        }))),
      h('div', { class: 'f' }, h('span', { class: 'etiqueta' }, 'Logos'),
        h('div', { class: 'fichas' },
          [['blanco', 'Sobre placa blanca'], ['color', 'Directo sobre el color']].map(function (o) {
            return h('button', { class: 'ficha', type: 'button', 'aria-pressed': String(m.logosFondo === o[0]), onclick: function () { m.logosFondo = o[0]; cambio(); pintarMarca(); } }, o[1]);
          })),
        h('span', { class: 'ayuda' }, 'Si tus logos son blancos, elige "Directo sobre el color". Sube PNG con fondo transparente; los convertimos al tamaño justo.'),
        E.logos)));
    pintarLogos();
  }

  function pintarLogos() {
    var m = S.modelo;
    var slots = [['logoPiensa', 'P!ensa'], ['logoPrograma', 'Programa o instancia'], ['logoAliado', 'Aliado (opcional)']];
    AP.pintar(E.logos, h('div', { class: 'logos-ed' }, slots.map(function (s) {
      var url = AP.urlImagen(m[s[0]]);
      var boton = h('span', { class: 'b b-borde b-chico subir' }, 'Subir imagen',
        h('input', { type: 'file', accept: 'image/*', 'aria-label': 'Subir logo ' + s[1], onchange: function (e) { if (e.target.files[0]) subirLogo(e.target.files[0], s[0], boton); } }));
      return h('div', { class: 'logo-ed' },
        h('b', null, s[1]),
        h('div', { class: 'vista-logo', style: m.logosFondo === 'color' ? { background: m.color1, color: AP.textoSobre(m.color1) } : { background: '#fff', boxShadow: 'inset 0 0 0 1px var(--linea)' } },
          url ? h('img', { src: url, alt: '', onerror: function () { this.replaceWith(h('em', null, 'No se pudo cargar')); } }) : h('em', null, 'Sin logo')),
        h('div', { class: 'linea', style: { gap: '6px' } }, boton,
          m[s[0]] ? h('button', { class: 'b b-texto b-chico', type: 'button', onclick: function () { m[s[0]] = ''; cambio(); pintarLogos(); } }, 'Quitar') : null),
        h('input', { class: 'inp', value: m[s[0]] || '', placeholder: 'o pega un link (Drive o web)', 'aria-label': 'Link del logo ' + s[1],
          onchange: function (e) { m[s[0]] = e.target.value.trim(); cambio(); pintarLogos(); } }));
    })));
  }

  function subirLogo(archivo, clave, boton) {
    if (!/^image\//.test(archivo.type)) return AP.avisar('Elige una imagen (PNG, JPG o SVG).', true);
    boton.firstChild.textContent = 'Subiendo…';
    aPng(archivo).then(function (base64) {
      return admin('admin.logo', { nombre: archivo.name.replace(/\.[^.]+$/, '') + '.png', tipo: 'image/png', base64: base64 });
    }).then(function (r) {
      S.modelo[clave] = r.url; cambio(); pintarLogos();
      AP.avisar('Logo subido. Guarda los cambios para usarlo.');
    }).catch(function (err) { boton.firstChild.textContent = 'Subir imagen'; AP.avisar(err.message, true); });
  }

  function aPng(archivo) {
    return new Promise(function (ok, mal) {
      var url = URL.createObjectURL(archivo);
      var img = new Image();
      img.onload = function () {
        var w = img.naturalWidth || 800, alto = img.naturalHeight || 300;
        var k = Math.min(1, 900 / w, 320 / alto);
        var c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(alto * k));
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        ok(c.toDataURL('image/png').split(',')[1]);
      };
      img.onerror = function () { URL.revokeObjectURL(url); mal(new Error('No pudimos leer esa imagen. Prueba con un PNG o JPG.')); };
      img.src = url;
    });
  }

  /* 6. Jurado */
  function pintarJurado() {
    var m = S.modelo;
    var linkPanel = !S.nueva && m.claveJurado ? linkJurado(m.id, m.claveJurado) : '';
    E.tablaJ = h('div');
    AP.pintar(E.jurado, panel('Jurado', 'Las personas del jurado entran a su panel, eligen su nombre y se suman a las entrevistas. Quedan invitadas en Google Calendar.',
      linkPanel ? h('div', { class: 'f' }, h('span', { class: 'etiqueta' }, 'Link del panel del jurado'),
        h('div', { class: 'linea' }, h('input', { class: 'inp', value: linkPanel, readonly: true, style: { flex: '1', minWidth: '220px' }, onfocus: function (e) { e.target.select(); } }),
          h('button', { class: 'b b-borde', type: 'button', onclick: function () { AP.copiar(linkPanel, 'Link del jurado copiado.'); } }, 'Copiar')),
        h('span', { class: 'ayuda' }, 'Compártelo solo con el jurado: muestra los nombres de quienes reservaron.'))
        : h('p', { class: 'ayuda', style: { marginTop: '12px' } }, 'El link del panel aparece cuando guardes la agenda.'),
      h('div', { class: 'f' }, h('span', { class: 'etiqueta' }, 'Lista de jurados'),
        h('span', { class: 'ayuda', style: { marginTop: '0', marginBottom: '6px' } }, 'Aparecen como opciones al entrar al panel. Si alguien no está, puede escribir su nombre.'),
        E.tablaJ),
      h('div', { class: 'dos' },
        texto('Máximo de jurados por entrevista', 'maxJurados', { tipo: 'number', min: 0, ph: 'Sin límite' }),
        texto('Clave del panel', 'claveJurado', { ph: 'Se crea sola al guardar', ayuda: 'Si la cambias, el link anterior deja de funcionar.' })),
      texto('Invitados a todas las entrevistas', 'invitadosFijos', { multi: true, ph: 'correo@ejemplo.cl, otro@ejemplo.cl', ayuda: 'Quedan invitados automáticamente a cada cita.' })));
    pintarTablaJurados();
  }

  function pintarTablaJurados() {
    var m = S.modelo;
    AP.pintar(E.tablaJ, h('div', { class: 'tabla-ed' },
      m.jurados.map(function (j, i) {
        var inp = function (k, ph, tipo) { return h('input', { class: 'inp', type: tipo || 'text', value: j[k] || '', placeholder: ph, 'aria-label': ph, oninput: function (e) { j[k] = e.target.value; cambio(); } }); };
        return h('div', { class: 'fila-ed' }, inp('nombre', 'Nombre'), inp('correo', 'Correo', 'email'), inp('institucion', 'Institución'),
          h('button', { class: 'b b-texto b-chico', type: 'button', onclick: function () { m.jurados.splice(i, 1); cambio(); pintarTablaJurados(); } }, 'Quitar'));
      }),
      h('div', null, h('button', { class: 'b b-borde b-chico', type: 'button', onclick: function () { m.jurados.push({ nombre: '', correo: '', institucion: '' }); cambio(); pintarTablaJurados(); } }, 'Agregar jurado'))));
  }

  /* 7. Correos */
  function secCorreos() {
    return panel('Correos', 'La invitación de Calendar sale desde la cuenta dueña de la planilla. Además enviamos una confirmación con los colores y logos de esta agenda.',
      h('div', { class: 'dos' },
        texto('Las respuestas llegan a', 'responderA', { tipo: 'email', ph: 'pedro.maiz@fundacionpiensa.cl' }),
        texto('Avisar de cada reserva a', 'avisoA', { ph: 'correo@ejemplo.cl, otro@ejemplo.cl' })),
      seleccion('Recordatorio por correo', 'recordatorioHoras', [[0, 'Sin recordatorio'], [2, '2 horas antes'], [24, '1 día antes'], [48, '2 días antes']],
        'Para que funcione, activa una vez "Activar recordatorios automáticos" en el menú de la planilla.'),
      texto('Mensaje en la confirmación', 'mensaje', { multi: true, ph: 'Te recomendamos llegar 10 minutos antes.' }));
  }

  /* 8. Reglas */
  function secReglas() {
    var m = S.modelo;
    var cuenta = h('span', { class: 'ayuda' });
    var contar = function () {
      var n = m.autorizados.length;
      cuenta.textContent = n ? n + (n === 1 ? ' correo autorizado: solo esa persona puede reservar.' : ' correos autorizados: solo esas personas pueden reservar.') : 'Vacío: cualquiera con el link puede reservar.';
    };
    contar();
    return panel('Quién y cuándo puede reservar', null,
      interruptor('unaPorCorreo', 'Una hora por persona', 'Cada correo puede tener una sola hora reservada.'),
      seleccion('Anticipación mínima', 'avisoMinimoHoras', [[0, 'Hasta el último minuto'], [1, '1 hora antes'], [2, '2 horas antes'], [6, '6 horas antes'], [12, '12 horas antes'], [24, '1 día antes'], [48, '2 días antes']],
        'Los horarios más cercanos que esto dejan de mostrarse.'),
      h('div', { class: 'f' }, h('label', { for: 'f-aut' }, 'Solo pueden reservar estos correos (opcional)'),
        h('textarea', { id: 'f-aut', value: m.autorizados.map(function (a) { return a.correo + (a.nombre ? ', ' + a.nombre : ''); }).join('\n'),
          placeholder: 'Un correo por línea. Puedes pegar una columna desde Excel.',
          oninput: function (e) {
            m.autorizados = e.target.value.split(/\n+/).map(function (l) {
              var p = l.split(/[,;\t]/); return { correo: (p[0] || '').trim().toLowerCase(), nombre: (p.slice(1).join(' ') || '').trim() };
            }).filter(function (a) { return AP.esCorreo(a.correo); });
            contar(); cambio();
          } }), cuenta),
      interruptor('respetarOcupado', 'Ocultar horarios que choquen con mi calendario', 'Si tienes otro evento "ocupado" a esa hora, ese cupo no se muestra.'),
      interruptor('mostrarInvitados', 'Los invitados ven la lista de invitados', 'Apagado, nadie ve los correos de los demás en la invitación.'),
      texto('Calendario (avanzado)', 'calendario', { ph: 'Vacío = tu calendario principal', ayuda: 'ID de otro calendario de tu cuenta, si quieres separar estas citas.' }));
  }

  /* Vista previa */
  function pintarPrevia() {
    var m = S.modelo;
    if (!E.telefono) return;
    var inst = {
      id: m.id || 'vista-previa', titulo: m.titulo || 'Título de la agenda', subtitulo: m.subtitulo, descripcion: m.descripcion,
      duracion: Math.max(5, +m.duracion || 20), tipo: m.modalidad, modalidad: m.modalidad, lugar: m.modalidad === 'presencial' ? m.lugar : '',
      color1: m.color1, color2: m.color2, logosFondo: m.logosFondo, contacto: m.responderA,
      logos: [m.logoPiensa, m.logoPrograma, m.logoAliado].map(AP.urlImagen).filter(Boolean),
      campos: m.campos.filter(function (c) { return String(c.etiqueta || '').trim(); }).map(function (c, i) {
        return { id: 'c' + i, etiqueta: c.etiqueta.trim(), requerido: c.requerido, opciones: c.opciones || [] };
      }),
    };
    var arriba = E.telefono.scrollTop;
    AP.vista.reserva(E.telefono, { instancia: inst, dias: AP.calcularDias(m.horarios, m.duracion, m.pausa) }, { preview: true });
    E.telefono.scrollTop = arriba;
  }

  /* Guardar */
  function guardar() {
    var m = S.modelo;
    var problema = '';
    if (!String(m.titulo || '').trim()) problema = 'Falta el título.';
    else if (!/^[a-z0-9][a-z0-9-]{1,39}$/.test(m.id || '')) problema = 'Revisa el link: entre 2 y 40 letras minúsculas, números o guiones.';
    else if (m.modalidad === 'presencial' && !String(m.lugar || '').trim()) problema = 'Escribe la dirección del lugar.';
    else if (m.modalidad === 'link' && !/^https?:\/\//.test(String(m.lugar || '').trim())) problema = 'Pega el link de la videollamada.';
    else if (m.jurados.some(function (j) { return (j.nombre || j.correo) && !AP.esCorreo(j.correo); })) problema = 'Hay un jurado sin correo válido.';
    if (problema) return AP.avisar(problema, true);

    S.guardando = true; actualizarBarra();
    var datos = JSON.parse(JSON.stringify(m));
    datos.jurados = datos.jurados.filter(function (j) { return AP.esCorreo(j.correo); });
    datos.campos = datos.campos.filter(function (c) { return String(c.etiqueta || '').trim(); });
    var eraNueva = S.nueva;
    admin('admin.guardar', { instancia: datos, nueva: eraNueva }).then(function (nuevo) {
      S.guardando = false; S.sucio = false;
      AP.avisar(eraNueva ? 'Agenda creada.' : 'Cambios guardados.');
      if (eraNueva) { location.hash = '#/editar/' + encodeURIComponent(nuevo.id); return; }
      var y = window.scrollY;
      iniciarEditor(nuevo, false);
      window.scrollTo(0, y);
    }).catch(function (err) { S.guardando = false; actualizarBarra(); AP.avisar(err.message, true); });
  }

  /* ---------- Reservas ---------- */
  function vistaReservas(id) {
    cargando('Cargando reservas…');
    admin('admin.reservas', { e: id }).then(function (d) {
      S.res = { id: id, datos: d, filtro: 'activas', q: '' };
      pintarReservas();
    }).catch(falla);
  }

  function filtradas() {
    var r = S.res, q = r.q.trim().toLowerCase();
    return r.datos.filas.filter(function (f) {
      var cancelada = /cancel/i.test(f.estado);
      if (r.filtro === 'activas' && cancelada) return false;
      if (r.filtro === 'canceladas' && !cancelada) return false;
      return !q || (f.nombre + ' ' + f.correo + ' ' + f.respuestas).toLowerCase().indexOf(q) >= 0;
    });
  }

  function pintarReservas() {
    var r = S.res, d = r.datos;
    var activas = d.filas.filter(function (f) { return !/cancel/i.test(f.estado) && f.nombre; }).length;
    var cuerpo = h('div');
    var filtros = [['activas', 'Vigentes'], ['canceladas', 'Canceladas'], ['todas', 'Todas']];
    shell([
      h('a', { class: 'volver', href: '#/' }, 'Volver a tus agendas'),
      h('div', { class: 'pagina-cab' },
        h('div', null, h('h1', null, 'Reservas'), h('p', null, d.titulo + '. ' + activas + (activas === 1 ? ' hora reservada.' : ' horas reservadas.'))),
        h('div', { class: 'linea' },
          h('button', { class: 'b b-borde', type: 'button', onclick: function () { vistaReservas(r.id); } }, 'Actualizar'),
          h('button', { class: 'b b-borde', type: 'button', onclick: descargarCsv }, 'Descargar CSV'),
          h('a', { class: 'b b-borde', href: d.planilla, target: '_blank', rel: 'noopener' }, 'Abrir la planilla'),
          h('a', { class: 'b b-prin', href: '#/editar/' + encodeURIComponent(r.id) }, 'Editar agenda'))),
      h('div', { class: 'filtros-res' },
        h('div', { class: 'fichas' }, filtros.map(function (f) {
          return h('button', { class: 'ficha', type: 'button', 'aria-pressed': String(r.filtro === f[0]), onclick: function () { r.filtro = f[0]; pintarReservas(); } }, f[1]);
        })),
        h('input', { class: 'inp', type: 'search', placeholder: 'Buscar por nombre, correo o respuesta', value: r.q, 'aria-label': 'Buscar',
          oninput: function (e) { r.q = e.target.value; pintarTabla(cuerpo); } })),
      cuerpo
    ]);
    pintarTabla(cuerpo);
  }

  function pintarTabla(cuerpo) {
    var filas = filtradas();
    if (!filas.length) return AP.pintar(cuerpo, h('div', { class: 'vacio-ag' }, h('b', null, 'No hay reservas para mostrar'), 'Cuando alguien reserve, aparecerá aquí.'));
    AP.pintar(cuerpo, h('table', { class: 'tabla' },
      h('thead', null, h('tr', null, ['Fecha', 'Persona', 'Respuestas', 'Jurado', 'Estado', ''].map(function (t) { return h('th', null, t); }))),
      h('tbody', null, filas.map(function (f) {
        var cancelada = /cancel/i.test(f.estado), bloqueado = !f.nombre;
        return h('tr', { class: cancelada ? 'cancelada' : null },
          h('td', null, h('b', null, f.corta), h('br'), h('small', null, f.hora + ' a ' + f.termino)),
          h('td', null, f.nombre ? [h('b', null, f.nombre), h('br'), h('small', null, f.correo)] : h('small', null, 'Horario bloqueado')),
          h('td', null, h('small', null, (f.respuestas || '').split(' | ').filter(Boolean).map(function (x, i) { return [i ? h('br') : null, x]; }))),
          h('td', null, h('small', null, f.jurados.join(', ') || 'Sin jurado')),
          h('td', null, h('span', { class: 'chip-estado' + (cancelada ? ' cancelada' : (bloqueado ? ' bloqueado' : '')) }, cancelada ? 'Cancelada' : (bloqueado ? 'Bloqueado' : 'Confirmada'))),
          h('td', null, !cancelada && f.token ? h('button', { class: 'b b-peligro b-chico', type: 'button', onclick: function () { cancelarDesdeAdmin(f); } }, 'Cancelar') : null));
      }))));
  }

  function cancelarDesdeAdmin(f) {
    if (!window.confirm('¿Cancelar la hora de ' + f.nombre + ' (' + f.corta + ', ' + f.hora + ')? Se borra el evento, se les avisa a los invitados y el horario queda libre.')) return;
    admin('admin.cancelar', { token: f.token }).then(function () {
      AP.avisar('Hora cancelada.');
      vistaReservas(S.res.id);
    }).catch(function (err) { AP.avisar(err.message, true); });
  }

  function descargarCsv() {
    var c = function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; };
    var filas = [['Fecha', 'Hora', 'Término', 'Nombre', 'Correo', 'Respuestas', 'Jurado', 'Estado']].concat(filtradas().map(function (f) {
      return [f.fecha, f.hora, f.termino, f.nombre, f.correo, f.respuestas, f.jurados.join(', '), f.estado];
    }));
    var blob = new Blob(['﻿' + filas.map(function (r) { return r.map(c).join(';'); }).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    var a = h('a', { href: URL.createObjectURL(blob), download: 'reservas-' + S.res.id + '.csv' });
    document.body.appendChild(a); a.click(); a.remove();
  }
})();
