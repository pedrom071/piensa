-- =====================================================================
-- Líderes del Mañana (LDM) · Fundación P!ensa
-- Esquema de base de datos para Supabase (Postgres 15+)
--
-- Cómo usarlo: en Supabase, abre "SQL Editor", pega este archivo completo
-- y ejecútalo una vez. Después ejecuta seed_2027.sql.
--
-- Roles:
--   admin       equipo P!ensa: ve y edita todo
--   profesor    ve y edita solo a los estudiantes de su colegio
--   estudiante  ve solo su propio avance y responde sus encuestas
--
-- Los permisos se aplican en la base de datos (Row Level Security),
-- no en la app: aunque alguien manipule la app, no puede leer datos ajenos.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- tipos ----------
create type public.rol_usuario as enum ('admin', 'profesor', 'estudiante');
create type public.tipo_actividad as enum ('jornada', 'sesion', 'visita');
create type public.estado_estudiante as enum ('activo', 'baja');
create type public.tipo_encuesta as enum ('entrada', 'salida');

-- ---------- tablas ----------

-- Una fila por año del programa. La regla de graduación vive aquí.
create table public.programas (
  id                       uuid primary key default gen_random_uuid(),
  anio                     int  not null unique,
  nombre                   text not null default 'Líderes del Mañana',
  min_asistencias          int  not null default 4 check (min_asistencias > 0),
  max_visitas_que_cuentan  int  not null default 1 check (max_visitas_que_cuentan >= 0),
  fecha_graduacion         date,
  meta_graduados           int,
  activo                   boolean not null default true,
  creado_en                timestamptz not null default now()
);

create table public.colegios (
  id           uuid primary key default gen_random_uuid(),
  rbd          text unique,
  nombre       text not null,
  comuna       text,
  dependencia  text,
  creado_en    timestamptz not null default now()
);

-- Perfil de cada cuenta (admin, profesor o estudiante). id = auth.users.id
create table public.perfiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  rol         public.rol_usuario not null,
  nombre      text not null,
  correo      text,
  telefono    text,
  colegio_id  uuid references public.colegios (id),
  creado_en   timestamptz not null default now(),
  constraint profesor_tiene_colegio check (rol <> 'profesor' or colegio_id is not null)
);

-- Colegios que participan en un año y su profesor/a a cargo
create table public.programa_colegios (
  programa_id  uuid not null references public.programas (id) on delete cascade,
  colegio_id   uuid not null references public.colegios (id) on delete cascade,
  profesor_id  uuid references public.perfiles (id) on delete set null,
  cupos        int,
  primary key (programa_id, colegio_id)
);

create table public.estudiantes (
  id                        uuid primary key default gen_random_uuid(),
  programa_id               uuid not null references public.programas (id) on delete cascade,
  colegio_id                uuid not null references public.colegios (id),
  codigo                    text unique,                     -- LDM27-<RBD>-01, se asigna solo
  rut                       text not null check (rut ~ '^[0-9]{7,8}-[0-9K]$'),  -- 12345678-K
  nombres                   text not null,
  apellidos                 text not null,
  curso                     text,
  correo                    text,
  user_id                   uuid unique references auth.users (id) on delete set null,
  estado                    public.estado_estudiante not null default 'activo',
  fecha_alta                date not null default current_date,
  fecha_baja                date,
  motivo_baja               text,
  reemplaza_a               uuid references public.estudiantes (id) on delete set null,
  consentimiento_apoderado  boolean not null default false,
  creado_por                uuid default auth.uid(),
  creado_en                 timestamptz not null default now(),
  unique (programa_id, rut),
  constraint baja_con_fecha check (estado = 'activo' or fecha_baja is not null)
);
create index on public.estudiantes (colegio_id);
create index on public.estudiantes (programa_id);

