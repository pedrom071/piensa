-- Prueba de permisos y del estado de graduación.
-- Se ejecuta en un Postgres local con tests/supabase_stub.sql + schema.sql + seed_2027.sql
-- (ver tests/correr_pruebas.sh). Falla con error si alguna regla no se cumple.
\set ON_ERROR_STOP 1

-- ---------- datos de prueba (como "SQL Editor": sin sesión, privilegiado) ----------
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'admin@piensa.test'),
  ('00000000-0000-0000-0000-0000000000a1', 'profe.a@colegio.test'),
  ('00000000-0000-0000-0000-0000000000b1', 'profe.b@colegio.test'),
  ('00000000-0000-0000-0000-0000000000e1', '11111111@estudiantes.test');

insert into colegios (id, rbd, nombre) values
  ('10000000-0000-0000-0000-00000000000a', '1111', 'Colegio A'),
  ('10000000-0000-0000-0000-00000000000b', '2222', 'Colegio B');

insert into perfiles (id, rol, nombre, colegio_id) values
  ('00000000-0000-0000-0000-00000000000a', 'admin', 'Admin', null),
  ('00000000-0000-0000-0000-0000000000a1', 'profesor', 'Profe A', '10000000-0000-0000-0000-00000000000a'),
  ('00000000-0000-0000-0000-0000000000b1', 'profesor', 'Profe B', '10000000-0000-0000-0000-00000000000b'),
  ('00000000-0000-0000-0000-0000000000e1', 'estudiante', 'Est A1', '10000000-0000-0000-0000-00000000000a');

-- Programa pasado (para probar estados con fechas ya ocurridas)
insert into programas (id, anio, min_asistencias, max_visitas_que_cuentan)
values ('20000000-0000-0000-0000-000000000026', 2026, 4, 1);
insert into actividades (id, programa_id, tipo, codigo, nombre, fecha) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000026', 'sesion', 'S1', 'S1', current_date - 60),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000026', 'sesion', 'S2', 'S2', current_date - 50),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000026', 'sesion', 'S3', 'S3', current_date - 40),
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000026', 'sesion', 'S4', 'S4', current_date - 30),
  ('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000026', 'sesion', 'S5', 'S5', current_date + 10),
  ('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000026', 'visita', 'V1', 'V1', current_date - 20),
  ('30000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000026', 'visita', 'V2', 'V2', current_date + 5);

insert into estudiantes (id, programa_id, colegio_id, rut, nombres, apellidos, user_id) values
  ('40000000-0000-0000-0000-0000000000a1', '20000000-0000-0000-0000-000000000026', '10000000-0000-0000-0000-00000000000a', '11.111.111-1', 'Ana', 'Uno', '00000000-0000-0000-0000-0000000000e1'),
  ('40000000-0000-0000-0000-0000000000a2', '20000000-0000-0000-0000-000000000026', '10000000-0000-0000-0000-00000000000a', '22222222-2', 'Beto', 'Dos', null),
  ('40000000-0000-0000-0000-0000000000a3', '20000000-0000-0000-0000-000000000026', '10000000-0000-0000-0000-00000000000a', '33.333.333-3', 'Caro', 'Tres', null),
  ('40000000-0000-0000-0000-0000000000b1', '20000000-0000-0000-0000-000000000026', '10000000-0000-0000-0000-00000000000b', '44444444-4', 'Dani', 'Cuatro', null);

-- Ana: 4 sesiones -> graduado. Beto: 2 sesiones + 1 visita = 3, queda S5 -> en_camino.
-- Caro: 1 sesión, quedan S5 + V2 -> máx 3 -> no_alcanza. Dani (colegio B): 3 sesiones + 2 visitas -> 4 (visitas topan en 1) -> graduado.
insert into asistencias (actividad_id, estudiante_id) values
  ('30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-0000000000a1'),
  ('30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-0000000000a1'),
  ('30000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-0000000000a1'),
  ('30000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-0000000000a1'),
  ('30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-0000000000a2'),
  ('30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-0000000000a2'),
  ('30000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-0000000000a2'),
  ('30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-0000000000a3'),
  ('30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-0000000000b1'),
  ('30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-0000000000b1'),
  ('30000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-0000000000b1'),
  ('30000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-0000000000b1');
