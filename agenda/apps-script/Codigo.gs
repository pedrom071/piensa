/**
 * AGENDA P!ENSA
 * Agendamiento de entrevistas y reuniones sobre Google Sheets + Google Calendar.
 *
 * - La planilla es el panel de control: cada fila de "Instancias" es una agenda
 *   (concurso, programa, evento) con sus horarios, duración, logos y colores.
 * - La app web muestra los horarios libres; al reservar crea el evento en tu
 *   Google Calendar (con Google Meet si corresponde) e invita por correo a la
 *   persona, a los invitados fijos y a los jurados que ya se sumaron a ese horario.
 * - El panel de jurado (link con clave) permite que cada jurado se sume o salga
 *   de las entrevistas; también puedes asignarlos desde la hoja o directo en Calendar.
 *
 * Instalación: ver README.md
 */

const ZONA = 'America/Santiago';
const REMITENTE = 'Fundación P!ensa';
const LOGO_PIENSA = 'https://jovenesliderespiensa.cl/wp-content/uploads/2021/03/piensa.png';
const FAVICON = 'https://fundacionpiensa.cl/app/uploads/2023/12/favicon.png';
// Sitio público (GitHub Pages). Se usa en los links de los correos. Se puede cambiar con la propiedad URL_SITIO.
const SITIO_POR_DEFECTO = 'https://pedrom071.github.io/piensa/agenda/';

const HOJA = {
  INSTANCIAS: 'Instancias',
  HORARIOS: 'Horarios',
  RESERVAS: 'Reservas',
  JURADOS: 'Jurados',
  ASIGNACIONES: 'Jurados por entrevista',
  AUTORIZADOS: 'Autorizados',
};

const COLUMNAS = {
  'Instancias': [
    'id', 'activa', 'titulo', 'subtitulo', 'descripcion', 'duracion_min', 'pausa_min',
    'modalidad', 'lugar_o_link', 'color_principal', 'color_acento', 'logo_piensa',
    'logo_programa', 'logo_aliado', 'calendario', 'responder_a', 'aviso_a',
    'invitados_fijos', 'clave_jurado', 'max_jurados', 'campos_extra', 'una_por_correo',
    'aviso_minimo_horas', 'respetar_ocupado', 'mostrar_invitados', 'recordatorio_horas',
    'mensaje_confirmacion', 'logos_fondo',
  ],
  'Horarios': ['instancia', 'fecha', 'desde', 'hasta'],
  'Reservas': [
    'creada', 'instancia', 'bloque', 'termino', 'nombre', 'correo', 'respuestas',
    'estado', 'evento_id', 'link_reunion', 'token', 'recordatorio',
  ],
  'Jurados': ['instancia', 'nombre', 'correo', 'institucion'],
  'Jurados por entrevista': ['instancia', 'bloque', 'nombre', 'correo', 'agregado'],
  'Autorizados': ['instancia', 'correo', 'nombre'],
};

// Columnas que deben quedar como texto (para que Sheets no las convierta en fechas).
const COLUMNAS_TEXTO = {
  'Horarios': ['fecha', 'desde', 'hasta'],
  'Reservas': ['bloque', 'termino', 'token', 'evento_id'],
  'Jurados por entrevista': ['bloque'],
  'Instancias': ['id', 'color_principal', 'color_acento', 'clave_jurado'],
};

const CASILLAS = ['activa', 'una_por_correo', 'respetar_ocupado', 'mostrar_invitados'];

const NOTAS = {
  'Instancias': {
    id: 'Código corto sin espacios ni tildes. Va en el link de la página: ...?e=jlp2026',
    activa: 'Marcada = la página acepta reservas. Desmárcala para cerrar la agenda.',
    titulo: 'Título grande de la página. También es el nombre del evento en Calendar.',
    subtitulo: 'Texto pequeño sobre el título (programa, etapa, aliado).',
    descripcion: 'Párrafo que ve la persona antes de elegir horario.',
    duracion_min: 'Duración de cada cita, en minutos.',
    pausa_min: 'Minutos libres entre una cita y la siguiente (0 = seguidas).',
    modalidad: 'Google Meet (crea un link distinto por cita), Presencial o Link propio (Zoom, Teams…).',
    lugar_o_link: 'Presencial: dirección. Link propio: el link fijo. Google Meet: dejar vacío.',
    color_principal: 'Color de la franja superior y los botones. Formato #RRGGBB.',
    color_acento: 'Color de detalles (etiquetas, horario elegido). Formato #RRGGBB.',
    logo_piensa: 'Link a imagen PNG/JPG pública, o link de Google Drive de un archivo compartido como "Cualquier persona con el enlace". Evita SVG: no se ve en los correos.',
    logo_programa: 'Logo del programa o instancia (mismas reglas que logo_piensa).',
    logo_aliado: 'Logo de un aliado (opcional).',
    calendario: 'ID del calendario donde se crean las citas. Vacío = tu calendario principal.',
    responder_a: 'Correo al que llegan las respuestas a los correos de confirmación.',
    aviso_a: 'Correos que reciben aviso de cada reserva o cancelación (separados por coma).',
    invitados_fijos: 'Correos que se invitan a TODAS las citas (ej. un jurado que estará siempre).',
    clave_jurado: 'Clave del panel de jurado. Vacío = panel desactivado.',
    max_jurados: 'Máximo de jurados por cita (sin contar invitados fijos). Vacío = sin límite.',
    campos_extra: 'Preguntas del formulario, separadas por punto y coma.\n* al final = obligatoria.\nOpciones después de dos puntos, separadas por |\nEj: Comuna*; Categoría*: Salud|Cultura|Deporte\nLos campos de teléfono, correo, RUT o dirección no se muestran al jurado.',
    una_por_correo: 'Marcada = cada correo puede tener una sola cita activa.',
    aviso_minimo_horas: 'No se puede reservar con menos de estas horas de anticipación.',
    respetar_ocupado: 'Marcada = oculta horarios que choquen con otros eventos "ocupado" de tu calendario. Si bloqueaste estos días con un evento propio, déjala desmarcada.',
    mostrar_invitados: 'Marcada = los invitados ven quién más está invitado.',
    recordatorio_horas: 'Horas antes de la cita para enviar un recordatorio por correo (0 = no). Requiere "Activar recordatorios automáticos" en el menú.',
    mensaje_confirmacion: 'Texto adicional que va en el correo de confirmación.',
    logos_fondo: 'blanco (por defecto) o color: dónde van los logos. Usa "color" si tus logos son blancos.',
  },
  'Horarios': {
    instancia: 'id de la instancia (columna id de la hoja Instancias).',
    fecha: 'Formato 2026-11-18 o 18/11/2026.',
    desde: 'Hora de inicio del bloque, ej. 10:30',
    hasta: 'Hora de término del bloque, ej. 13:30. La última cita termina a esta hora o antes.',
  },
  'Reservas': {
    estado: 'Confirmada o Cancelada. Para bloquear un horario a mano, agrega una fila con instancia, bloque (2026-11-18 10:30) y estado Bloqueado.',
    bloque: 'Fecha y hora de inicio, formato 2026-11-18 10:30',
  },
  'Jurados': {
    instancia: 'id de la instancia. Esta lista aparece como menú en el panel de jurado.',
  },
  'Jurados por entrevista': {
    bloque: 'Fecha y hora de la entrevista, formato 2026-11-18 10:30. Puedes agregar filas a mano y luego usar "Sincronizar jurados con Calendar".',
  },
  'Autorizados': {
    instancia: 'Si una instancia tiene correos en esta hoja, SOLO esos correos pueden reservar. Si no tiene ninguno, cualquiera con el link puede reservar.',
  },
};

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
  'septiembre', 'octubre', 'noviembre', 'diciembre'];

/* =========================================================================
 * APP WEB
 * ========================================================================= */

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.api) {
    if (String(p.api).indexOf('admin.') === 0) return json_({ ok: false, error: 'Usa POST para administrar.' });
    return json_(despachar_(Object.assign({}, p, { accion: p.api })));
  }
  recordarUrl_();
  let estado;
  try {
    if (p.cancelar) {
      estado = { vista: 'cancelar', datos: datosCancelacion_(p.cancelar) };
    } else if (p.e && p.modo === 'jurado') {
      estado = { vista: 'jurado', datos: datosJurado(p.e, p.k || '') };
    } else if (p.e) {
      estado = { vista: 'reserva', datos: datosReserva(p.e) };
    } else {
      throw new Error('Este link está incompleto. Revisa que lo hayas copiado entero.');
    }
  } catch (err) {
    estado = { vista: 'error', datos: { mensaje: mensajeError_(err), instancia: marcaPorDefecto_(p.e) } };
  }
  estado.url = urlApp_();
  estado.params = { e: String(p.e || ''), k: String(p.k || '') };
  const titulo = (estado.datos && estado.datos.instancia && estado.datos.instancia.titulo) || 'Agenda P!ensa';
  const plantilla = HtmlService.createTemplateFromFile('Pagina');
  plantilla.inicial = JSON.stringify(estado).replace(/</g, '\\u003c');
  const salida = plantilla.evaluate()
    .setTitle(titulo)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  try { salida.setFaviconUrl(FAVICON); } catch (err) { /* sin favicon */ }
  return salida;
}

/** Datos públicos para la página de reserva. */
function datosReserva(id) {
  const inst = cargarInstancia_(id);
  if (!inst) throw new Error('No encontramos esta agenda. Revisa el link.');
  if (!inst.activa) {
    const err = new Error('Esta agenda está cerrada por ahora.' + (inst.responderA ? ' Escríbenos a ' + inst.responderA + '.' : ''));
    err.instancia = publico_(inst);
    throw err;
  }
  const disp = disponibilidad_(inst);
  const dias = [];
  agruparPorDia_(disp, function (b) { return b; }).forEach(function (dia) {
    const todos = [];
    dia.ventanas.forEach(function (v) { v.bloques.forEach(function (b) { todos.push(b); }); });
    if (todos.length && todos.every(function (b) { return b.pasado; })) return; // día ya pasó
    let libres = 0;
    const ventanas = dia.ventanas.map(function (v) {
      const bloques = v.bloques.filter(function (b) { return b.libre; })
        .map(function (b) { return { clave: b.clave, hora: b.hora, termino: b.termino }; });
      libres += bloques.length;
      return { etiqueta: v.etiqueta, bloques: bloques };
    }).filter(function (v) { return v.bloques.length; });
    dias.push({ fecha: dia.fecha, etiqueta: dia.etiqueta, corta: dia.corta, libres: libres, ventanas: ventanas });
  });
  return { instancia: publico_(inst), dias: dias };
}