-- Jornada (1er semestre), sesiones (2º semestre) y visitas cívicas
create table public.actividades (
  id                      uuid primary key default gen_random_uuid(),
  programa_id             uuid not null references public.programas (id) on delete cascade,
  tipo                    public.tipo_actividad not null,
  codigo                  text not null,                     -- J1, S1…S6, V1…
  nombre                  text not null,
  fecha                   date not null,
  hora_inicio             time,
  hora_fin                time,
  lugar                   text,
  cupos                   int,
  cupos_por_colegio       int,
  cuenta_para_graduacion  boolean not null default true,
  creado_en               timestamptz not null default now(),
  unique (programa_id, codigo)
);

-- Inscripción a visitas cívicas (la hace el profesor o P!ensa)
create table public.inscripciones_visita (
  actividad_id   uuid not null references public.actividades (id) on delete cascade,
  estudiante_id  uuid not null references public.estudiantes (id) on delete cascade,
  inscrito_por   uuid default auth.uid(),
  inscrito_en    timestamptz not null default now(),
  primary key (actividad_id, estudiante_id)
);

create table public.asistencias (
  actividad_id   uuid not null references public.actividades (id) on delete cascade,
  estudiante_id  uuid not null references public.estudiantes (id) on delete cascade,
  presente       boolean not null default true,
  nota           text,
  registrado_por uuid default auth.uid(),
  registrado_en  timestamptz not null default now(),
  primary key (actividad_id, estudiante_id)
);

-- Encuestas de entrada y salida. Las preguntas se guardan como JSON
-- (ver formato en seed_2027.sql) para poder cambiarlas sin tocar el código.
create table public.encuestas (
  id           uuid primary key default gen_random_uuid(),
  programa_id  uuid not null references public.programas (id) on delete cascade,
  tipo         public.tipo_encuesta not null,
  titulo       text not null,
  preguntas    jsonb not null default '{}'::jsonb,
  abierta      boolean not null default false,
  creado_en    timestamptz not null default now(),
  unique (programa_id, tipo)
);

create table public.respuestas (
  encuesta_id    uuid not null references public.encuestas (id) on delete cascade,
  estudiante_id  uuid not null references public.estudiantes (id) on delete cascade,
  respuestas     jsonb not null,
  enviada_en     timestamptz not null default now(),
  primary key (encuesta_id, estudiante_id)
);

-- ---------- funciones de apoyo para los permisos ----------
-- security definer: leen perfiles sin quedar atrapadas en sus propias reglas.

create or replace function public.mi_rol()
returns public.rol_usuario language sql stable security definer set search_path = public as $$
  select rol from public.perfiles where id = auth.uid()
$$;

create or replace function public.es_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select rol = 'admin' from public.perfiles where id = auth.uid()), false)
$$;

create or replace function public.mi_colegio()
returns uuid language sql stable security definer set search_path = public as $$
  select colegio_id from public.perfiles where id = auth.uid() and rol = 'profesor'
$$;

-- ¿La operación viene del sistema? (SQL Editor de Supabase o funciones con service_role)
create or replace function public.es_sistema()
returns boolean language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', 'service_role') = 'service_role'
$$;

-- ¿El estudiante pertenece al colegio del profesor que consulta?
create or replace function public.es_mi_estudiante(est uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.estudiantes e
    where e.id = est and e.colegio_id = public.mi_colegio()
  )
$$;

-- ¿Es la fila del propio estudiante que consulta?
create or replace function public.soy_estudiante(est uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.estudiantes e where e.id = est and e.user_id = auth.uid())
$$;

-- ---------- reglas automáticas ----------

-- Normaliza el RUT (sin puntos, con guion, K mayúscula) y valida el dígito verificador.
create or replace function public.normalizar_rut(r text)
returns text language plpgsql immutable as $$
declare
  limpio text := upper(regexp_replace(coalesce(r, ''), '[^0-9kK]', '', 'g'));
  cuerpo text; dv text; suma int := 0; mult int := 2; i int; calc text;
