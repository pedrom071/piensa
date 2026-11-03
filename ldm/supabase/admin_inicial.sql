-- Crear la primera cuenta de administración (equipo P!ensa).
-- 1) En Supabase: Authentication > Users > Add user > Create new user
--    con tu correo y una clave, marcando "Auto Confirm User".
-- 2) Cambia el correo de abajo por ese mismo y ejecuta esto en el SQL Editor.
--    Repite para cada persona del equipo (cambiando correo y nombre).

insert into public.perfiles (id, rol, nombre, correo)
select id, 'admin', 'Pedro Maiz', email
from auth.users
where email = 'pedro.maiz@fundacionpiensa.cl'
on conflict (id) do update set rol = 'admin';