/** Crea la reserva: valida, crea el evento en Calendar, registra en la hoja y envía correos. */
function reservar(id, clave, formulario) {
  formulario = formulario || {};
  const nombre = limpiar_(formulario.nombre, 120);
  const correo = String(formulario.correo || '').trim().toLowerCase();
  if (!nombre) throw new Error('Escribe tu nombre.');
  if (!esCorreo_(correo)) throw new Error('Revisa tu correo electrónico: parece que tiene un error.');

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(25000)) throw new Error('Hay muchas personas reservando al mismo tiempo. Intenta de nuevo en unos segundos.');
  let inst, bloque, evento, token, respuestas;
  try {
    inst = cargarInstancia_(id);
    if (!inst || !inst.activa) throw new Error('Esta agenda no está recibiendo reservas.');

    respuestas = inst.campos.map(function (c) {
      const valor = limpiar_(formulario[c.id], 300);
      if (c.requerido && !valor) throw new Error('Completa el campo "' + c.etiqueta + '".');
      if (valor && c.opciones.length && c.opciones.indexOf(valor) === -1) {
        throw new Error('Elige una opción válida en "' + c.etiqueta + '".');
      }
      return { etiqueta: c.etiqueta, valor: valor, privado: c.privado };
    });

    const autorizados = leerTabla_(HOJA.AUTORIZADOS).filas.filter(function (r) {
      return mismaInstancia_(r.instancia, inst.id) && r.correo;
    });
    if (autorizados.length && !autorizados.some(function (r) { return r.correo.toLowerCase() === correo; })) {
      throw new Error('Este correo no está en la lista de personas convocadas. Usa el mismo correo con el que postulaste' +
        (inst.responderA ? ' o escríbenos a ' + inst.responderA : '') + '.');
    }

    const disp = disponibilidad_(inst);
    bloque = disp.bloques.filter(function (b) { return b.clave === clave; })[0];
    if (!bloque) throw new Error('TOMADO|Ese horario ya no está disponible. Elige otro.');
    if (!bloque.libre) throw new Error('TOMADO|Alguien acaba de tomar ese horario. Elige otro.');

    if (inst.unaPorCorreo) {
      const previa = disp.lista.filter(function (r) { return r.correo === correo; })[0];
      if (previa) {
        const e = etiquetaFecha_(previa.bloque.slice(0, 10));
        throw new Error('Ya tienes una cita agendada el ' + e.larga + ' a las ' + previa.bloque.slice(11) +
          '. Si quieres cambiarla, usa el botón "Cancelar" del correo de confirmación y vuelve a agendar.');
      }
    }

    const inicio = new Date(bloque.inicioMs);
    const fin = new Date(bloque.inicioMs + inst.duracion * 60000);
    const jurados = asignaciones_(inst.id)[clave] || [];
    const invitados = unirInvitados_([{ email: correo, displayName: nombre }]
      .concat(inst.invitadosFijos.map(function (c) { return { email: c }; }))
      .concat(jurados.map(function (j) { return { email: j.correo, displayName: j.nombre }; })));

    evento = crearEvento_(inst, {
      nombre: nombre, correo: correo, respuestas: respuestas,
      inicio: inicio, fin: fin, invitados: invitados, clave: clave,
    });

    token = Utilities.getUuid().replace(/-/g, '');
    const tabla = leerTabla_(HOJA.RESERVAS);
    try {
      agregarFila_(tabla, {
        creada: new Date(),
        instancia: inst.id,
        bloque: clave,
        termino: bloque.termino,
        nombre: nombre,
        correo: correo,
        respuestas: respuestas.filter(function (r) { return r.valor; })
          .map(function (r) { return r.etiqueta + ': ' + r.valor; }).join(' | '),
        estado: 'Confirmada',
        evento_id: evento.id,
        link_reunion: evento.link,
        token: token,
        recordatorio: '',
      });
      SpreadsheetApp.flush();
    } catch (err) {
      // Si no se pudo registrar, se borra el evento para no dejar citas fantasma.
      intentar_(function () { Calendar.Events.remove(inst.calendario, evento.id, { sendUpdates: 'all' }); });
      throw new Error('No pudimos registrar tu reserva. Intenta de nuevo en un momento.');
    }
  } finally {
    lock.releaseLock();
  }

  const reserva = {
    nombre: nombre, correo: correo, clave: clave, hora: bloque.hora, termino: bloque.termino,
    respuestas: respuestas, link: evento.link, token: token,
  };
  intentar_(function () { enviarConfirmacion_(inst, reserva); });
  intentar_(function () { avisarEquipo_(inst, reserva, 'nueva'); });

  const e = etiquetaFecha_(clave.slice(0, 10));
  return {
    nombre: nombre, correo: correo, fecha: e.larga, hora: bloque.hora, termino: bloque.termino,
    modalidad: inst.modalidad, tipo: tipoModalidad_(inst), lugar: inst.lugar, link: evento.link,
  };
}

/** Datos para la página de cancelación (link del correo). */
function datosCancelacion_(token) {
  const r = buscarPorToken_(token);
  if (!r) throw new Error('No encontramos esta reserva. Puede que el link esté incompleto.');
  const inst = cargarInstancia_(r.fila.instancia);
  if (!inst) throw new Error('Esta agenda ya no existe.');
  const e = etiquetaFecha_(r.fila.bloque.slice(0, 10));
  const inicio = fechaHora_(r.fila.bloque);
  return {
    instancia: publico_(inst),
    reserva: {
      clave: r.fila.bloque, nombre: r.fila.nombre, fecha: e.larga, hora: r.fila.bloque.slice(11), termino: r.fila.termino,
      cancelada: /cancel/i.test(r.fila.estado), pasada: inicio.getTime() < ahora_().getTime(),
    },
    token: token,
  };
}

/** Cancela una reserva desde el link del correo. */
function cancelarReserva(token) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(25000)) throw new Error('Intenta de nuevo en unos segundos.');
  let inst, fila;
  try {
    const r = buscarPorToken_(token);
    if (!r) throw new Error('No encontramos esta reserva.');
    fila = r.fila;
    if (/cancel/i.test(fila.estado)) return { yaCancelada: true, instanciaId: fila.instancia };
    if (fechaHora_(fila.bloque).getTime() < ahora_().getTime()) throw new Error('Esta cita ya pasó.');
    inst = cargarInstancia_(fila.instancia);
    if (fila.evento_id && inst) {
      try {
        Calendar.Events.remove(inst.calendario, fila.evento_id, { sendUpdates: 'all' });
      } catch (err) {
        console.warn('No se pudo borrar el evento ' + fila.evento_id + ': ' + err);
      }
    }
    escribirCelda_(r.tabla, fila._fila, 'estado', 'Cancelada');
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }
  if (inst) {
    intentar_(function () {
      avisarEquipo_(inst, { nombre: fila.nombre, correo: fila.correo, clave: fila.bloque, hora: fila.bloque.slice(11), termino: fila.termino, respuestas: [] }, 'cancelada');
    });
  }
  return { ok: true, instanciaId: fila.instancia, activa: !!(inst && inst.activa) };
}

/* ---------- Panel de jurado ---------- */

function datosJurado(id, clave) {
  const inst = cargarInstancia_(id);
  if (!inst) throw new Error('No encontramos esta agenda. Revisa el link.');
  validarClave_(inst, clave);
  const disp = disponibilidad_(inst);
  const asign = asignaciones_(inst.id);
  const ahoraMs = ahora_().getTime();
  let total = 0, agendadas = 0;
  const dias = agruparPorDia_(disp, function (b) {
    const r = disp.reservas[b.clave];
    total++;
    if (r && r.nombre) agendadas++;
    return {
      clave: b.clave, hora: b.hora, termino: b.termino,
      pasado: b.inicioMs + inst.duracion * 60000 < ahoraMs,
      reserva: r ? {
        nombre: r.nombre || 'Bloqueado',
        bloqueado: !r.nombre,
        detalles: respuestasPublicas_(r.respuestas),
        link: r.link_reunion || '',
      } : null,
      jurados: asign[b.clave] || [],
    };
  });
  const roster = leerTabla_(HOJA.JURADOS).filas
    .filter(function (r) { return mismaInstancia_(r.instancia, inst.id) && esCorreo_(r.correo); })
    .map(function (r) { return { nombre: r.nombre, correo: r.correo.toLowerCase(), institucion: r.institucion || '' }; });
  return {
    instancia: publico_(inst),
    roster: roster,
    dias: dias,
    maxJurados: inst.maxJurados,
    fijos: inst.invitadosFijos,
    resumen: { total: total, agendadas: agendadas },
  };
}

/**
 * Suma o saca a un jurado de una o varias entrevistas.
 * accion: 'sumar' | 'salir'; bloques: ['2026-11-18 10:30', ...]
 */
function juradoActualizar(id, clave, accion, bloques, nombre, correo) {
  const inst = cargarInstancia_(id);
  if (!inst) throw new Error('No encontramos esta agenda.');
  validarClave_(inst, clave);
  correo = String(correo || '').trim().toLowerCase();
  nombre = limpiar_(nombre, 120);
  if (!esCorreo_(correo)) throw new Error('Revisa tu correo.');
  if (!nombre) throw new Error('Escribe tu nombre.');
  if (!Array.isArray(bloques) || !bloques.length) throw new Error('No hay entrevistas seleccionadas.');

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(25000)) throw new Error('Intenta de nuevo en unos segundos.');
  let cambios = 0, llenos = 0, problemas = 0;
  try {
    const tabla = leerTabla_(HOJA.ASIGNACIONES);
    const disp = disponibilidad_(inst);
    const validas = {};
    disp.bloques.forEach(function (b) { validas[b.clave] = true; });
    const asign = asignaciones_(inst.id, tabla);

    if (accion === 'sumar') {
      bloques.forEach(function (k) {
        if (!validas[k]) return;
        const lista = asign[k] || (asign[k] = []);
        if (lista.some(function (j) { return j.correo === correo; })) return;
        if (inst.maxJurados && lista.length >= inst.maxJurados) { llenos++; return; }
        agregarFila_(tabla, { instancia: inst.id, bloque: k, nombre: nombre, correo: correo, agregado: new Date() });
        lista.push({ nombre: nombre, correo: correo });
        cambios++;
        const r = disp.reservas[k];
        if (r && r.evento_id) {
          try { agregarAsistentes_(inst, r.evento_id, [{ email: correo, displayName: nombre }]); }
          catch (err) { problemas++; console.warn(err); }
        }
      });
    } else if (accion === 'salir') {
      const filas = tabla.filas.filter(function (f) {
        return mismaInstancia_(f.instancia, inst.id) && bloques.indexOf(normBloque_(f.bloque)) !== -1 &&
          String(f.correo).trim().toLowerCase() === correo;
      }).map(function (f) { return f._fila; }).sort(function (a, b) { return b - a; });
      filas.forEach(function (n) { tabla.hoja.deleteRow(n); });
      cambios = filas.length;
      bloques.forEach(function (k) {
        const r = disp.reservas[k];
        if (r && r.evento_id && r.correo !== correo && inst.invitadosFijos.indexOf(correo) === -1) {
          try { quitarAsistente_(inst, r.evento_id, correo); }
          catch (err) { problemas++; console.warn(err); }
        }
      });
    } else {
      throw new Error('Acción no válida.');
    }
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }
  const datos = datosJurado(id, clave);
  const partes = [];
  if (accion === 'sumar') partes.push(cambios === 1 ? 'Quedaste en 1 entrevista.' : 'Quedaste en ' + cambios + ' entrevistas.');
  else partes.push(cambios === 1 ? 'Saliste de 1 entrevista.' : 'Saliste de ' + cambios + ' entrevistas.');
  if (llenos) partes.push(llenos + (llenos === 1 ? ' ya tenía' : ' ya tenían') + ' el máximo de jurados.');
  if (problemas) partes.push('Hubo ' + problemas + ' invitación(es) que no se pudieron actualizar en Calendar; avisa a la organización.');
  datos.mensaje = partes.join(' ');
  return datos;
}