insert into asistencias (actividad_id, estudiante_id, presente) values
  ('30000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-0000000000a3', false);

do $$
declare r record;
begin
  -- RUT normalizado y código asignado
  select rut, codigo into r from estudiantes where id = '40000000-0000-0000-0000-0000000000a1';
  assert r.rut = '11111111-1', 'rut normalizado: ' || r.rut;
  assert r.codigo = 'LDM26-1111-01', 'codigo: ' || r.codigo;
  select codigo into r from estudiantes where id = '40000000-0000-0000-0000-0000000000a3';
  assert r.codigo = 'LDM26-1111-03', 'codigo 3: ' || r.codigo;

  -- estados
  assert (select estado from estado_graduacion where estudiante_id = '40000000-0000-0000-0000-0000000000a1') = 'graduado', 'Ana graduado';
  assert (select estado from estado_graduacion where estudiante_id = '40000000-0000-0000-0000-0000000000a2') = 'en_camino', 'Beto en camino';
  assert (select faltan from estado_graduacion where estudiante_id = '40000000-0000-0000-0000-0000000000a2') = 1, 'Beto falta 1';
  assert (select estado from estado_graduacion where estudiante_id = '40000000-0000-0000-0000-0000000000a3') = 'no_alcanza', 'Caro no alcanza';
  assert (select estado from estado_graduacion where estudiante_id = '40000000-0000-0000-0000-0000000000b1') = 'graduado', 'Dani graduado (visitas topan)';
  assert (select total_valido from estado_graduacion where estudiante_id = '40000000-0000-0000-0000-0000000000b1') = 4, 'Dani total 4';
end $$;

-- RUT con dígito verificador malo se rechaza
do $$ begin
  begin
    insert into estudiantes (programa_id, colegio_id, rut, nombres, apellidos)
    values ('20000000-0000-0000-0000-000000000026', '10000000-0000-0000-0000-00000000000a', '11111111-2', 'X', 'Y');
    raise exception 'debió rechazar RUT inválido';
  exception when others then
    if sqlerrm not like 'RUT con dígito verificador incorrecto%' then raise; end if;
  end;
end $$;

-- ---------- como PROFESOR A ----------
set role authenticated;
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';
do $$ begin
  assert (select count(*) from estudiantes) = 3, 'profe A ve solo sus 3 estudiantes';
  assert (select count(*) from estado_graduacion) = 3, 'profe A: estado solo de su colegio';
  assert (select count(*) from asistencias) = 9, 'profe A ve asistencias de su colegio (incluye ausentes)';
  assert (select count(*) from respuestas) = 0, 'profe no ve respuestas';
end $$;
-- agrega un estudiante en su colegio (código automático, user_id forzado a null)
insert into estudiantes (programa_id, colegio_id, rut, nombres, apellidos, user_id)
values ('20000000-0000-0000-0000-000000000026', '10000000-0000-0000-0000-00000000000a', '5.555.555-9', 'Eli', 'Cinco', '00000000-0000-0000-0000-0000000000b1');
do $$ begin
  assert (select user_id from estudiantes where rut = '5555555-9') is null, 'profe no puede asignar cuenta';
  assert (select codigo from estudiantes where rut = '5555555-9') = 'LDM26-1111-04', 'codigo nuevo';
end $$;
-- no puede agregar en otro colegio
do $$ begin
  begin
    insert into estudiantes (programa_id, colegio_id, rut, nombres, apellidos)
    values ('20000000-0000-0000-0000-000000000026', '10000000-0000-0000-0000-00000000000b', '66666666-6', 'F', 'G');
    raise exception 'profe A no debió insertar en colegio B';
  exception when insufficient_privilege then null;
  end;