begin
  if length(limpio) < 8 or length(limpio) > 9 then
    raise exception 'RUT inválido: %', r;
  end if;
  cuerpo := left(limpio, length(limpio) - 1);
  dv := right(limpio, 1);
  if cuerpo !~ '^[0-9]+$' then raise exception 'RUT inválido: %', r; end if;
  for i in reverse length(cuerpo)..1 loop
    suma := suma + substr(cuerpo, i, 1)::int * mult;
    mult := case when mult = 7 then 2 else mult + 1 end;
  end loop;
  calc := case 11 - (suma % 11) when 11 then '0' when 10 then 'K' else (11 - (suma % 11))::text end;
  if calc <> dv then
    raise exception 'RUT con dígito verificador incorrecto: %', r;
  end if;
  return ltrim(cuerpo, '0') || '-' || dv;
end $$;

create or replace function public.estudiantes_antes_de_guardar()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  anio2 text; sig int;
  privilegiado boolean := public.es_admin() or public.es_sistema();
begin
  new.rut := public.normalizar_rut(new.rut);

  if tg_op = 'INSERT' and not privilegiado then
    -- la cuenta y el código los asigna el sistema, no quien carga al estudiante
    new.user_id := null;
    new.codigo := null;
  end if;

  if tg_op = 'UPDATE' and not privilegiado then
    -- un profesor no puede mover estudiantes de colegio/año ni tocar su cuenta
    if new.colegio_id is distinct from old.colegio_id
       or new.programa_id is distinct from old.programa_id
       or new.user_id is distinct from old.user_id
       or new.codigo is distinct from old.codigo then
      raise exception 'Solo el equipo P!ensa puede cambiar colegio, año, código o cuenta de un estudiante';
    end if;
  end if;

  if new.codigo is null then
    select right(p.anio::text, 2) into anio2 from public.programas p where p.id = new.programa_id;
    select coalesce(max(nullif(regexp_replace(e.codigo, '^.*-', ''), '')::int), 0) + 1 into sig
      from public.estudiantes e
     where e.programa_id = new.programa_id and e.colegio_id = new.colegio_id and e.codigo ~ '-[0-9]+$';
    new.codigo := 'LDM' || anio2 || '-' ||
      coalesce((select c.rbd from public.colegios c where c.id = new.colegio_id), 'X') || '-' ||
      lpad(sig::text, 2, '0');
  end if;
  return new;
end $$;

create trigger estudiantes_antes_de_guardar
  before insert or update on public.estudiantes
  for each row execute function public.estudiantes_antes_de_guardar();