/* =========================================================================
 * API PARA EL SITIO (GitHub Pages)
 * El sitio llama a esta app con fetch POST (texto JSON). Responde { ok, datos | error }.
 * ========================================================================= */

function doPost(e) {
  let pedido;
  try {
    pedido = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return json_({ ok: false, error: 'Pedido inválido.' });
  }
  return json_(despachar_(pedido));
}

function json_(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto)).setMimeType(ContentService.MimeType.JSON);
}

function despachar_(p) {
  p = p || {};
  const acciones = {
    'reserva': function () { return datosReserva(p.e); },
    'reservar': function () { return reservar(p.e, p.bloque, p.datos); },
    'cancelacion': function () { return datosCancelacion_(p.token); },
    'cancelar': function () { return cancelarReserva(p.token); },
    'jurado': function () { return datosJurado(p.e, p.k); },
    'jurado.actualizar': function () { return juradoActualizar(p.e, p.k, p.cambio, p.bloques, p.nombre, p.correo); },
    'admin.entrar': function () { return adminEntrar_(p.sitio); },
    'admin.resumen': function () { return adminResumen_(); },
    'admin.instancia': function () { return adminInstancia_(p.e); },
    'admin.guardar': function () { return adminGuardar_(p.instancia, !!p.nueva); },
    'admin.activar': function () { return adminActivar_(p.e, !!p.activa); },
    'admin.reservas': function () { return adminReservas_(p.e); },
    'admin.cancelar': function () { return cancelarReserva(p.token); },
    'admin.logo': function () { return adminSubirLogo_(p.nombre, p.tipo, p.base64); },
  };
  try {
    const fn = acciones[p.accion];
    if (!fn) throw new Error('Acción desconocida.');
    if (String(p.accion).indexOf('admin.') === 0) verificarAdmin_(p.clave);
    return { ok: true, datos: fn() };
  } catch (err) {
    return { ok: false, error: mensajeError_(err) };
  }
}

/* ---------- Administración ---------- */

function claveAdmin_() {
  const props = PropertiesService.getScriptProperties();
  let clave = props.getProperty('CLAVE_ADMIN');
  if (!clave) {
    clave = Utilities.getUuid().replace(/-/g, '').slice(0, 20);
    props.setProperty('CLAVE_ADMIN', clave);
  }
  return clave;
}

function verificarAdmin_(clave) {
  const real = PropertiesService.getScriptProperties().getProperty('CLAVE_ADMIN');
  if (!real || String(clave || '').trim() !== real) {
    Utilities.sleep(700);
    throw new Error('CLAVE|La clave de administración no es válida. Búscala en la planilla: Agenda P!ensa → Abrir el creador.');
  }
}

function urlPublica_() {
  const sitio = PropertiesService.getScriptProperties().getProperty('URL_SITIO');
  return sitio || urlApp_();
}

/** Al entrar al creador se recuerda la dirección del sitio, para usarla en los correos. */
function adminEntrar_(sitio) {
  const s = String(sitio || '').trim().replace(/[?#].*$/, '');
  if (/^https:\/\/[^\s]+\/$/.test(s) && !/localhost|127\.0\.0\.1/.test(s)) {
    PropertiesService.getScriptProperties().setProperty('URL_SITIO', s);
  }
  return { sitio: urlPublica_(), planilla: libro_().getUrl() };
}

function adminResumen_() {
  const lista = leerTabla_(HOJA.INSTANCIAS).filas.filter(function (f) { return f.id; }).map(function (f) {
    const inst = normalizarInstancia_(f);
    const r = { id: inst.id, titulo: inst.titulo, subtitulo: inst.subtitulo, activa: inst.activa, color1: inst.color1,
      color2: inst.color2, texto1: textoSobre_(inst.color1), logos: inst.logos, logosFondo: inst.logosFondo,
      modalidad: inst.modalidad, duracion: inst.duracion, claveJurado: inst.claveJurado,
      total: 0, agendadas: 0, libres: 0, desde: '', hasta: '', error: '' };
    try {
      const d = disponibilidad_(inst);
      d.bloques.forEach(function (b) {
        r.total++;
        const res = d.reservas[b.clave];
        if (res && res.nombre) r.agendadas++;
        if (b.libre) r.libres++;
      });
      if (d.bloques.length) { r.desde = d.bloques[0].fecha; r.hasta = d.bloques[d.bloques.length - 1].fecha; }
    } catch (err) { r.error = mensajeError_(err); }
    return r;
  });
  return { instancias: lista, sitio: urlPublica_(), planilla: libro_().getUrl() };
}

/** Configuración completa de una instancia, en el formato del creador. */
function adminInstancia_(id) {
  const f = leerTabla_(HOJA.INSTANCIAS).filas.filter(function (r) { return mismaInstancia_(r.id, id); })[0];
  if (!f) throw new Error('No encontré esa agenda.');
  const inst = normalizarInstancia_(f);
  const horarios = leerTabla_(HOJA.HORARIOS).filas.filter(function (r) { return mismaInstancia_(r.instancia, inst.id); })
    .map(function (r) { return { fecha: normFecha_(r.fecha), desde: normHora_(r.desde), hasta: normHora_(r.hasta) }; })
    .filter(function (h) { return h.fecha && h.desde && h.hasta; })
    .sort(function (a, b) { return (a.fecha + a.desde) < (b.fecha + b.desde) ? -1 : 1; });
  const jurados = leerTabla_(HOJA.JURADOS).filas.filter(function (r) { return mismaInstancia_(r.instancia, inst.id); })
    .map(function (r) { return { nombre: r.nombre, correo: r.correo, institucion: r.institucion || '' }; });
  const autorizados = leerTabla_(HOJA.AUTORIZADOS).filas.filter(function (r) { return mismaInstancia_(r.instancia, inst.id); })
    .map(function (r) { return { correo: r.correo, nombre: r.nombre || '' }; });
  return {
    id: inst.id,
    activa: inst.activa,
    titulo: f.titulo || '',
    subtitulo: inst.subtitulo,
    descripcion: inst.descripcion,
    duracion: inst.duracion,
    pausa: inst.pausa,
    modalidad: tipoModalidad_(inst),
    lugar: inst.lugar,
    color1: inst.color1,
    color2: inst.color2,
    logoPiensa: f.logo_piensa || '',
    logoPrograma: f.logo_programa || '',
    logoAliado: f.logo_aliado || '',
    logosFondo: inst.logosFondo,
    calendario: String(f.calendario || '').trim(),
    responderA: f.responder_a || '',
    avisoA: f.aviso_a || '',
    invitadosFijos: f.invitados_fijos || '',
    claveJurado: inst.claveJurado,
    maxJurados: inst.maxJurados || '',
    campos: inst.campos.map(function (c) { return { etiqueta: c.etiqueta, requerido: c.requerido, opciones: c.opciones }; }),
    unaPorCorreo: inst.unaPorCorreo,
    avisoMinimoHoras: inst.avisoMinimoHoras,
    respetarOcupado: inst.respetarOcupado,
    mostrarInvitados: inst.mostrarInvitados,
    recordatorioHoras: inst.recordatorioHoras,
    mensaje: inst.mensaje,
    horarios: horarios,
    jurados: jurados,
    autorizados: autorizados,
  };
}

/** Crea o actualiza una instancia desde el creador. */
function adminGuardar_(m, nueva) {
  m = m || {};
  const id = String(m.id || '').trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{1,39}$/.test(id)) throw new Error('El código del link debe tener entre 2 y 40 letras minúsculas, números o guiones, sin tildes ni espacios.');
  const titulo = limpiarTexto_(m.titulo, 140);
  if (!titulo) throw new Error('Falta el título.');
  const duracion = Math.round(num_(m.duracion, 0));
  if (duracion < 5 || duracion > 480) throw new Error('La duración debe estar entre 5 y 480 minutos.');
  const tipo = ['meet', 'presencial', 'link'].indexOf(m.modalidad) >= 0 ? m.modalidad : 'presencial';
  if (tipo === 'presencial' && !limpiarTexto_(m.lugar, 300)) throw new Error('Escribe la dirección del lugar.');
  if (tipo === 'link' && !/^https?:\/\//i.test(String(m.lugar || '').trim())) throw new Error('Pega el link de la videollamada (debe empezar con https://).');

  const horarios = (m.horarios || []).map(function (h) {
    return { fecha: normFecha_(h.fecha), desde: normHora_(h.desde), hasta: normHora_(h.hasta) };
  });
  horarios.forEach(function (h) {
    if (!h.fecha || !h.desde || !h.hasta || aMinutos_(h.hasta) - aMinutos_(h.desde) < duracion) {
      throw new Error('Revisa los horarios: cada bloque debe tener fecha, inicio y término, y durar al menos ' + duracion + ' minutos.');
    }
  });

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(25000)) throw new Error('La planilla está ocupada. Intenta de nuevo en unos segundos.');
  try {
    asegurarColumnas_(HOJA.INSTANCIAS);
    const tabla = leerTabla_(HOJA.INSTANCIAS);
    const existente = tabla.filas.filter(function (r) { return mismaInstancia_(r.id, id); })[0];
    if (nueva && existente) throw new Error('Ya existe una agenda con el código "' + id + '". Elige otro.');
    if (!nueva && !existente) throw new Error('No encontré la agenda "' + id + '".');

    const valores = {
      id: id,
      activa: m.activa !== false,
      titulo: titulo,
      subtitulo: limpiarTexto_(m.subtitulo, 160),
      descripcion: limpiarTexto_(m.descripcion, 1200, true),
      duracion_min: duracion,
      pausa_min: Math.max(0, Math.round(num_(m.pausa, 0))),
      modalidad: { meet: 'Google Meet', presencial: 'Presencial', link: 'Link propio' }[tipo],
      lugar_o_link: tipo === 'meet' ? '' : limpiarTexto_(m.lugar, 300),
      color_principal: color_(m.color1, '#1d2b4f'),
      color_acento: color_(m.color2, '#e5533d'),
      logo_piensa: limpiarTexto_(m.logoPiensa, 500),
      logo_programa: limpiarTexto_(m.logoPrograma, 500),
      logo_aliado: limpiarTexto_(m.logoAliado, 500),
      logos_fondo: m.logosFondo === 'color' ? 'color' : 'blanco',
      calendario: limpiarTexto_(m.calendario, 200),
      responder_a: esCorreo_(String(m.responderA || '').trim()) ? String(m.responderA).trim() : '',
      aviso_a: correos_(m.avisoA).join(', '),
      invitados_fijos: correos_(m.invitadosFijos).join(', '),
      clave_jurado: limpiarTexto_(m.claveJurado, 60).replace(/[^\w-]/g, '') || ('jurado-' + Utilities.getUuid().slice(0, 6)),
      max_jurados: num_(m.maxJurados, 0) > 0 ? Math.round(num_(m.maxJurados, 0)) : '',
      campos_extra: serializarCampos_(m.campos),
      una_por_correo: m.unaPorCorreo !== false,
      aviso_minimo_horas: Math.max(0, num_(m.avisoMinimoHoras, 0)),
      respetar_ocupado: !!m.respetarOcupado,
      mostrar_invitados: !!m.mostrarInvitados,
      recordatorio_horas: Math.max(0, num_(m.recordatorioHoras, 0)),
      mensaje_confirmacion: limpiarTexto_(m.mensaje, 1000, true),
    };

    let fila;
    if (existente) {
      fila = existente._fila;
      const actual = tabla.hoja.getRange(fila, 1, 1, tabla.encabezados.length).getValues()[0];
      const nuevaFila = tabla.encabezados.map(function (h, j) { return h in valores ? valores[h] : actual[j]; });
      tabla.hoja.getRange(fila, 1, 1, nuevaFila.length).setValues([nuevaFila]);
    } else {
      agregarFila_(tabla, valores);
      fila = tabla.filas[tabla.filas.length - 1]._fila;
    }
    CASILLAS.forEach(function (c) {
      const j = tabla.encabezados.indexOf(c);
      if (j >= 0) tabla.hoja.getRange(fila, j + 1).insertCheckboxes();
    });

    reescribirDe_(HOJA.HORARIOS, id, horarios.map(function (h) {
      return { instancia: id, fecha: h.fecha, desde: h.desde, hasta: h.hasta };
    }));
    reescribirDe_(HOJA.JURADOS, id, (m.jurados || []).filter(function (j) { return esCorreo_(String(j.correo || '').trim()); }).map(function (j) {
      return { instancia: id, nombre: limpiarTexto_(j.nombre, 120), correo: String(j.correo).trim().toLowerCase(), institucion: limpiarTexto_(j.institucion, 120) };
    }));
    reescribirDe_(HOJA.AUTORIZADOS, id, (m.autorizados || []).filter(function (a) { return esCorreo_(String(a.correo || '').trim()); }).map(function (a) {
      return { instancia: id, correo: String(a.correo).trim().toLowerCase(), nombre: limpiarTexto_(a.nombre, 120) };
    }));
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }
  return adminInstancia_(id);
}

function adminActivar_(id, activa) {
  const tabla = leerTabla_(HOJA.INSTANCIAS);
  const f = tabla.filas.filter(function (r) { return mismaInstancia_(r.id, id); })[0];
  if (!f) throw new Error('No encontré esa agenda.');
  escribirCelda_(tabla, f._fila, 'activa', activa);
  return { id: f.id, activa: activa };
}

function adminReservas_(id) {
  const inst = cargarInstancia_(id);
  if (!inst) throw new Error('No encontré esa agenda.');
  const asign = asignaciones_(inst.id);
  const filas = leerTabla_(HOJA.RESERVAS).filas.filter(function (f) { return mismaInstancia_(f.instancia, inst.id); })
    .map(function (f) {
      const clave = normBloque_(f.bloque);
      const e = clave ? etiquetaFecha_(clave.slice(0, 10)) : { corta: '', larga: '' };
      return {
        clave: clave, fecha: e.larga, corta: e.corta, hora: clave.slice(11), termino: f.termino,
        nombre: f.nombre, correo: f.correo, respuestas: f.respuestas, estado: f.estado || '',
        token: f.token || '', creada: f.creada, link: f.link_reunion || '',
        jurados: (asign[clave] || []).map(function (j) { return j.nombre; }),
      };
    })
    .sort(function (a, b) { return a.clave < b.clave ? -1 : (a.clave > b.clave ? 1 : 0); });
  return { titulo: inst.titulo, filas: filas, planilla: libro_().getUrl() };
}

/** Guarda un logo subido desde el creador en una carpeta de Drive y devuelve un link público. */
function adminSubirLogo_(nombre, tipo, base64) {
  if (!/^image\/(png|jpeg|webp|gif)$/.test(String(tipo))) throw new Error('El logo debe ser PNG, JPG, WEBP o GIF.');
  const bytes = Utilities.base64Decode(String(base64 || ''));
  if (!bytes.length || bytes.length > 4 * 1024 * 1024) throw new Error('El logo debe pesar menos de 4 MB.');
  const archivo = carpetaLogos_().createFile(Utilities.newBlob(bytes, tipo, limpiarTexto_(nombre, 80) || 'logo.png'));
  archivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return { url: 'https://lh3.googleusercontent.com/d/' + archivo.getId() };
}

function carpetaLogos_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('CARPETA_LOGOS');
  if (id) {
    try { return DriveApp.getFolderById(id); } catch (err) { /* se borró: se crea otra */ }
  }
  const carpeta = DriveApp.createFolder('Agenda P!ensa · logos');
  props.setProperty('CARPETA_LOGOS', carpeta.getId());
  return carpeta;
}

