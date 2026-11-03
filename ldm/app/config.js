// Configuración pública de la app. Estos valores PUEDEN estar en el repositorio:
// la "publishable key" de Supabase es pública por diseño; lo que protege los datos
// son las reglas de permisos de la base de datos (supabase/schema.sql).
// NUNCA pongas aquí la secret key ni la service_role key.
export const CONFIG = {
  supabaseUrl: 'https://cmawpiywgwcbhtraqdvc.supabase.co',
  supabaseKey: 'sb_publishable_oLAejvLz15zVW5o_LyLkiw_qGkdPmD1',
  // Dominio interno de las cuentas de estudiantes (no recibe correos).
  // Debe ser igual a LDM_DOMINIO_ESTUDIANTES de la función "cuentas".
  dominioEstudiantes: 'estudiantes.ldm.fundacionpiensa.cl',
};