-- ---------- estado de graduación ----------
-- Una fila por estudiante, calculada en vivo. Respeta los permisos
-- (security_invoker): cada rol ve solo las filas que puede ver.
--
-- estado:
--   graduado    ya cumple la regla
--   en_camino   aún puede cumplirla con las actividades que quedan
--   no_alcanza  aunque asista a todo lo que queda, no llega
--   baja        dejó el programa
create or replace view public.estado_graduacion with (security_invoker = true) as
with base as (
  select
    e.id as estudiante_id, e.programa_id, e.colegio_id, e.estado as estado_estudiante,
    p.min_asistencias, p.max_visitas_que_cuentan,
    count(*) filter (where a.presente and act.tipo in ('jornada', 'sesion') and act.cuenta_para_graduacion) as sesiones,
    count(*) filter (where a.presente and act.tipo = 'visita' and act.cuenta_para_graduacion) as visitas
  from public.estudiantes e
  join public.programas p on p.id = e.programa_id
  left join public.asistencias a on a.estudiante_id = e.id
  left join public.actividades act on act.id = a.actividad_id
  group by e.id, p.id
),
pendientes as (
  select
    b.estudiante_id,
    -- sesiones futuras (o de hoy) sin asistencia registrada
    (select count(*) from public.actividades act
       where act.programa_id = b.programa_id and act.tipo in ('jornada', 'sesion')
         and act.cuenta_para_graduacion and act.fecha >= current_date
         and not exists (select 1 from public.asistencias x
                          where x.actividad_id = act.id and x.estudiante_id = b.estudiante_id)) as sesiones_restantes,
    (select count(*) from public.actividades act
       where act.programa_id = b.programa_id and act.tipo = 'visita'
         and act.cuenta_para_graduacion and act.fecha >= current_date
         and not exists (select 1 from public.asistencias x
                          where x.actividad_id = act.id and x.estudiante_id = b.estudiante_id)) as visitas_restantes,
    exists (select 1 from public.inscripciones_visita iv
              join public.actividades act on act.id = iv.actividad_id
             where iv.estudiante_id = b.estudiante_id and act.fecha >= current_date
               and not exists (select 1 from public.asistencias x
                                where x.actividad_id = act.id and x.estudiante_id = b.estudiante_id)) as inscrito_visita_pendiente
  from base b
)
select
  b.estudiante_id, b.programa_id, b.colegio_id,
  b.sesiones::int, b.visitas::int,
  (b.sesiones + least(b.visitas, b.max_visitas_que_cuentan))::int as total_valido,
  b.min_asistencias,
  greatest(b.min_asistencias - (b.sesiones + least(b.visitas, b.max_visitas_que_cuentan)), 0)::int as faltan,
  pe.sesiones_restantes::int, pe.visitas_restantes::int, pe.inscrito_visita_pendiente,
  case
    when b.estado_estudiante = 'baja' then 'baja'
    when b.sesiones + least(b.visitas, b.max_visitas_que_cuentan) >= b.min_asistencias then 'graduado'
    when b.sesiones + pe.sesiones_restantes
         + least(b.visitas + pe.visitas_restantes, b.max_visitas_que_cuentan) >= b.min_asistencias then 'en_camino'
    else 'no_alcanza'
  end as estado
from base b
join pendientes pe using (estudiante_id);

-- Avance de encuestas por estudiante sin exponer las respuestas
-- (para que el profesor sepa quién falta, sin ver qué contestó cada uno).
create or replace function public.avance_encuestas()
returns table (estudiante_id uuid, tipo public.tipo_encuesta, enviada boolean)
language sql stable security definer set search_path = public as $$
  select e.id, enc.tipo, (r.estudiante_id is not null)
    from public.estudiantes e
    join public.encuestas enc on enc.programa_id = e.programa_id
    left join public.respuestas r on r.encuesta_id = enc.id and r.estudiante_id = e.id
   where public.es_admin() or e.colegio_id = public.mi_colegio() or e.user_id = auth.uid()
$$;

-- ---------- permisos (Row Level Security) ----------
alter table public.programas            enable row level security;
alter table public.colegios             enable row level security;
alter table public.perfiles             enable row level security;
alter table public.programa_colegios    enable row level security;
alter table public.estudiantes          enable row level security;
alter table public.actividades          enable row level security;
alter table public.inscripciones_visita enable row level security;
alter table public.asistencias          enable row level security;
alter table public.encuestas            enable row level security;
alter table public.respuestas           enable row level security;

-- Catálogos: cualquier usuario con cuenta los lee; solo admin los edita
create policy "leer programas"   on public.programas   for select to authenticated using (true);
create policy "admin programas"  on public.programas   for all    to authenticated using (public.es_admin()) with check (public.es_admin());
create policy "leer colegios"    on public.colegios    for select to authenticated using (true);
create policy "admin colegios"   on public.colegios    for all    to authenticated using (public.es_admin()) with check (public.es_admin());
create policy "leer actividades" on public.actividades for select to authenticated using (true);
create policy "admin actividades" on public.actividades for all   to authenticated using (public.es_admin()) with check (public.es_admin());
create policy "leer programa_colegios"  on public.programa_colegios for select to authenticated using (true);
create policy "admin programa_colegios" on public.programa_colegios for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- Perfiles: cada uno ve el suyo; admin ve y edita todos
create policy "ver mi perfil"   on public.perfiles for select to authenticated using (id = auth.uid() or public.es_admin());
create policy "admin perfiles"  on public.perfiles for all    to authenticated using (public.es_admin()) with check (public.es_admin());