function serializarCampos_(campos) {
  const limpio = function (s) { return limpiarTexto_(s, 120).replace(/[;:|*]/g, ' ').replace(/\s+/g, ' ').trim(); };
  return (campos || []).map(function (c) {
    const etiqueta = limpio(c.etiqueta);
    if (!etiqueta) return '';
    const opciones = (c.opciones || []).map(limpio).filter(Boolean);
    return etiqueta + (c.requerido ? '*' : '') + (opciones.length ? ': ' + opciones.join('|') : '');
  }).filter(Boolean).join('; ');
}

/** Reemplaza las filas de una instancia en una hoja (Horarios, Jurados, Autorizados). */
function reescribirDe_(nombreHoja, id, nuevas) {
  asegurarColumnas_(nombreHoja);
  const tabla = leerTabla_(nombreHoja);
  const quedan = tabla.filas.filter(function (r) { return !mismaInstancia_(r.instancia, id); });
  const filas = quedan.concat(nuevas).map(function (o) {
    return tabla.encabezados.map(function (h) { return o[h] !== undefined ? o[h] : ''; });
  });
  const hoja = tabla.hoja;
  const ultima = hoja.getLastRow();
  const ancho = tabla.encabezados.length;
  if (ultima > 1) hoja.getRange(2, 1, ultima - 1, ancho).clearContent();
  (COLUMNAS_TEXTO[nombreHoja] || []).forEach(function (c) {
    const j = tabla.encabezados.indexOf(c);
    if (j >= 0) hoja.getRange(2, j + 1, Math.max(filas.length, 1), 1).setNumberFormat('@');
  });
  if (filas.length) hoja.getRange(2, 1, filas.length, ancho).setValues(filas);
}

/** Agrega al final las columnas que falten (por ejemplo, después de actualizar el código). */
function asegurarColumnas_(nombreHoja) {
  const hoja = libro_().getSheetByName(nombreHoja);
  if (!hoja) throw new Error('Falta la hoja "' + nombreHoja + '". En la planilla usa "Agenda P!ensa → Crear o reparar hojas".');
  const actuales = encabezados_(hoja);
  let col = actuales.length;
  COLUMNAS[nombreHoja].forEach(function (c) {
    if (actuales.indexOf(c) === -1) {
      col++;
      hoja.getRange(1, col).setValue(c).setFontWeight('bold').setBackground('#1d2b4f').setFontColor('#ffffff');
      const nota = (NOTAS[nombreHoja] || {})[c];
      if (nota) hoja.getRange(1, col).setNote(nota);
      actuales.push(c);
    }
  });
}

function limpiarTexto_(v, max, multilinea) {
  let s = String(v === undefined || v === null ? '' : v);
  s = multilinea ? s.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n') : s.replace(/[\r\n\t]+/g, ' ');
  return s.trim().slice(0, max || 200);
}

/** Muestra el link del creador con su clave. */
function menuCreador() {
  soloDesdePlanilla_();
  const clave = claveAdmin_();
  const sitio = PropertiesService.getScriptProperties().getProperty('URL_SITIO') || SITIO_POR_DEFECTO;
  const link = sitio + 'admin.html#k=' + clave;
  const html = '<div style="font-family:Arial,sans-serif;font-size:14px;color:#222">' +
    '<p>Abre el creador con este link. Guárdalo solo para ti: con él se puede editar todo.</p>' +
    '<p><a href="' + esc_(link) + '" target="_blank" style="font-size:15px">Abrir el creador</a></p>' +
    '<p style="color:#666;font-size:12px">Clave: <code>' + esc_(clave) + '</code><br>Sitio: ' + esc_(sitio) + '</p></div>';
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(460).setHeight(200), 'Creador de agendas');
}

/** Ejecútala una vez desde el editor después de actualizar el código, para aprobar los permisos nuevos (Drive). */
function autorizar() {
  DriveApp.getRootFolder();
  claveAdmin_();
  console.log('Permisos listos. Clave de administración: ' + claveAdmin_());
}

/* =========================================================================
 * MENÚ DE LA PLANILLA
 * ========================================================================= */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Agenda P!ensa')
    .addItem('Abrir el creador', 'menuCreador')
    .addItem('Ver links y cupos', 'menuVerLinks')
    .addItem('Sincronizar jurados con Calendar', 'menuSincronizarJurados')
    .addSeparator()
    .addItem('Crear o reparar hojas', 'configurarPlanilla')
    .addItem('Guardar URL de la app publicada', 'menuGuardarUrl')
    .addItem('Activar recordatorios automáticos', 'menuActivarRecordatorios')
    .addToUi();
}

