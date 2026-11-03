// Pruebas de la regla de graduación y del RUT (node --test tests/)
// Los casos son los mismos de tests/permisos_test.sql, para asegurar que
// la app (JavaScript) y la base de datos (SQL) calculen igual.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { estadoEstudiante } from '../app/js/lib/reglas.js';
import { normalizarRut, formatearRut } from '../app/js/lib/rut.js';

const hoy = '2027-10-01';
const programa = { min_asistencias: 4, max_visitas_que_cuentan: 1 };
const A = (id, tipo, fecha, cuenta = true) => ({ id, tipo, codigo: id, fecha, cuenta_para_graduacion: cuenta });
const actividades = [
  A('S1', 'sesion', '2027-08-01'), A('S2', 'sesion', '2027-08-10'), A('S3', 'sesion', '2027-08-20'),
  A('S4', 'sesion', '2027-09-01'), A('S5', 'sesion', '2027-10-11'), A('V1', 'visita', '2027-09-11'), A('V2', 'visita', '2027-10-06'),
  A('J1', 'jornada', '2027-05-01', false),
];
const asis = (est, ...ids) => ids.map((a) => ({ actividad_id: a, estudiante_id: est, presente: true }));
const asistencias = [
  ...asis('ana', 'S1', 'S2', 'S3', 'S4', 'J1'),
  ...asis('beto', 'S1', 'S2', 'V1'),
  ...asis('caro', 'S1'), { actividad_id: 'S3', estudiante_id: 'caro', presente: false },
  ...asis('dani', 'S1', 'S2', 'S3', 'V1', 'V2'),
];
const ctx = { programa, actividades, asistencias, inscripciones: [{ actividad_id: 'V2', estudiante_id: 'beto' }], hoy };
const est = (id, estado = 'activo') => estadoEstudiante({ id, estado }, ctx);

test('graduado con 4 sesiones (la jornada que no cuenta se ignora)', () => {
  const r = est('ana'); assert.equal(r.estado, 'graduado'); assert.equal(r.total, 4);
});
test('en camino: 2 sesiones + 1 visita, queda S5', () => {
  const r = est('beto'); assert.equal(r.estado, 'en_camino'); assert.equal(r.faltan, 1);
  assert.deepEqual(r.inscritas.map((a) => a.id), ['V2']);
});
test('no alcanza: 1 sesión, quedan S5 y V2 (máx. 3)', () => {
  assert.equal(est('caro').estado, 'no_alcanza');
});
test('las visitas topan en 1', () => {
  const r = est('dani'); assert.equal(r.total, 4); assert.equal(r.visitas, 2); assert.equal(r.estado, 'graduado');
});
test('baja manda sobre todo', () => {
  assert.equal(est('ana', 'baja').estado, 'baja');
});
test('RUT: normaliza, valida y formatea', () => {
  assert.deepEqual(normalizarRut('12.345.678-5'), { rut: '12345678-5' });
  assert.deepEqual(normalizarRut(' 5555555-9 '), { rut: '5555555-9' });
  assert.equal(normalizarRut('12.345.678-4').error, 'El dígito verificador no coincide.');
  assert.ok(normalizarRut('123').error);
  assert.deepEqual(normalizarRut('10.000.013-k'), { rut: '10000013-K' });
  assert.equal(formatearRut('12345678-5'), '12.345.678-5');
});