-- Estudiantes
create policy "admin estudiantes"       on public.estudiantes for all    to authenticated using (public.es_admin()) with check (public.es_admin());
create policy "profesor ve su colegio"  on public.estudiantes for select to authenticated using (colegio_id = public.mi_colegio());
create policy "profesor agrega"         on public.estudiantes for insert to authenticated with check (colegio_id = public.mi_colegio());
create policy "profesor edita"          on public.estudiantes for update to authenticated using (colegio_id = public.mi_colegio()) with check (colegio_id = public.mi_colegio());
create policy "estudiante se ve"        on public.estudiantes for select to authenticated using (user_id = auth.uid());

-- Inscripción a visitas: profesor gestiona la de su colegio
create policy "admin inscripciones"      on public.inscripciones_visita for all    to authenticated using (public.es_admin()) with check (public.es_admin());
create policy "profesor ve inscripciones" on public.inscripciones_visita for select to authenticated using (public.es_mi_estudiante(estudiante_id));
create policy "profesor inscribe"        on public.inscripciones_visita for insert to authenticated with check (public.es_mi_estudiante(estudiante_id));
create policy "profesor desinscribe"     on public.inscripciones_visita for delete to authenticated using (public.es_mi_estudiante(estudiante_id));
create policy "estudiante ve su inscripcion" on public.inscripciones_visita for select to authenticated using (public.soy_estudiante(estudiante_id));

-- Asistencia: la registra P!ensa; profesor y estudiante la leen
create policy "admin asistencias"      on public.asistencias for all    to authenticated using (public.es_admin()) with check (public.es_admin());
create policy "profesor ve asistencia" on public.asistencias for select to authenticated using (public.es_mi_estudiante(estudiante_id));
create policy "estudiante ve asistencia" on public.asistencias for select to authenticated using (public.soy_estudiante(estudiante_id));

-- Encuestas: todos leen las preguntas; admin las edita
create policy "leer encuestas"  on public.encuestas for select to authenticated using (true);
create policy "admin encuestas" on public.encuestas for all    to authenticated using (public.es_admin()) with check (public.es_admin());

-- Respuestas: el estudiante responde la suya mientras la encuesta está abierta;
-- admin ve todas; el profesor NO ve respuestas (usa avance_encuestas()).
create policy "admin respuestas" on public.respuestas for all to authenticated using (public.es_admin()) with check (public.es_admin());
create policy "estudiante ve su respuesta" on public.respuestas for select to authenticated using (public.soy_estudiante(estudiante_id));
create policy "estudiante responde" on public.respuestas for insert to authenticated
  with check (public.soy_estudiante(estudiante_id)
              and exists (select 1 from public.encuestas en where en.id = encuesta_id and en.abierta));
create policy "estudiante corrige" on public.respuestas for update to authenticated
  using (public.soy_estudiante(estudiante_id))
  with check (public.soy_estudiante(estudiante_id)
              and exists (select 1 from public.encuestas en where en.id = encuesta_id and en.abierta));

-- ---------- acceso de la app (Data API) ----------
-- El proyecto se crea con "Automatically expose new tables" desactivado,
-- así que los permisos se dan aquí, a mano. Solo usuarios con sesión
-- (authenticated); nada para visitantes anónimos. Las filas que cada uno
-- ve las siguen limitando las reglas de arriba.
grant usage on schema public to authenticated;
grant select, insert, update, delete on
  public.programas, public.colegios, public.perfiles, public.programa_colegios,
  public.estudiantes, public.actividades, public.inscripciones_visita,
  public.asistencias, public.encuestas, public.respuestas
  to authenticated;
grant select on public.estado_graduacion to authenticated;
grant execute on function public.avance_encuestas() to authenticated;
revoke execute on function public.avance_encuestas() from anon;