/** Crea las hojas con sus columnas y carga el ejemplo de JLP 2026 si la planilla está vacía. */
function configurarPlanilla() {
  soloDesdePlanilla_();
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  PropertiesService.getScriptProperties().setProperty('LIBRO_ID', libro.getId());
  libro.setSpreadsheetTimeZone(ZONA);

  Object.keys(COLUMNAS).forEach(function (nombre) { prepararHoja_(libro, nombre); });

  const hojaInst = libro.getSheetByName(HOJA.INSTANCIAS);
  const vacia = leerTabla_(HOJA.INSTANCIAS).filas.filter(function (f) { return f.id; }).length === 0;
  if (vacia) cargarEjemploJLP_(libro);

  // Casillas en las filas con datos
  const enc = encabezados_(hojaInst);
  const ultima = Math.max(hojaInst.getLastRow(), 2);
  CASILLAS.forEach(function (c) {
    const j = enc.indexOf(c);
    if (j >= 0) hojaInst.getRange(2, j + 1, ultima - 1, 1).insertCheckboxes();
  });

  ['Hoja 1', 'Hoja1', 'Sheet1'].forEach(function (n) {
    const h = libro.getSheetByName(n);
    if (h && h.getLastRow() === 0 && libro.getSheets().length > 1) libro.deleteSheet(h);
  });
  libro.setActiveSheet(hojaInst);

  SpreadsheetApp.getUi().alert('Agenda P!ensa',
    'Listo. Las hojas están creadas' + (vacia ? ' y quedó cargada la instancia de ejemplo "jlp2026" con los horarios de las entrevistas.' : '.') +
    '\n\nSiguiente paso: publica la app (Implementar → Nueva implementación → App web) y luego usa "Agenda P!ensa → Ver links y cupos".',
    SpreadsheetApp.getUi().ButtonSet.OK);
}

function menuVerLinks() {
  soloDesdePlanilla_();
  const ui = SpreadsheetApp.getUi();
  const url = urlPublica_();
  const instancias = leerTabla_(HOJA.INSTANCIAS).filas.filter(function (f) { return f.id; });
  let html = '<style>body{font-family:Arial,sans-serif;font-size:13px;color:#222}' +
    '.i{border:1px solid #ddd;border-radius:8px;padding:10px 12px;margin:0 0 10px}' +
    'h3{margin:0 0 4px;font-size:15px}.m{color:#666;margin-bottom:6px}' +
    'input{width:100%;font-size:12px;padding:5px;margin:2px 0 6px;box-sizing:border-box}' +
    '.w{background:#fff4e5;border:1px solid #f0c27b;padding:8px 10px;border-radius:6px;margin-bottom:10px}</style>';
  if (!url) {
    html += '<div class="w">Todavía no hay URL de la app. Publícala (Implementar → Nueva implementación → App web) y luego usa "Guardar URL de la app publicada".</div>';
  } else if (/\/dev$/.test(url)) {
    html += '<div class="w">Esta URL termina en /dev y solo funciona para ti. Usa "Guardar URL de la app publicada" con la URL que termina en /exec.</div>';
  }
  instancias.forEach(function (f) {
    const inst = normalizarInstancia_(f);
    let libres = 0, agendadas = 0, total = 0, error = '';
    try {
      const disp = disponibilidad_(inst);
      disp.bloques.forEach(function (b) {
        total++;
        if (b.reservado) agendadas++;
        if (b.libre) libres++;
      });
    } catch (err) { error = mensajeError_(err); }
    html += '<div class="i"><h3>' + esc_(inst.titulo) + '</h3>' +
      '<div class="m">' + esc_(inst.id) + ' · ' + (inst.activa ? 'Abierta' : 'Cerrada') + ' · ' +
      (error ? 'Error: ' + esc_(error) : agendadas + ' agendadas, ' + libres + ' libres, ' + total + ' en total') + '</div>';
    if (url) {
      html += 'Link para reservar:<input readonly onclick="this.select()" value="' + esc_(url + '?e=' + encodeURIComponent(inst.id)) + '">';
      if (inst.claveJurado) {
        html += 'Panel de jurado:<input readonly onclick="this.select()" value="' +
          esc_(url + '?e=' + encodeURIComponent(inst.id) + '&modo=jurado&k=' + encodeURIComponent(inst.claveJurado)) + '">';
      } else {
        html += '<div class="m">Panel de jurado desactivado (sin clave_jurado).</div>';
      }
    }
    html += '</div>';
  });
  if (!instancias.length) html += '<p>No hay instancias. Usa "Crear o reparar hojas".</p>';
  ui.showModalDialog(HtmlService.createHtmlOutput(html).setWidth(640).setHeight(480), 'Links y cupos');
}

function menuGuardarUrl() {
  soloDesdePlanilla_();
  const ui = SpreadsheetApp.getUi();
  const r = ui.prompt('URL de la app publicada',
    'Pega la URL de la app web (Implementar → Gestionar implementaciones). Termina en /exec.',
    ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  const url = limpiarUrl_(r.getResponseText());
  if (!/^https:\/\/script\.google\.com\/.+\/exec$/.test(url)) {
    ui.alert('Esa URL no parece de una app publicada (debe empezar con https://script.google.com/ y terminar en /exec).');
    return;
  }
  PropertiesService.getScriptProperties().setProperty('URL_APP', url);
  ui.alert('URL guardada.');
}

function menuSincronizarJurados() {
  soloDesdePlanilla_();
  const ui = SpreadsheetApp.getUi();
  let agregados = 0, revisadas = 0;
  const problemas = [];
  const asignTabla = leerTabla_(HOJA.ASIGNACIONES);
  leerTabla_(HOJA.INSTANCIAS).filas.filter(function (f) { return f.id; }).forEach(function (f) {
    const inst = normalizarInstancia_(f);
    const asign = asignaciones_(inst.id, asignTabla);
    reservasDe_(inst.id).lista.forEach(function (r) {
      if (!r.evento_id) return;
      revisadas++;
      const deseados = inst.invitadosFijos.map(function (c) { return { email: c }; })
        .concat((asign[r.bloque] || []).map(function (j) { return { email: j.correo, displayName: j.nombre }; }));
      if (!deseados.length) return;
      try { agregados += agregarAsistentes_(inst, r.evento_id, deseados); }
      catch (err) { problemas.push(r.bloque + ' (' + r.nombre + '): ' + mensajeError_(err)); }
    });
  });
  ui.alert('Sincronización lista',
    'Revisé ' + revisadas + ' citas y agregué ' + agregados + ' invitación(es).' +
    (problemas.length ? '\n\nProblemas:\n' + problemas.join('\n') : '') +
    '\n\nNota: la sincronización solo agrega. Para sacar a alguien usa el panel de jurado o quítalo directo en Calendar.',
    ui.ButtonSet.OK);
}

function menuActivarRecordatorios() {
  soloDesdePlanilla_();
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'enviarRecordatorios') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('enviarRecordatorios').timeBased().everyHours(1).create();
  SpreadsheetApp.getUi().alert('Listo: cada hora se revisan las citas y se envían los recordatorios según la columna recordatorio_horas.');
}

/** Se ejecuta cada hora (activador). Envía recordatorios por correo. */
function enviarRecordatorios() {
  const ahora = ahora_().getTime();
  const cache = {};
  const tabla = leerTabla_(HOJA.RESERVAS);
  tabla.filas.forEach(function (f) {
    if (!/confirmada/i.test(f.estado) || f.recordatorio || !esCorreo_(f.correo)) return;
    const id = String(f.instancia).toLowerCase();
    if (!(id in cache)) cache[id] = cargarInstancia_(f.instancia);
    const inst = cache[id];
    if (!inst || !inst.recordatorioHoras) return;
    const clave = normBloque_(f.bloque);
    if (!clave) return;
    const inicio = fechaHora_(clave).getTime();
    if (ahora >= inicio - inst.recordatorioHoras * 3600000 && ahora < inicio) {
      intentar_(function () {
        enviarRecordatorio_(inst, { nombre: f.nombre, correo: f.correo, clave: clave, hora: clave.slice(11), termino: f.termino, link: f.link_reunion, token: f.token });
        escribirCelda_(tabla, f._fila, 'recordatorio', new Date());
      });
    }
  });
}

/* =========================================================================
 * LÓGICA DE CUPOS
 * ========================================================================= */

/** Genera los bloques de una instancia y marca cuáles están libres. */
function disponibilidad_(inst) {
  const ventanas = leerTabla_(HOJA.HORARIOS).filas
    .filter(function (r) { return mismaInstancia_(r.instancia, inst.id); })
    .map(function (r) { return { fecha: normFecha_(r.fecha), desde: normHora_(r.desde), hasta: normHora_(r.hasta) }; })
    .filter(function (v) { return v.fecha && v.desde && v.hasta && aMinutos_(v.hasta) > aMinutos_(v.desde); })
    .sort(function (a, b) { return (a.fecha + a.desde) < (b.fecha + b.desde) ? -1 : 1; });

  const paso = Math.max(5, inst.duracion + inst.pausa);
  const bloques = [];
  ventanas.forEach(function (v, i) {
    const fin = aMinutos_(v.hasta);
    for (let ini = aMinutos_(v.desde); ini + inst.duracion <= fin; ini += paso) {
      const clave = v.fecha + ' ' + deMinutos_(ini);
      if (bloques.some(function (b) { return b.clave === clave; })) continue; // ventanas superpuestas
      bloques.push({ clave: clave, fecha: v.fecha, hora: deMinutos_(ini), termino: deMinutos_(ini + inst.duracion), ventana: i });
    }
  });

  const res = reservasDe_(inst.id);
  const limite = ahora_().getTime() + inst.avisoMinimoHoras * 3600000;
  let ocupados = [];
  if (inst.respetarOcupado && bloques.length) {
    try { ocupados = ocupadoCalendario_(inst, bloques); }
    catch (err) { console.warn('No se pudo revisar el calendario: ' + err); }
  }
  bloques.forEach(function (b) {
    b.inicioMs = fechaHora_(b.clave).getTime();
    const finMs = b.inicioMs + inst.duracion * 60000;
    b.reservado = !!res.mapa[b.clave];
    b.pasado = b.inicioMs < limite;
    b.ocupado = !b.reservado && ocupados.some(function (o) { return o.ini < finMs && o.fin > b.inicioMs; });
    b.libre = !b.reservado && !b.pasado && !b.ocupado;
  });
  return { ventanas: ventanas, bloques: bloques, reservas: res.mapa, lista: res.lista };
}

