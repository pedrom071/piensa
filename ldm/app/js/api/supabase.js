// Conexión real con Supabase. Misma interfaz que api/demo.js.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
import { CONFIG } from '../../config.js';

const sb = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});

const correoEstudiante = (rut) => `${rut.split('-')[0]}@${CONFIG.dominioEstudiantes}`;

function revisar({ data, error }) {
  if (error) throw new Error(traducir(error.message));
  return data;
}
function traducir(m) {
  if (/Invalid login credentials/i.test(m)) return 'RUT, correo o clave incorrectos.';
  if (/duplicate key.*rut/i.test(m)) return 'Ese RUT ya está inscrito este año.';
  if (/row-level security/i.test(m)) return 'No tienes permiso para hacer eso.';
  if (/Password should be/i.test(m)) return 'La clave debe tener al menos 8 caracteres.';
  return m;
}

async function funcionCuentas(cuerpo) {
  const { data, error } = await sb.functions.invoke('cuentas', { body: cuerpo });
  if (error) {
    let msg = error.message;
    try { msg = (await error.context.json()).error ?? msg; } catch { /* sin cuerpo */ }
    throw new Error(msg);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

export const api = {
  modo: 'real',

  async sesion() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return null;
    const user = session.user;
    const perfil = revisar(await sb.from('perfiles').select('*').eq('id', user.id).maybeSingle());
    if (!perfil) return { usuario: user, perfil: null, sinPerfil: true };
    return { usuario: user, perfil, debeCambiarClave: !!user.user_metadata?.debe_cambiar_clave };
  },

  async ingresarEstudiante(rut, clave) {
    revisar(await sb.auth.signInWithPassword({ email: correoEstudiante(rut), password: clave }));
  },
  async ingresarCorreo(correo, clave) {
    revisar(await sb.auth.signInWithPassword({ email: correo.trim().toLowerCase(), password: clave }));
  },
  async salir() { await sb.auth.signOut(); },
  async cambiarClave(nueva) {
    revisar(await sb.auth.updateUser({ password: nueva, data: { debe_cambiar_clave: false } }));
  },

  // Carga todo lo que el usuario puede ver (los permisos los filtra la base de datos)
  async datos() {
    const programa = revisar(await sb.from('programas').select('*').eq('activo', true).order('anio', { ascending: false }).limit(1).maybeSingle());
    if (!programa) return { programa: null };
    const pid = programa.id;
    const [colegios, actividades, estudiantes, encuestas, programaColegios] = await Promise.all([
      sb.from('colegios').select('*').order('nombre'),
      sb.from('actividades').select('*').eq('programa_id', pid).order('fecha'),
      sb.from('estudiantes').select('*').eq('programa_id', pid).order('apellidos'),
      sb.from('encuestas').select('*').eq('programa_id', pid),
      sb.from('programa_colegios').select('*').eq('programa_id', pid),
    ]).then((r) => r.map(revisar));
    const ids = estudiantes.map((e) => e.id);
    const enLotes = async (tabla) => {
      const out = [];
      for (let i = 0; i < ids.length; i += 150) {
        out.push(...revisar(await sb.from(tabla).select('*').in('estudiante_id', ids.slice(i, i + 150))));
      }
      return out;
    };
    const [asistencias, inscripciones, avance] = await Promise.all([
      enLotes('asistencias'), enLotes('inscripciones_visita'), sb.rpc('avance_encuestas').then(revisar),
    ]);
    const sesion = await this.sesion();
    let respuestasPropias = [], profesores = [];
    if (sesion?.perfil?.rol === 'estudiante') {
      respuestasPropias = revisar(await sb.from('respuestas').select('*'));
    }
    if (sesion?.perfil?.rol === 'admin') {
      profesores = revisar(await sb.from('perfiles').select('*').in('rol', ['profesor', 'admin']));
    }
    return { programa, colegios, actividades, estudiantes, encuestas, programaColegios, asistencias, inscripciones, avance, respuestasPropias, profesores };
  },

  async agregarEstudiantes(filas) {
    return revisar(await sb.from('estudiantes').insert(filas).select());
  },
  async actualizarEstudiante(id, cambios) {
    return revisar(await sb.from('estudiantes').update(cambios).eq('id', id).select().single());
  },
  async marcarAsistencia(actividad_id, estudiante_id, presente) {
    if (presente === null) {
      revisar(await sb.from('asistencias').delete().match({ actividad_id, estudiante_id }));
    } else {
      revisar(await sb.from('asistencias').upsert({ actividad_id, estudiante_id, presente }));
    }
  },
  async inscribir(actividad_id, estudiante_id, si) {
    if (si) revisar(await sb.from('inscripciones_visita').upsert({ actividad_id, estudiante_id }));
    else revisar(await sb.from('inscripciones_visita').delete().match({ actividad_id, estudiante_id }));
  },
  async guardarActividad(a) {
    return revisar(await sb.from('actividades').upsert(a).select().single());
  },
  async borrarActividad(id) { revisar(await sb.from('actividades').delete().eq('id', id)); },
  async guardarColegio(c) {
    return revisar(await sb.from('colegios').upsert(c).select().single());
  },
  async asignarColegio(programa_id, colegio_id, profesor_id) {
    revisar(await sb.from('programa_colegios').upsert({ programa_id, colegio_id, profesor_id: profesor_id || null }));
  },
  async guardarPrograma(id, cambios) {
    return revisar(await sb.from('programas').update(cambios).eq('id', id).select().single());
  },
  async abrirEncuesta(id, abierta) {
    revisar(await sb.from('encuestas').update({ abierta }).eq('id', id));
  },
  async responderEncuesta(encuesta_id, estudiante_id, respuestas) {
    revisar(await sb.from('respuestas').upsert({ encuesta_id, estudiante_id, respuestas, enviada_en: new Date().toISOString() }));
  },
  async respuestasEncuesta(encuesta_id) {
    return revisar(await sb.from('respuestas').select('*').eq('encuesta_id', encuesta_id));
  },

  crearCuentas: (ids) => funcionCuentas({ accion: 'crear_estudiantes', estudiantes: ids }).then((d) => d.cuentas),
  reiniciarClave: (id) => funcionCuentas({ accion: 'reiniciar_clave', estudiante: id }),
  crearProfesor: (p) => funcionCuentas({ accion: 'crear_profesor', ...p }),
};
