// Función "cuentas" (Supabase Edge Function, Deno)
//
// Crea y administra cuentas sin depender del correo:
//   - crear_estudiantes: crea la cuenta de cada estudiante (RUT + clave temporal)
//   - reiniciar_clave:   genera una clave temporal nueva para un estudiante
//   - crear_profesor:    crea la cuenta de un profesor (correo + clave temporal)   [solo admin]
//
// Quién puede usarla:
//   admin    → todo
//   profesor → crear_estudiantes y reiniciar_clave, solo para estudiantes de su colegio
//
// Usa la service_role key, que Supabase entrega a la función automáticamente
// (nunca está en la app ni en el repositorio).

import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// Dominio interno para las cuentas de estudiantes. Debe coincidir con app/config.js.
// No se envían correos a esta dirección: solo identifica la cuenta.
const DOMINIO = Deno.env.get("LDM_DOMINIO_ESTUDIANTES") ?? "estudiantes.ldm.fundacionpiensa.cl";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

// Clave temporal fácil de dictar: palabra + 4 dígitos (ej. faro-4821)
const PALABRAS = ["faro", "cerro", "marea", "puerto", "ancla", "brisa", "muelle", "ola", "bahia", "duna", "roca", "isla"];
function claveTemporal(): string {
  const r = new Uint32Array(2);
  crypto.getRandomValues(r);
  return `${PALABRAS[r[0] % PALABRAS.length]}-${String(1000 + (r[1] % 9000))}`;
}

const correoEstudiante = (rut: string) => `${rut.split("-")[0]}@${DOMINIO}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  // 1) ¿Quién llama?
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const { data: u, error: eU } = token ? await admin.auth.getUser(token) : { data: null, error: true };
  if (eU || !u?.user) return json({ error: "Debes iniciar sesión" }, 401);

  const { data: perfil } = await admin.from("perfiles").select("rol, colegio_id").eq("id", u.user.id).single();
  if (!perfil || (perfil.rol !== "admin" && perfil.rol !== "profesor")) {
    return json({ error: "No tienes permiso para administrar cuentas" }, 403);
  }
  const esAdmin = perfil.rol === "admin";

  let body: { accion?: string; estudiantes?: string[]; estudiante?: string; correo?: string; nombre?: string; colegio_id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Solicitud inválida" }, 400);
  }

  // Carga estudiantes verificando que el profesor solo toque los de su colegio
  async function cargarEstudiantes(ids: string[]) {
    const { data, error } = await admin
      .from("estudiantes")
      .select("id, rut, nombres, apellidos, colegio_id, user_id, codigo")
      .in("id", ids);
    if (error) throw error;
    const ajenos = (data ?? []).filter((e) => !esAdmin && e.colegio_id !== perfil!.colegio_id);
    if (ajenos.length) throw new Error("Hay estudiantes que no son de tu colegio");
    return data ?? [];
  }

  try {
    switch (body.accion) {
      case "crear_estudiantes": {
        const ids = (body.estudiantes ?? []).slice(0, 300);
        if (!ids.length) return json({ error: "No hay estudiantes" }, 400);
        const lista = await cargarEstudiantes(ids);
        const resultado: { id: string; codigo: string; nombre: string; rut: string; clave?: string; estado: string }[] = [];
        for (const e of lista) {
          const nombre = `${e.nombres} ${e.apellidos}`;
          if (e.user_id) {
            resultado.push({ id: e.id, codigo: e.codigo, nombre, rut: e.rut, estado: "ya tenía cuenta" });
            continue;
          }
          const clave = claveTemporal();
          const { data: creado, error } = await admin.auth.admin.createUser({
            email: correoEstudiante(e.rut),
            password: clave,
            email_confirm: true,
            user_metadata: { debe_cambiar_clave: true, rut: e.rut },
          });
          let userId = creado?.user?.id;
          if (error) {
            // El RUT ya tiene cuenta de un año anterior: se reutiliza y se le da clave nueva
            const { data: existentes } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
            const previo = existentes?.users.find((x) => x.email === correoEstudiante(e.rut));
            if (!previo) {
              resultado.push({ id: e.id, codigo: e.codigo, nombre, rut: e.rut, estado: `error: ${error.message}` });
              continue;
            }
            userId = previo.id;
            await admin.auth.admin.updateUserById(previo.id, {
              password: clave,
              user_metadata: { ...previo.user_metadata, debe_cambiar_clave: true },
            });
          }
          await admin.from("perfiles").upsert({ id: userId, rol: "estudiante", nombre, colegio_id: e.colegio_id });
          await admin.from("estudiantes").update({ user_id: userId }).eq("id", e.id);
          resultado.push({ id: e.id, codigo: e.codigo, nombre, rut: e.rut, clave, estado: "creada" });
        }
        return json({ cuentas: resultado });
      }

      case "reiniciar_clave": {
        if (!body.estudiante) return json({ error: "Falta el estudiante" }, 400);
        const [e] = await cargarEstudiantes([body.estudiante]);
        if (!e?.user_id) return json({ error: "Ese estudiante aún no tiene cuenta" }, 400);
        const clave = claveTemporal();
        const { error } = await admin.auth.admin.updateUserById(e.user_id, {
          password: clave,
          user_metadata: { debe_cambiar_clave: true, rut: e.rut },
        });
        if (error) throw error;
        return json({ codigo: e.codigo, nombre: `${e.nombres} ${e.apellidos}`, clave });
      }

      case "crear_profesor": {
        if (!esAdmin) return json({ error: "Solo el equipo P!ensa crea cuentas de profesores" }, 403);
        const correo = (body.correo ?? "").trim().toLowerCase();
        if (!correo || !body.nombre || !body.colegio_id) return json({ error: "Faltan correo, nombre o colegio" }, 400);
        const clave = claveTemporal();
        const { data: creado, error } = await admin.auth.admin.createUser({
          email: correo,
          password: clave,
          email_confirm: true,
          user_metadata: { debe_cambiar_clave: true },
        });
        if (error) throw error;
        await admin.from("perfiles").insert({
          id: creado.user!.id, rol: "profesor", nombre: body.nombre, correo, colegio_id: body.colegio_id,
        });
        return json({ correo, clave });
      }

      default:
        return json({ error: "Acción desconocida" }, 400);
    }
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 400);
  }
});