function agruparPorDia_(disp, mapa) {
  const dias = [];
  disp.ventanas.forEach(function (v, i) {
    let dia = dias[dias.length - 1];
    if (!dia || dia.fecha !== v.fecha) {
      const e = etiquetaFecha_(v.fecha);
      dia = { fecha: v.fecha, etiqueta: e.larga, corta: e.corta, ventanas: [] };
      dias.push(dia);
    }
    dia.ventanas.push({
      etiqueta: etiquetaVentana_(v),
      bloques: disp.bloques.filter(function (b) { return b.ventana === i; }).map(mapa),
    });
  });
  return dias;
}

/** Reservas que ocupan horario (todo lo que no esté cancelado). */
function reservasDe_(instId, tabla) {
  tabla = tabla || leerTabla_(HOJA.RESERVAS);
  const mapa = {}, lista = [];
  tabla.filas.forEach(function (f) {
    if (!mismaInstancia_(f.instancia, instId) || /cancel/i.test(f.estado)) return;
    const clave = normBloque_(f.bloque);
    if (!clave) return;
    const r = {
      fila: f._fila, bloque: clave, nombre: f.nombre, correo: String(f.correo || '').trim().toLowerCase(),
      respuestas: f.respuestas, evento_id: f.evento_id, link_reunion: f.link_reunion, estado: f.estado,
    };
    mapa[clave] = r;
    if (r.correo) lista.push(r);
  });
  return { mapa: mapa, lista: lista };
}

/** Jurados asignados por bloque: { '2026-11-18 10:30': [{nombre, correo}] } */
function asignaciones_(instId, tabla) {
  tabla = tabla || leerTabla_(HOJA.ASIGNACIONES);
  const mapa = {};
  tabla.filas.forEach(function (f) {
    if (!mismaInstancia_(f.instancia, instId)) return;
    const clave = normBloque_(f.bloque);
    const correo = String(f.correo || '').trim().toLowerCase();
    if (!clave || !esCorreo_(correo)) return;
    const lista = mapa[clave] || (mapa[clave] = []);
    if (!lista.some(function (j) { return j.correo === correo; })) lista.push({ nombre: f.nombre || correo, correo: correo });
  });
  return mapa;
}

function ocupadoCalendario_(inst, bloques) {
  const min = Math.min.apply(null, bloques.map(function (b) { return fechaHora_(b.clave).getTime(); }));
  const max = Math.max.apply(null, bloques.map(function (b) { return fechaHora_(b.clave).getTime(); })) + inst.duracion * 60000;
  const resp = Calendar.Freebusy.query({
    timeMin: new Date(min).toISOString(),
    timeMax: new Date(max).toISOString(),
    timeZone: ZONA,
    items: [{ id: inst.calendario }],
  });
  const cal = resp.calendars && (resp.calendars[inst.calendario] || resp.calendars[Object.keys(resp.calendars)[0]]);
  return ((cal && cal.busy) || []).map(function (o) {
    return { ini: new Date(o.start).getTime(), fin: new Date(o.end).getTime() };
  });
}

/* =========================================================================
 * CALENDAR
 * ========================================================================= */