end $$;
-- no puede mover un estudiante a otro colegio
do $$ begin
  begin
    update estudiantes set colegio_id = '10000000-0000-0000-0000-00000000000b' where id = '40000000-0000-0000-0000-0000000000a2';
    raise exception 'profe A no debió mover estudiante';
  exception when others then
    if sqlerrm like 'profe A no debió%' then raise; end if;
  end;
end $$;
-- no puede editar asistencia
do $$ declare n int; begin
  update asistencias set presente = false where estudiante_id = '40000000-0000-0000-0000-0000000000a1';
  get diagnostics n = row_count;
  assert n = 0, 'profe no edita asistencia';
end $$;
-- inscribe a visita a su estudiante, pero no al de otro colegio
insert into inscripciones_visita (actividad_id, estudiante_id) values ('30000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-0000000000a2');
do $$ begin
  begin
    insert into inscripciones_visita (actividad_id, estudiante_id) values ('30000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-0000000000b1');
    raise exception 'profe A no debió inscribir a estudiante de B';
  exception when insufficient_privilege then null;
  end;
  assert (select inscrito_visita_pendiente from estado_graduacion where estudiante_id = '40000000-0000-0000-0000-0000000000a2'), 'Beto inscrito';
end $$;
reset role; reset request.jwt.claims;

-- ---------- como ESTUDIANTE (Ana) ----------
update encuestas set abierta = true where tipo = 'entrada';
insert into encuestas (programa_id, tipo, titulo, abierta) values ('20000000-0000-0000-0000-000000000026', 'entrada', 'Entrada 2026', true);
set role authenticated;
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000e1","role":"authenticated"}';
do $$ begin
  assert (select count(*) from estudiantes) = 1, 'estudiante se ve solo a sí mismo';
  assert (select count(*) from asistencias) = 4, 'estudiante ve sus 4 asistencias';
  assert (select estado from estado_graduacion) = 'graduado', 'estudiante ve su estado';
end $$;
insert into respuestas (encuesta_id, estudiante_id, respuestas)
values ((select id from encuestas where titulo = 'Entrada 2026'), '40000000-0000-0000-0000-0000000000a1', '{"q3": 4}');
do $$ begin
  begin
    insert into respuestas (encuesta_id, estudiante_id, respuestas)
    values ((select id from encuestas where titulo = 'Entrada 2026'), '40000000-0000-0000-0000-0000000000a2', '{"q3": 1}');
    raise exception 'estudiante no debió responder por otro';
  exception when insufficient_privilege then null;
  end;
  assert (select count(*) from avance_encuestas() where enviada) = 1, 'avance encuestas propio';
end $$;
reset role; reset request.jwt.claims;

-- ---------- como PROFESOR B: avance de encuestas sin respuestas ----------
set role authenticated;
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}';
do $$ begin
  assert (select count(*) from estudiantes) = 1, 'profe B ve 1';
  assert (select count(distinct estudiante_id) from avance_encuestas()) = 1, 'profe B: avance solo de su colegio';
end $$;
reset role; reset request.jwt.claims;

-- ---------- como ADMIN ----------
set role authenticated;
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
do $$ begin
  assert (select count(*) from estudiantes) = 5, 'admin ve todo';
  assert (select count(*) from respuestas) = 1, 'admin ve respuestas';
end $$;
update estudiantes set colegio_id = '10000000-0000-0000-0000-00000000000b' where rut = '5555555-9';
reset role; reset request.jwt.claims;

-- ---------- ANÓNIMO: no ve nada ----------
set role anon;
do $$ begin
  begin
    perform count(*) from estudiantes;
    raise exception 'anon no debió leer';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

select 'OK: todas las pruebas de permisos y graduación pasaron' as resultado;
