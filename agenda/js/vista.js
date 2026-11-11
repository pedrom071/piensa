/* Agenda P!ensa — pantallas de la página pública: reserva, panel del jurado, cancelación. */
(function () {
  'use strict';
  var AP = window.AP;
  var h = AP.h;
  var V = AP.vista = {};

  var ICONO_MAPA = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>';

  /* ---------- Marco común: panel de marca + flujo ---------- */
  function marco(raiz, inst, datos, sinDescripcion) {
    inst = inst || {};
    var logos = (inst.logos || []).map(AP.urlImagen).filter(Boolean);
    var flujo = h('main', { class: 'flujo' });
    var raizAgenda = h('div', { class: 'agenda' },
      h('div', { class: 'agenda-grid' },
        h('aside', { class: 'marca' },
          logos.length ? h('div', { class: 'logos' + (inst.logosFondo === 'color' ? '' : ' en-placa') + ' n' + logos.length },
            logos.map(function (u, i) {
              return [i ? h('span', { class: 'sep', 'aria-hidden': 'true' }) : null,
                h('img', { src: u, alt: '', onerror: quitarLogo })];
            })) : null,
          inst.subtitulo ? h('p', { class: 'marca-sub' }, inst.subtitulo) : null,
          h('h1', null, inst.titulo || 'Agenda P!ensa'),
          inst.descripcion && datos !== false && !sinDescripcion ? h('p', { class: 'marca-desc' }, inst.descripcion) : null,
          datos && datos.length ? h('dl', { class: 'datos' }, datos) : null,
          h('p', { class: 'marca-pie' }, 'Fundación P!ensa')),
        flujo));
    AP.aplicarMarca(raizAgenda, inst);
    AP.pintar(raiz, raizAgenda);
    return flujo;
  }

  function quitarLogo() {
    var antes = this.previousElementSibling, despues = this.nextElementSibling;
    if (antes && antes.classList.contains('sep')) antes.remove();
    else if (despues && despues.classList.contains('sep')) despues.remove();
    var caja = this.parentNode;
    this.remove();
    if (caja && !caja.querySelector('img')) caja.remove();
  }

  function dato(titulo, valor) { return h('div', null, h('dt', null, titulo), h('dd', null, valor)); }

  function datosDeInstancia(inst) {
    var lista = [dato('Duración', inst.duracion + ' minutos')];
    if (inst.tipo === 'presencial' && inst.lugar) {
      lista.push(dato('Lugar', [inst.lugar, h('br'), h('a', { href: AP.mapa(inst.lugar), target: '_blank', rel: 'noopener' }, 'Cómo llegar')]));
    } else {
      lista.push(dato('Modalidad', inst.tipo === 'meet' ? 'Videollamada por Google Meet' : 'Videollamada'));
    }
    var zona = dato('Horario', 'Hora de Chile');
    zona.className = 'solo-ancho';
    lista.push(zona);
    return lista;
  }

  V.cargando = function (raiz) {
    var flujo = marco(raiz, { titulo: ' ', color1: '#2a3346', color2: '#8a93a6' }, false);
    AP.pintar(flujo, h('div', { 'aria-busy': 'true', 'aria-label': 'Cargando' },
      h('div', { class: 'esqueleto', style: { height: '28px', width: '60%' } }),
      h('div', { style: { display: 'flex', gap: '10px', marginTop: '20px' } },
        [0, 1, 2].map(function () { return h('div', { class: 'esqueleto', style: { height: '118px', width: '104px', borderRadius: '20px' } }); })),
      h('div', { class: 'esqueleto', style: { height: '24px', width: '40%', marginTop: '34px' } }),
      h('div', { class: 'esqueleto', style: { height: '96px', marginTop: '14px' } })));
  };

  V.error = function (raiz, mensaje, inst) {
    var flujo = marco(raiz, inst || { titulo: 'Agenda P!ensa' }, false);
    AP.pintar(flujo, h('div', { class: 'vacio' }, h('b', null, mensaje || 'Algo salió mal.'),
      h('span', null, 'Si crees que es un error, escríbenos.')));
  };

  /* ---------- Reserva ---------- */
  V.reserva = function (raiz, datos, op) {
    op = op || {};
    var inst = datos.instancia;
    var flujo = marco(raiz, inst, datosDeInstancia(inst));
    var est = { dia: null, bloque: null, enviando: false, error: '', aviso: '', valores: {} };
    primerDia();
    render();

    function primerDia() {
      var d = datos.dias.filter(function (x) { return x.libres > 0; })[0];
      est.dia = d ? d.fecha : null;
    }

    function render() {
      var conLibres = datos.dias.filter(function (d) { return d.libres > 0; });
      if (!conLibres.length) {
        return AP.pintar(flujo, h('div', { class: 'vacio' },
          h('b', null, datos.dias.length ? 'Ya se tomaron todos los horarios.' : 'Todavía no hay horarios publicados.'),
          inst.contacto ? h('span', null, 'Si necesitas ayuda, escribe a ', h('a', { href: 'mailto:' + inst.contacto }, inst.contacto), '.') : null));
      }
      var dia = datos.dias.filter(function (d) { return d.fecha === est.dia; })[0];
      AP.pintar(flujo,
        est.aviso ? h('div', { class: 'error', style: { margin: '0 0 18px' }, role: 'alert' }, est.aviso) : null,
        h('section', { class: 'paso' },
          h('h2', null, '¿Qué día te acomoda?'),
          h('div', { class: 'dias', role: 'group', 'aria-label': 'Días disponibles' }, datos.dias.map(function (d) {
            var p = AP.partesFecha(d.fecha);
            var cuando = d.fecha === AP.hoyChile() ? 'hoy' : (d.fecha === AP.hoyChile(1) ? 'mañana' : p.dow);
            return h('button', {
              class: 'dia', type: 'button', 'aria-pressed': String(d.fecha === est.dia), disabled: d.libres === 0,
              'aria-label': p.larga + ', ' + (d.libres ? d.libres + ' horarios libres' : 'sin horarios'),
              onclick: function () { est.dia = d.fecha; est.bloque = null; est.error = ''; render(); }
            }, h('span', { class: 'dow' }, cuando), h('span', { class: 'num' }, p.num), h('span', { class: 'mes' }, p.mes),
              h('span', { class: 'libres' }, d.libres === 0 ? 'completo' : d.libres + (d.libres === 1 ? ' libre' : ' libres')));
          }))),
        dia ? h('section', { class: 'paso' },
          h('h2', null, 'Elige la hora'),
          h('p', { class: 'paso-nota' }, dia.etiqueta),
          dia.ventanas.filter(function (v) { return v.bloques.length; }).map(function (v) {
            var partes = String(v.etiqueta).split(' · ');
            return h('div', { class: 'franja-horas' },
              h('h3', null, partes[0], partes[1] ? h('span', null, ' (' + partes[1] + ')') : null),
              h('div', { class: 'horas' }, v.bloques.map(function (b) {
                return h('button', {
                  class: 'hora', type: 'button', 'aria-pressed': String(!!est.bloque && est.bloque.clave === b.clave),
                  'aria-label': dia.etiqueta + ', ' + b.hora,
                  onclick: function () {
                    est.bloque = b; est.error = ''; est.aviso = ''; render();
                    var f = flujo.querySelector('#datos');
                    if (f && f.scrollIntoView) f.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }, b.hora);
              })));
          })) : null,
        est.bloque && dia ? formulario(dia) : null);
    }

    function formulario(dia) {
      var b = est.bloque, v = est.valores, p = AP.partesFecha(dia.fecha);
      function campo(id, etiqueta, req, control) {
        return h('div', { class: 'campo' }, h('label', { for: id }, etiqueta, req ? h('span', { class: 'req', 'aria-hidden': 'true' }, '*') : null), control);
      }
      function entrada(id, tipo, extra) {
        return h('input', Object.assign({ id: id, name: id, type: tipo || 'text', value: v[id] || '', oninput: function (e) { v[id] = e.target.value; } }, extra || {}));
      }
      return h('section', { class: 'paso', id: 'datos' },
        h('h2', null, 'Tus datos'),
        h('div', { class: 'eleccion' },
          h('div', { class: 'mini' }, h('b', null, p.num), h('small', null, p.mesCorto)),
          h('p', null, p.larga + ', ' + b.hora + ' a ' + b.termino + ' hrs.',
            h('small', null, inst.tipo === 'presencial' && inst.lugar ? inst.lugar : (inst.tipo === 'meet' ? 'Google Meet' : 'Videollamada')))),
        h('form', { novalidate: true, onsubmit: enviar },
          campo('nombre', 'Nombre y apellido', true, entrada('nombre', 'text', { autocomplete: 'name' })),
          campo('correo', 'Correo electrónico', true, entrada('correo', 'email', { autocomplete: 'email', inputmode: 'email' })),
          (inst.campos || []).map(function (c) {
            var control;
            if (c.opciones && c.opciones.length) {
              control = h('select', { id: c.id, name: c.id, onchange: function (e) { v[c.id] = e.target.value; } },
                h('option', { value: '' }, 'Elige una opción'),
                c.opciones.map(function (o) { return h('option', { value: o, selected: v[c.id] === o }, o); }));
            } else {
              var tel = /tel[eé]f|fono|whats|celular|m[oó]vil/i.test(c.etiqueta);
              control = entrada(c.id, tel ? 'tel' : 'text', tel ? { autocomplete: 'tel', inputmode: 'tel' } : null);
            }
            return campo(c.id, c.etiqueta, c.requerido, control);
          }),
          est.error ? h('div', { class: 'error', role: 'alert' }, est.error) : null,
          h('button', { class: 'boton boton-principal', type: 'submit', disabled: est.enviando }, est.enviando ? 'Reservando…' : 'Reservar esta hora'),
          h('p', { class: 'nota' }, 'Te enviaremos la confirmación y la invitación de Google Calendar a tu correo.')));
    }

    function enviar(ev) {
      ev.preventDefault();
      if (est.enviando) return;
      var v = est.valores, faltan = [];
      if (!String(v.nombre || '').trim()) faltan.push('tu nombre');
      if (!AP.esCorreo(v.correo)) faltan.push('un correo válido');
      (inst.campos || []).forEach(function (c) { if (c.requerido && !String(v[c.id] || '').trim()) faltan.push(c.etiqueta.toLowerCase()); });
      if (faltan.length) { est.error = 'Falta completar: ' + faltan.join(', ') + '.'; return render(); }
      if (op.preview) { AP.avisar('Esto es una vista previa: no se guarda la reserva.'); return; }
      est.enviando = true; est.error = ''; render();
      var bloque = est.bloque;
      AP.api('reservar', { e: inst.id, bloque: bloque.clave, datos: v }).then(function (res) {
        listo(flujo, inst, bloque, res);
      }).catch(function (err) {
        est.enviando = false;
        var e = AP.codigoError(err);
        if (e.codigo === 'TOMADO') {
          est.aviso = e.mensaje; est.bloque = null;
          return AP.api('reserva', { e: inst.id }).then(function (nuevos) {
            datos = nuevos;
            if (!datos.dias.some(function (d) { return d.fecha === est.dia && d.libres > 0; })) primerDia();
            render();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }).catch(function () { render(); });
        }
        est.error = e.mensaje;
        render();
      });
    }
  };

  function listo(flujo, inst, bloque, r) {
    var p = AP.partesFecha(bloque.clave.slice(0, 10));
    var lugar = null;
    if (r.tipo === 'presencial' && r.lugar) {
      lugar = h('p', null, r.lugar, h('br'), h('a', { href: AP.mapa(r.lugar), target: '_blank', rel: 'noopener', html: ICONO_MAPA + ' Cómo llegar' }));
    } else if (r.link) {
      lugar = h('p', null, 'Link de la videollamada: ', h('a', { href: r.link, target: '_blank', rel: 'noopener' }, r.link.replace(/^https?:\/\//, '')));
    }
    AP.pintar(flujo, h('div', { class: 'listo' },
      h('h2', null, '¡Listo, ' + AP.primerNombre(r.nombre) + '!'),
      h('p', null, 'Tu hora quedó reservada.'),
      h('div', { class: 'pase' },
        h('div', { class: 'pase-fecha' }, h('span', { class: 'dow' }, p.dow), h('span', { class: 'num' }, p.num), h('span', { class: 'mes' }, p.mes)),
        h('div', { class: 'pase-info' },
          h('p', { class: 'pase-hora' }, r.hora + ' a ' + r.termino),
          h('p', null, r.nombre),
          lugar)),
      h('p', { class: 'nota' }, 'Enviamos la confirmación y la invitación de Google Calendar a ', h('b', null, r.correo),
        '. Si no la ves en unos minutos, revisa spam o promociones. En ese correo también puedes cancelar o cambiar tu hora.')));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------- Panel del jurado ---------- */
  V.jurado = function (raiz, datos, op) {
    op = op || {};
    var inst = datos.instancia;
    var flujo = marco(raiz, inst, [dato('Vista', 'Panel del jurado'), dato('Duración', inst.duracion + ' minutos')].concat(
      inst.tipo === 'presencial' && inst.lugar ? [dato('Lugar', [inst.lugar, h('br'), h('a', { href: AP.mapa(inst.lugar), target: '_blank', rel: 'noopener' }, 'Cómo llegar')])] : []), true);
    var claveLocal = 'agendaPiensaJurado:' + inst.id;
    var est = { yo: AP.leerLocal(claveLocal), filtro: 'todas', ocupado: false, eligiendo: '', error: '', borrador: {} };
    render();

    function render() {
      AP.pintar(flujo, est.yo ? panel() : identificacion());
    }

    function identificacion() {
      var roster = datos.roster || [], b = est.borrador;
      var otra = !roster.length || est.eligiendo === 'otra';
      return h('section', { class: 'paso' },
        h('h2', null, '¿Quién eres?'),
        h('p', { class: 'paso-nota' }, 'Con tu correo te enviamos la invitación de cada entrevista a la que te sumes.'),
        h('form', { onsubmit: function (e) {
            e.preventDefault();
            var yo;
            if (!otra) {
              yo = roster.filter(function (r) { return r.correo === est.eligiendo; })[0];
              if (!yo) { est.error = 'Elige tu nombre en la lista.'; return render(); }
            } else {
              yo = { nombre: String(b.nombre || '').trim(), correo: String(b.correo || '').trim().toLowerCase() };
              if (!yo.nombre || !AP.esCorreo(yo.correo)) { est.error = 'Escribe tu nombre y un correo válido.'; return render(); }
            }
            est.yo = { nombre: yo.nombre, correo: yo.correo }; est.error = '';
            AP.guardarLocal(claveLocal, est.yo);
            render();
          } },
          roster.length ? h('div', { class: 'campo' }, h('label', { for: 'quien' }, 'Jurado'),
            h('select', { id: 'quien', onchange: function (e) { est.eligiendo = e.target.value; est.error = ''; render(); } },
              h('option', { value: '' }, 'Elige tu nombre'),
              roster.map(function (r) { return h('option', { value: r.correo, selected: est.eligiendo === r.correo }, r.nombre + (r.institucion ? ' (' + r.institucion + ')' : '')); }),
              h('option', { value: 'otra', selected: est.eligiendo === 'otra' }, 'No estoy en la lista'))) : null,
          otra ? [
            h('div', { class: 'campo' }, h('label', { for: 'jnombre' }, 'Nombre y apellido'),
              h('input', { id: 'jnombre', value: b.nombre || '', autocomplete: 'name', oninput: function (e) { b.nombre = e.target.value; } })),
            h('div', { class: 'campo' }, h('label', { for: 'jcorreo' }, 'Correo electrónico'),
              h('input', { id: 'jcorreo', type: 'email', value: b.correo || '', autocomplete: 'email', oninput: function (e) { b.correo = e.target.value; } }))
          ] : null,
          est.error ? h('div', { class: 'error' }, est.error) : null,
          h('button', { class: 'boton boton-principal', type: 'submit' }, 'Entrar al panel')));
    }

    function estoy(f) { return f.jurados.some(function (j) { return j.correo === est.yo.correo; }); }
    function lleno(f) { return datos.maxJurados && f.jurados.length >= datos.maxJurados; }

    function panel() {
      var mias = 0;
      datos.dias.forEach(function (d) { d.ventanas.forEach(function (v) { v.bloques.forEach(function (f) { if (estoy(f)) mias++; }); }); });
      var visibles = 0;
      var dias = datos.dias.map(function (d) {
        var ventanas = d.ventanas.map(function (v) {
          var filas = v.bloques.filter(function (f) {
            if (est.filtro === 'agendadas') return !!f.reserva;
            if (est.filtro === 'mias') return estoy(f);
            return true;
          });
          if (!filas.length) return null;
          visibles += filas.length;
          var futuras = v.bloques.filter(function (f) { return !f.pasado; });
          var porSumar = futuras.filter(function (f) { return !estoy(f) && !lleno(f); });
          var mis = futuras.filter(estoy);
          return h('div', null,
            h('div', { class: 'jbloque' }, h('h4', null, v.etiqueta.replace(' · ', ', ')),
              porSumar.length ? h('button', { class: 'boton boton-borde', type: 'button', onclick: function () { actualizar('sumar', porSumar); } }, 'Sumarme a todo el bloque')
                : (mis.length ? h('button', { class: 'boton boton-suave', type: 'button', onclick: function () { actualizar('salir', mis); } }, 'Salir del bloque') : null)),
            filas.map(fila));
        }).filter(Boolean);
        return ventanas.length ? h('div', { class: 'jdia' }, h('h3', { class: 'jdia-titulo' }, d.etiqueta), ventanas) : null;
      });
      return h('section', { class: 'paso', 'aria-busy': String(est.ocupado), style: est.ocupado ? { opacity: '.6', pointerEvents: 'none' } : null },
        h('h2', null, 'Entrevistas'),
        h('div', { class: 'yo' },
          h('span', null, 'Entraste como ', h('b', null, est.yo.nombre), ' (' + est.yo.correo + ')'),
          h('button', { class: 'boton-texto', type: 'button', onclick: function () { est.yo = null; AP.guardarLocal(claveLocal, null); render(); } }, 'Cambiar')),
        h('div', { class: 'cifras' },
          h('div', { class: 'cifra' }, h('b', null, datos.resumen.agendadas + ' de ' + datos.resumen.total), h('span', null, 'horarios reservados')),
          h('div', { class: 'cifra' }, h('b', null, mias), h('span', null, mias === 1 ? 'entrevista contigo' : 'entrevistas contigo')),
          h('button', { class: 'boton boton-suave', type: 'button', onclick: refrescar }, 'Actualizar')),
        datos.fijos && datos.fijos.length ? h('p', { class: 'nota', style: { marginTop: 0 } }, 'Invitados a todas las entrevistas: ' + datos.fijos.join(', ')) : null,
        h('div', { class: 'filtros', role: 'group', 'aria-label': 'Filtrar entrevistas' }, [['todas', 'Todas'], ['agendadas', 'Reservadas'], ['mias', 'Donde estoy']].map(function (f) {
          return h('button', { type: 'button', 'aria-pressed': String(est.filtro === f[0]), onclick: function () { est.filtro = f[0]; render(); } }, f[1]);
        })),
        dias,
        visibles ? null : h('div', { class: 'vacio' }, est.filtro === 'mias' ? 'Todavía no te sumas a ninguna entrevista.' : 'No hay entrevistas para mostrar.'));
    }

    function fila(f) {
      var mia = estoy(f), accion = null;
      if (!f.pasado) {
        if (mia) accion = h('button', { class: 'boton boton-suave', type: 'button', onclick: function () { actualizar('salir', [f]); } }, 'Salir');
        else if (lleno(f)) accion = h('span', { class: 'completo' }, 'Jurado completo');
        else accion = h('button', { class: 'boton boton-borde', type: 'button', onclick: function () { actualizar('sumar', [f]); } }, 'Sumarme');
      }
      return h('div', { class: 'fila' + (mia ? ' mia' : '') + (f.pasado ? ' pasada' : '') },
        h('div', { class: 't' }, h('b', null, f.hora), h('span', null, 'a ' + f.termino)),
        h('div', { class: 'p' },
          f.reserva ? h('b', null, f.reserva.nombre) : h('span', { class: 'libre' }, 'Aún sin reservar'),
          f.reserva && f.reserva.detalles.length ? h('div', { class: 'etqs' }, f.reserva.detalles.map(function (d) { return h('span', { class: 'etq' }, d); })) : null,
          f.jurados.length ? h('div', { class: 'etqs' }, f.jurados.map(function (j) {
            return h('span', { class: 'etq jur' + (j.correo === est.yo.correo ? ' yo-mismo' : ''), title: j.correo }, j.nombre);
          })) : null,
          f.reserva && f.reserva.link && mia ? h('div', { style: { marginTop: '6px' } }, h('a', { href: f.reserva.link, target: '_blank', rel: 'noopener' }, 'Link de la videollamada')) : null),
        accion ? h('div', { class: 'acc' }, accion) : null);
    }

    function actualizar(cambio, filas) {
      if (est.ocupado || op.preview) return;
      est.ocupado = true; render();
      AP.api('jurado.actualizar', { e: inst.id, k: op.k || '', cambio: cambio, bloques: filas.map(function (f) { return f.clave; }), nombre: est.yo.nombre, correo: est.yo.correo })
        .then(function (nuevos) { datos = nuevos; est.ocupado = false; render(); if (nuevos.mensaje) AP.avisar(nuevos.mensaje); })
        .catch(function (err) { est.ocupado = false; render(); AP.avisar(AP.codigoError(err).mensaje, true); });
    }

    function refrescar() {
      if (est.ocupado || op.preview) return;
      est.ocupado = true; render();
      AP.api('jurado', { e: inst.id, k: op.k || '' })
        .then(function (nuevos) { datos = nuevos; est.ocupado = false; render(); AP.avisar('Actualizado.'); })
        .catch(function (err) { est.ocupado = false; render(); AP.avisar(AP.codigoError(err).mensaje, true); });
    }
  };

  /* ---------- Cancelación ---------- */
  V.cancelar = function (raiz, datos) {
    var inst = datos.instancia, r = datos.reserva;
    var flujo = marco(raiz, inst, false);
    var est = { confirmando: false, enviando: false, error: '' };
    var fecha = (datos.reserva.clave || '').slice(0, 10);
    render();

    function render() {
      var p = fecha ? AP.partesFecha(fecha) : null;
      var resumen = p ? h('div', { class: 'pase' },
        h('div', { class: 'pase-fecha' }, h('span', { class: 'dow' }, p.dow), h('span', { class: 'num' }, p.num), h('span', { class: 'mes' }, p.mes)),
        h('div', { class: 'pase-info' }, h('p', { class: 'pase-hora' }, r.hora + ' a ' + r.termino), h('p', null, r.nombre))) : null;
      var acciones;
      if (r.cancelada) acciones = [h('p', { class: 'nota' }, 'Esta hora ya fue cancelada.'), botonNueva(true)];
      else if (r.pasada) acciones = h('p', { class: 'nota' }, 'Esta hora ya pasó.');
      else if (!est.confirmando) acciones = h('button', { class: 'boton boton-peligro', type: 'button', onclick: function () { est.confirmando = true; render(); } }, 'Cancelar mi hora');
      else acciones = [
        h('p', { class: 'nota' }, 'Tu hora quedará libre para otra persona. Después puedes elegir una nueva.'),
        est.error ? h('div', { class: 'error' }, est.error) : null,
        h('div', { style: { display: 'flex', gap: '10px', marginTop: '16px' } },
          h('button', { class: 'boton boton-suave', type: 'button', style: { flex: '1' }, disabled: est.enviando, onclick: function () { est.confirmando = false; render(); } }, 'Volver'),
          h('button', { class: 'boton boton-peligro', type: 'button', style: { flex: '1', marginTop: '0' }, disabled: est.enviando, onclick: cancelar }, est.enviando ? 'Cancelando…' : 'Sí, cancelar mi hora'))
      ];
      AP.pintar(flujo, h('section', { class: 'paso' }, h('h2', null, 'Tu hora'), resumen, acciones));
    }

    function botonNueva(activa) {
      if (!activa) return null;
      return h('a', { class: 'boton boton-principal', href: '?e=' + encodeURIComponent(inst.id) }, 'Elegir otra hora');
    }

    function cancelar() {
      est.enviando = true; est.error = ''; render();
      AP.api('cancelar', { token: datos.token }).then(function (res) {
        AP.pintar(flujo, h('section', { class: 'paso listo' },
          h('h2', null, 'Cancelaste tu hora'),
          h('p', null, 'El horario quedó libre y avisamos a la organización.'),
          botonNueva(res.activa !== false)));
      }).catch(function (err) { est.enviando = false; est.error = AP.codigoError(err).mensaje; render(); });
    }
  };
})();