function crearEvento_(inst, r) {
  const tipo = tipoModalidad_(inst);
  const lineas = [
    inst.titulo,
    '',
    'Persona: ' + r.nombre + ' (' + r.correo + ')',
  ];
  r.respuestas.forEach(function (x) { if (x.valor && !x.privado) lineas.push(x.etiqueta + ': ' + x.valor); });
  lineas.push('', 'Modalidad: ' + inst.modalidad + (tipo !== 'meet' && inst.lugar ? ' · ' + inst.lugar : ''));
  lineas.push('', 'Agendado con Agenda P!ensa.');

  const recurso = {
    summary: inst.titulo + ' · ' + r.nombre,
    description: lineas.join('\n'),
    start: { dateTime: r.inicio.toISOString(), timeZone: ZONA },
    end: { dateTime: r.fin.toISOString(), timeZone: ZONA },
    attendees: r.invitados,
    guestsCanInviteOthers: false,
    guestsCanSeeOtherGuests: inst.mostrarInvitados,
    extendedProperties: { private: { agendaPiensa: inst.id, bloque: r.clave } },
  };
  if (tipo !== 'meet' && inst.lugar) recurso.location = inst.lugar;
  if (tipo === 'meet') {
    recurso.conferenceData = {
      createRequest: { requestId: Utilities.getUuid(), conferenceSolutionKey: { type: 'hangoutsMeet' } },
    };
  }
  let ev = Calendar.Events.insert(recurso, inst.calendario, { conferenceDataVersion: 1, sendUpdates: 'all' });
  if (tipo === 'meet' && !ev.hangoutLink) {
    Utilities.sleep(1500);
    ev = Calendar.Events.get(inst.calendario, ev.id);
  }
  let link = ev.hangoutLink || '';
  if (!link && tipo === 'link' && /^https?:\/\//i.test(inst.lugar)) link = inst.lugar;
  return { id: ev.id, link: link };
}

/** Agrega invitados a un evento (sin duplicar). Devuelve cuántos agregó. */
function agregarAsistentes_(inst, eventoId, nuevos) {
  const ev = Calendar.Events.get(inst.calendario, eventoId);
  if (ev.status === 'cancelled') return 0;
  const actuales = ev.attendees || [];
  const ya = {};
  actuales.forEach(function (a) { ya[String(a.email || '').toLowerCase()] = true; });
  const sumar = unirInvitados_(nuevos).filter(function (n) { return !ya[n.email.toLowerCase()]; });
  if (!sumar.length) return 0;
  Calendar.Events.patch({ attendees: actuales.concat(sumar) }, inst.calendario, eventoId, { sendUpdates: 'all' });
  return sumar.length;
}

function quitarAsistente_(inst, eventoId, correo) {
  const ev = Calendar.Events.get(inst.calendario, eventoId);
  if (ev.status === 'cancelled') return;
  const actuales = ev.attendees || [];
  const quedan = actuales.filter(function (a) { return String(a.email || '').toLowerCase() !== correo; });
  if (quedan.length === actuales.length) return;
  Calendar.Events.patch({ attendees: quedan }, inst.calendario, eventoId, { sendUpdates: 'all' });
}

function unirInvitados_(lista) {
  const vistos = {};
  return lista.filter(function (a) {
    const k = String(a.email || '').trim().toLowerCase();
    if (!esCorreo_(k) || vistos[k]) return false;
    vistos[k] = true;
    a.email = k;
    return true;
  });
}

/* =========================================================================
 * CORREOS
 * ========================================================================= */

function enviarConfirmacion_(inst, r) {
  const e = etiquetaFecha_(r.clave.slice(0, 10));
  const tipo = tipoModalidad_(inst);
  let donde = '';
  if (tipo === 'meet') donde = r.link ? '<a href="' + esc_(r.link) + '">' + esc_(r.link) + '</a>' : 'Google Meet (el link está en la invitación de Calendar)';
  else if (tipo === 'link') donde = r.link ? '<a href="' + esc_(r.link) + '">' + esc_(r.link) + '</a>' : esc_(inst.modalidad);
  else donde = esc_(inst.lugar || 'Presencial');

  const urlCancelar = urlPublica_() ? urlPublica_() + '?cancelar=' + r.token : '';
  let cuerpo = '<p style="margin:0 0 14px">Hola ' + esc_(primerNombre_(r.nombre)) + ',</p>' +
    '<p style="margin:0 0 18px">Tu horario quedó agendado. Te llegará también una invitación de Google Calendar a este correo.</p>' +
    cajaDetalle_(inst, [
      ['Fecha', e.larga],
      ['Hora', r.hora + ' a ' + r.termino + ' hrs. (hora de Chile)'],
      [tipo === 'presencial' ? 'Lugar' : 'Dónde', donde, true],
    ]);
  if (inst.mensaje) cuerpo += '<p style="margin:18px 0 0">' + esc_(inst.mensaje).replace(/\n/g, '<br>') + '</p>';
  if (urlCancelar) {
    cuerpo += '<p style="margin:22px 0 0;font-size:13px;color:#555">¿No puedes asistir? Libera tu horario para que otra persona lo use y vuelve a agendar: ' +
      '<a href="' + esc_(urlCancelar) + '" style="color:' + inst.color1 + '">cancelar o cambiar mi horario</a>.</p>';
  }
  enviarCorreo_(inst, r.correo, 'Confirmado: ' + inst.titulo + ' · ' + e.corta + ' ' + r.hora, plantillaCorreo_(inst, '¡Listo, tu horario quedó agendado!', cuerpo));
}

function enviarRecordatorio_(inst, r) {
  const e = etiquetaFecha_(r.clave.slice(0, 10));
  const tipo = tipoModalidad_(inst);
  const donde = r.link ? '<a href="' + esc_(r.link) + '">' + esc_(r.link) + '</a>' : esc_(inst.lugar || inst.modalidad);
  let cuerpo = '<p style="margin:0 0 14px">Hola ' + esc_(primerNombre_(r.nombre)) + ',</p>' +
    '<p style="margin:0 0 18px">Te recordamos tu cita:</p>' +
    cajaDetalle_(inst, [
      ['Fecha', e.larga],
      ['Hora', r.hora + ' a ' + r.termino + ' hrs. (hora de Chile)'],
      [tipo === 'presencial' ? 'Lugar' : 'Dónde', donde, true],
    ]);
  if (inst.mensaje) cuerpo += '<p style="margin:18px 0 0">' + esc_(inst.mensaje).replace(/\n/g, '<br>') + '</p>';
  const urlCancelar = urlPublica_() && r.token ? urlPublica_() + '?cancelar=' + r.token : '';
  if (urlCancelar) {
    cuerpo += '<p style="margin:22px 0 0;font-size:13px;color:#555">Si ya no puedes asistir, por favor <a href="' + esc_(urlCancelar) +
      '" style="color:' + inst.color1 + '">libera tu horario</a>.</p>';
  }
  enviarCorreo_(inst, r.correo, 'Recordatorio: ' + inst.titulo + ' · ' + e.corta + ' ' + r.hora, plantillaCorreo_(inst, 'Te esperamos', cuerpo));
}

function avisarEquipo_(inst, r, tipo) {
  if (!inst.avisoA.length) return;
  const e = etiquetaFecha_(r.clave.slice(0, 10));
  const filas = [['Persona', esc_(r.nombre) + ' &lt;' + esc_(r.correo) + '&gt;', true], ['Fecha', e.larga], ['Hora', r.hora + ' a ' + r.termino]];
  (r.respuestas || []).forEach(function (x) { if (x.valor) filas.push([x.etiqueta, x.valor]); });
  const titulo = tipo === 'nueva' ? 'Nueva reserva' : 'Reserva cancelada';
  const cuerpo = cajaDetalle_(inst, filas) +
    '<p style="margin:18px 0 0;font-size:13px"><a href="' + esc_(libro_().getUrl()) + '">Abrir la planilla</a></p>';
  enviarCorreo_(inst, inst.avisoA.join(','), titulo + ': ' + r.nombre + ' · ' + e.corta + ' ' + r.hora, plantillaCorreo_(inst, titulo, cuerpo));
}

function enviarCorreo_(inst, para, asunto, html) {
  if (MailApp.getRemainingDailyQuota() < 1) {
    console.warn('Sin cuota de correo para hoy; no se envió: ' + asunto);
    return;
  }
  const opciones = { to: para, subject: asunto, htmlBody: html, name: REMITENTE };
  if (inst.responderA) opciones.replyTo = inst.responderA;
  MailApp.sendEmail(opciones);
}

function plantillaCorreo_(inst, titulo, cuerpo) {
  const logos = inst.logosCorreo.map(function (u) {
    return '<img src="' + esc_(u) + '" alt="" height="40" style="height:40px;max-width:160px;margin:0 10px;vertical-align:middle">';
  }).join('');
  return '<div style="background:#f3f4f6;padding:24px 12px;font-family:Arial,Helvetica,sans-serif;color:#1f2933">' +
    '<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">' +
    (logos ? '<div style="padding:18px 20px;text-align:center;background:' + (inst.logosFondo === 'color' ? inst.color1 : '#ffffff') + '">' + logos + '</div>' : '') +
    '<div style="background:' + inst.color1 + ';color:' + textoSobre_(inst.color1) + ';padding:20px 24px">' +
    (inst.subtitulo ? '<div style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;opacity:.85">' + esc_(inst.subtitulo) + '</div>' : '') +
    '<div style="font-size:20px;font-weight:bold;margin-top:4px">' + esc_(titulo) + '</div></div>' +
    '<div style="padding:22px 24px;font-size:15px;line-height:1.5">' + cuerpo + '</div>' +
    '<div style="padding:14px 24px;border-top:1px solid #eee;font-size:12px;color:#777">' + esc_(inst.titulo) + ' · ' + REMITENTE + '</div>' +
    '</div></div>';
}

function cajaDetalle_(inst, filas) {
  return '<table style="width:100%;border-collapse:collapse;border-left:4px solid ' + inst.color2 + ';background:#f8f9fb">' +
    filas.map(function (f) {
      return '<tr><td style="padding:8px 12px;color:#666;font-size:13px;width:90px;vertical-align:top">' + esc_(f[0]) + '</td>' +
        '<td style="padding:8px 12px;font-weight:bold">' + (f[2] ? f[1] : esc_(f[1])) + '</td></tr>';
    }).join('') + '</table>';
}

/* =========================================================================
 * INSTANCIAS
 * ========================================================================= */

function cargarInstancia_(id) {
  const buscado = String(id || '').trim().toLowerCase();
  if (!buscado) return null;
  const f = leerTabla_(HOJA.INSTANCIAS).filas.filter(function (r) { return String(r.id).trim().toLowerCase() === buscado; })[0];
  return f ? normalizarInstancia_(f) : null;
}

function normalizarInstancia_(f) {
  const logos = [f.logo_piensa, f.logo_programa, f.logo_aliado].map(urlImagen_).filter(Boolean);
  return {
    id: String(f.id).trim(),
    activa: esSi_(f.activa),
    titulo: f.titulo || 'Agenda P!ensa',
    subtitulo: f.subtitulo || '',
    descripcion: f.descripcion || '',
    duracion: Math.max(5, num_(f.duracion_min, 30)),
    pausa: Math.max(0, num_(f.pausa_min, 0)),
    modalidad: f.modalidad || 'Google Meet',
    lugar: f.lugar_o_link || '',
    color1: color_(f.color_principal, '#1d2b4f'),
    color2: color_(f.color_acento, '#e5533d'),
    logos: logos,
    logosFondo: /color/i.test(String(f.logos_fondo || '')) ? 'color' : 'blanco',
    logosCorreo: logos.filter(function (u) { return !/\.svg(\?|$)/i.test(u); }),
    calendario: String(f.calendario || '').trim() || 'primary',
    responderA: esCorreo_(String(f.responder_a || '').trim()) ? String(f.responder_a).trim() : '',
    avisoA: correos_(f.aviso_a),
    invitadosFijos: correos_(f.invitados_fijos),
    claveJurado: String(f.clave_jurado || '').trim(),
    maxJurados: Math.max(0, num_(f.max_jurados, 0)),
    campos: parsearCampos_(f.campos_extra),
    unaPorCorreo: String(f.una_por_correo || '').trim() === '' ? true : esSi_(f.una_por_correo),
    avisoMinimoHoras: Math.max(0, num_(f.aviso_minimo_horas, 0)),
    respetarOcupado: esSi_(f.respetar_ocupado),
    mostrarInvitados: esSi_(f.mostrar_invitados),
    recordatorioHoras: Math.max(0, num_(f.recordatorio_horas, 0)),
    mensaje: f.mensaje_confirmacion || '',
  };
}

/** Lo que se puede mostrar en la página pública. */
function publico_(inst) {
  const tipo = tipoModalidad_(inst);
  return {
    id: inst.id, titulo: inst.titulo, subtitulo: inst.subtitulo, descripcion: inst.descripcion,
    duracion: inst.duracion, modalidad: inst.modalidad, tipo: tipo,
    lugar: tipo === 'presencial' ? inst.lugar : '',
    color1: inst.color1, color2: inst.color2, texto1: textoSobre_(inst.color1), texto2: textoSobre_(inst.color2),
    logos: inst.logos, logosFondo: inst.logosFondo, contacto: inst.responderA,
    campos: inst.campos.map(function (c) { return { id: c.id, etiqueta: c.etiqueta, requerido: c.requerido, opciones: c.opciones }; }),
  };
}

function marcaPorDefecto_(id) {
  try {
    const inst = id ? cargarInstancia_(id) : null;
    if (inst) return publico_(inst);
  } catch (err) { /* sin planilla */ }
  return {
    titulo: 'Agenda P!ensa', subtitulo: 'Fundación P!ensa', descripcion: '', color1: '#1d2b4f', color2: '#e5533d',
    texto1: '#ffffff', texto2: '#ffffff', logos: [LOGO_PIENSA], campos: [],
  };
}

function validarClave_(inst, clave) {
  if (!inst.claveJurado) throw new Error('El panel de jurado no está activado para esta agenda.');
  if (String(clave || '').trim() !== inst.claveJurado) throw new Error('El link del panel de jurado no es válido. Pide el link actualizado a la organización.');
}

function parsearCampos_(texto) {
  return String(texto || '').split(/;|\n/).map(function (s) { return s.trim(); }).filter(Boolean).map(function (s, i) {
    const k = s.indexOf(':');
    let etiqueta = (k >= 0 ? s.slice(0, k) : s).trim();
    const opciones = k >= 0 ? s.slice(k + 1).split('|').map(function (o) { return o.trim(); }).filter(Boolean) : [];
    const requerido = /\*$/.test(etiqueta);
    etiqueta = etiqueta.replace(/\*+$/, '').trim();
    return { id: 'c' + i, etiqueta: etiqueta, requerido: requerido, opciones: opciones, privado: esCampoPrivado_(etiqueta) };
  });
}

function esCampoPrivado_(etiqueta) {
  return /tel[eé]f|fono|whats|celular|m[oó]vil|correo|mail|rut|direcci/i.test(etiqueta);
}

function respuestasPublicas_(texto) {
  return String(texto || '').split(' | ').map(function (s) { return s.trim(); }).filter(function (s) {
    const k = s.indexOf(':');
    return s && k > 0 && !esCampoPrivado_(s.slice(0, k));
  });
}

function cargarEjemploJLP_(libro) {
  const instancias = leerTabla_(HOJA.INSTANCIAS);
  agregarFila_(instancias, {
    id: 'jlp2026',
    activa: true,
    titulo: 'Entrevistas Jóvenes Líderes P!ensa 2026',
    subtitulo: 'Concurso Jóvenes Líderes P!ensa · Etapa de entrevistas',
    descripcion: 'Elige el horario que más te acomode para tu entrevista de 20 minutos con el jurado del concurso. Al confirmar te llegará la invitación a tu correo, con el link de la videollamada.',
    duracion_min: 20,
    pausa_min: 0,
    modalidad: 'Google Meet',
    lugar_o_link: '',
    color_principal: '#1d2b4f',
    color_acento: '#e5533d',
    logo_piensa: LOGO_PIENSA,
    logo_programa: 'https://jovenesliderespiensa.cl/wp-content/uploads/2025/04/JJLL-2024-300x99.png',
    logo_aliado: 'https://jovenesliderespiensa.cl/wp-content/uploads/2025/08/logo-mutual-color-2-300x126.png',
    calendario: '',
    responder_a: 'pedro.maiz@fundacionpiensa.cl',
    aviso_a: 'pedro.maiz@fundacionpiensa.cl',
    invitados_fijos: '',
    clave_jurado: 'jurado-' + Utilities.getUuid().slice(0, 6),
    max_jurados: '',
    campos_extra: 'Teléfono (WhatsApp)*; Comuna*; Categoría*: Ciencia|Cultura|Deporte|Educación|Emprendimiento|Innovación|Movimientos sociales|Política|Salud|Voluntariado',
    una_por_correo: true,
    aviso_minimo_horas: 12,
    respetar_ocupado: false,
    mostrar_invitados: false,
    recordatorio_horas: 24,
    mensaje_confirmacion: 'Te recomendamos conectarte 5 minutos antes, desde un lugar tranquilo y con buena conexión.',
  });
  const horarios = leerTabla_(HOJA.HORARIOS);
  [
    ['2026-11-18', '10:30', '13:30'], ['2026-11-18', '14:00', '16:00'],
    ['2026-11-19', '10:30', '13:30'], ['2026-11-19', '14:00', '16:00'],
    ['2026-11-20', '10:00', '12:30'],
  ].forEach(function (h) {
    agregarFila_(horarios, { instancia: 'jlp2026', fecha: h[0], desde: h[1], hasta: h[2] });
  });
}

/* =========================================================================
 * PLANILLA (utilidades)
 * ========================================================================= */

function libro_() {
  const id = PropertiesService.getScriptProperties().getProperty('LIBRO_ID');
  if (id) return SpreadsheetApp.openById(id);
  const activo = SpreadsheetApp.getActiveSpreadsheet();
  if (activo) return activo;
  throw new Error('No encuentro la planilla. Abre la planilla y ejecuta "Agenda P!ensa → Crear o reparar hojas".');
}

function leerTabla_(nombre) {
  const hoja = libro_().getSheetByName(nombre);
  if (!hoja) throw new Error('Falta la hoja "' + nombre + '". En la planilla usa "Agenda P!ensa → Crear o reparar hojas".');
  const valores = hoja.getDataRange().getDisplayValues();
  const encabezados = (valores[0] || []).map(function (h) { return String(h).trim().toLowerCase(); });
  const filas = [];
  for (let i = 1; i < valores.length; i++) {
    const v = valores[i];
    if (v.every(function (x) { return String(x).trim() === ''; })) continue;
    const obj = { _fila: i + 1 };
    encabezados.forEach(function (h, j) { if (h) obj[h] = String(v[j] === undefined ? '' : v[j]).trim(); });
    filas.push(obj);
  }
  return { hoja: hoja, encabezados: encabezados, filas: filas };
}

function encabezados_(hoja) {
  const n = hoja.getLastColumn();
  return n ? hoja.getRange(1, 1, 1, n).getDisplayValues()[0].map(function (h) { return String(h).trim().toLowerCase(); }) : [];
}

/** Agrega una fila después de la última fila con un valor en la primera columna. */
function agregarFila_(tabla, obj) {
  const valores = tabla.encabezados.map(function (h) { return obj[h] !== undefined ? obj[h] : ''; });
  const ultima = tabla.filas.length ? tabla.filas[tabla.filas.length - 1]._fila : 1;
  const fila = ultima + 1;
  tabla.hoja.getRange(fila, 1, 1, valores.length).setValues([valores]);
  const nuevo = { _fila: fila };
  tabla.encabezados.forEach(function (h, j) { nuevo[h] = String(valores[j]); });
  tabla.filas.push(nuevo);
}

function escribirCelda_(tabla, fila, columna, valor) {
  const j = tabla.encabezados.indexOf(columna);
  if (j < 0) throw new Error('Falta la columna "' + columna + '" en la hoja ' + tabla.hoja.getName());
  tabla.hoja.getRange(fila, j + 1).setValue(valor);
}

function prepararHoja_(libro, nombre) {
  const hoja = libro.getSheetByName(nombre) || libro.insertSheet(nombre);
  const actuales = encabezados_(hoja);
  let col = actuales.length;
  COLUMNAS[nombre].forEach(function (c) {
    if (actuales.indexOf(c) === -1) {
      col++;
      hoja.getRange(1, col).setValue(c);
      actuales.push(c);
    }
  });
  const encabezado = hoja.getRange(1, 1, 1, actuales.length);
  encabezado.setFontWeight('bold').setBackground('#1d2b4f').setFontColor('#ffffff');
  hoja.setFrozenRows(1);
  const notas = NOTAS[nombre] || {};
  Object.keys(notas).forEach(function (c) {
    const j = actuales.indexOf(c);
    if (j >= 0) hoja.getRange(1, j + 1).setNote(notas[c]);
  });
  (COLUMNAS_TEXTO[nombre] || []).forEach(function (c) {
    const j = actuales.indexOf(c);
    if (j >= 0) hoja.getRange(2, j + 1, Math.max(hoja.getMaxRows() - 1, 1), 1).setNumberFormat('@');
  });
  if (nombre === HOJA.INSTANCIAS) {
    ['descripcion', 'campos_extra', 'mensaje_confirmacion', 'titulo'].forEach(function (c) {
      const j = actuales.indexOf(c);
      if (j >= 0) hoja.setColumnWidth(j + 1, 280);
    });
  }
  if (nombre === HOJA.RESERVAS) {
    ['respuestas'].forEach(function (c) {
      const j = actuales.indexOf(c);
      if (j >= 0) hoja.setColumnWidth(j + 1, 320);
    });
  }
}

/* =========================================================================
 * UTILIDADES
 * ========================================================================= */

function ahora_() { return new Date(); }

/** Evita que las funciones del menú se llamen desde la app web pública. */
function soloDesdePlanilla_() {
  const activo = Session.getActiveUser().getEmail();
  if (!activo || activo !== Session.getEffectiveUser().getEmail()) {
    throw new Error('Esta acción solo se puede usar desde el menú de la planilla.');
  }
}

function fechaHora_(clave) { return Utilities.parseDate(clave, ZONA, 'yyyy-MM-dd HH:mm'); }

function urlApp_() {
  const guardada = PropertiesService.getScriptProperties().getProperty('URL_APP');
  if (guardada) return limpiarUrl_(guardada);
  try { return limpiarUrl_(ScriptApp.getService().getUrl()); } catch (err) { return ''; }
}

/** Quita parámetros y el índice de cuenta (/u/3/) que agrega el navegador con varias cuentas abiertas. */
function limpiarUrl_(url) {
  return String(url || '').trim().replace(/[?#].*$/, '').replace(/\/u\/\d+(?=\/)/, '');
}

function recordarUrl_() {
  try {
    const props = PropertiesService.getScriptProperties();
    if (props.getProperty('URL_APP')) return;
    const url = limpiarUrl_(ScriptApp.getService().getUrl());
    if (url && /\/exec$/.test(url)) props.setProperty('URL_APP', url);
  } catch (err) { /* nada */ }
}

function buscarPorToken_(token) {
  token = String(token || '').trim();
  if (!/^[a-f0-9]{16,}$/i.test(token)) return null;
  const tabla = leerTabla_(HOJA.RESERVAS);
  const fila = tabla.filas.filter(function (f) { return f.token === token; })[0];
  if (!fila) return null;
  fila.bloque = normBloque_(fila.bloque);
  return { tabla: tabla, fila: fila };
}

function tipoModalidad_(inst) {
  const m = String(inst.modalidad || '').toLowerCase();
  if (m.indexOf('meet') >= 0) return 'meet';
  if (m.indexOf('presencial') >= 0) return 'presencial';
  return 'link';
}

function etiquetaFecha_(fecha) {
  const p = String(fecha).split('-').map(Number);
  const dow = new Date(Date.UTC(p[0], p[1] - 1, p[2])).getUTCDay();
  const dia = DIAS[dow], mes = MESES[p[1] - 1];
  return {
    larga: mayus_(dia) + ' ' + p[2] + ' de ' + mes,
    corta: mayus_(dia.slice(0, 3)) + ' ' + p[2] + ' ' + mes.slice(0, 3),
  };
}

function etiquetaVentana_(v) {
  const h = aMinutos_(v.desde) / 60;
  const parte = h < 13 ? 'Mañana' : (h < 19 ? 'Tarde' : 'Noche');
  return parte + ' · ' + v.desde + ' a ' + v.hasta;
}

function normFecha_(v) {
  const s = String(v || '').trim();
  let m = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return fmtFecha_(m[1], m[2], m[3]);
  m = s.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (m) {
    let d = +m[1], mes = +m[2];
    if (mes > 12 && d <= 12) { const t = d; d = mes; mes = t; } // formato mes/día
    const y = m[3].length === 2 ? '20' + m[3] : m[3];
    return fmtFecha_(y, mes, d);
  }
  return '';
}

function fmtFecha_(y, m, d) {
  m = +m; d = +d;
  if (m < 1 || m > 12 || d < 1 || d > 31) return '';
  return y + '-' + ('0' + m).slice(-2) + '-' + ('0' + d).slice(-2);
}

function normHora_(v) {
  const s = String(v || '').trim().toLowerCase();
  let m = s.match(/(\d{1,2})\s*[:.h]\s*(\d{2})/);
  let h, mi;
  if (m) { h = +m[1]; mi = +m[2]; }
  else if ((m = s.match(/^(\d{1,2})$/))) { h = +m[1]; mi = 0; }
  else return '';
  if (/p\.?\s?m/.test(s) && h < 12) h += 12;
  if (/a\.?\s?m/.test(s) && h === 12) h = 0;
  if (h > 23 || mi > 59) return '';
  return ('0' + h).slice(-2) + ':' + ('0' + mi).slice(-2);
}

/** Normaliza "2026-11-18 10:30", "18/11/2026 10:30:00", etc. a "2026-11-18 10:30". */
function normBloque_(v) {
  const s = String(v || '').trim();
  if (!s) return '';
  const fecha = normFecha_(s);
  const horas = s.match(/\d{1,2}\s*:\s*\d{2}(\s*:\s*\d{2})?(\s*[ap]\.?\s?m\.?)?/gi);
  const hora = horas ? normHora_(horas[horas.length - 1]) : '';
  return fecha && hora ? fecha + ' ' + hora : '';
}

function aMinutos_(hhmm) { const p = hhmm.split(':'); return (+p[0]) * 60 + (+p[1]); }
function deMinutos_(n) { return ('0' + Math.floor(n / 60)).slice(-2) + ':' + ('0' + (n % 60)).slice(-2); }

function mismaInstancia_(a, b) {
  return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
}

function esSi_(v) {
  return /^(s[ií]|true|verdadero|x|1|yes|ok)$/i.test(String(v === undefined ? '' : v).trim());
}

function num_(v, def) {
  const n = parseFloat(String(v === undefined ? '' : v).replace(',', '.'));
  return isNaN(n) ? def : n;
}

function color_(v, def) {
  const s = String(v || '').trim();
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s) ? s : def;
}

/** Elige texto blanco u oscuro según el color de fondo. */
function textoSobre_(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
  const lin = [0, 2, 4].map(function (i) {
    const c = parseInt(h.substr(i, 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  const lum = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
  return lum > 0.45 ? '#16202c' : '#ffffff';
}

function urlImagen_(v) {
  const s = String(v || '').trim();
  if (!s) return '';
  if (/drive\.google\.com|docs\.google\.com/.test(s)) {
    const m = s.match(/(?:\/d\/|[?&]id=)([\w-]{20,})/);
    return m ? 'https://lh3.googleusercontent.com/d/' + m[1] : '';
  }
  if (/^[\w-]{25,}$/.test(s)) return 'https://lh3.googleusercontent.com/d/' + s;
  if (/^https?:\/\//i.test(s)) return s;
  return '';
}

function correos_(v) {
  return String(v || '').split(/[,;\s]+/).map(function (s) { return s.trim().toLowerCase(); }).filter(esCorreo_);
}

function esCorreo_(s) { return /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]{2,}$/.test(String(s || '')); }

function limpiar_(v, max) {
  return String(v === undefined || v === null ? '' : v).replace(/[\r\n\t]+/g, ' ').replace(/\|/g, '/').replace(/\s+/g, ' ').trim().slice(0, max || 200);
}

function primerNombre_(n) { return String(n || '').trim().split(/\s+/)[0] || ''; }
function mayus_(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function esc_(s) {
  return String(s === undefined || s === null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function mensajeError_(err) {
  return String((err && err.message) || err || 'Error').replace(/^(Exception|Error):\s*/, '');
}

function intentar_(fn) {
  try { fn(); } catch (err) { console.warn(err && err.stack ? err.stack : err); }
}
