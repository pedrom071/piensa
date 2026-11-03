// RUT chileno: limpiar, validar dígito verificador y dar formato.

export function digitoVerificador(cuerpo) {
  let suma = 0, mult = 2;
  for (const d of String(cuerpo).split('').reverse()) {
    suma += Number(d) * mult;
    mult = mult === 7 ? 2 : mult + 1;
  }
  const r = 11 - (suma % 11);
  return r === 11 ? '0' : r === 10 ? 'K' : String(r);
}

// Devuelve { rut: '12345678-5' } o { error: '...' }
export function normalizarRut(texto) {
  const limpio = String(texto ?? '').replace(/[^0-9kK]/g, '').toUpperCase();
  if (!limpio) return { error: 'Falta el RUT.' };
  if (limpio.length < 8 || limpio.length > 9) return { error: 'El RUT debe tener 7 u 8 dígitos más el dígito verificador.' };
  const cuerpo = limpio.slice(0, -1), dv = limpio.slice(-1);
  if (!/^\d+$/.test(cuerpo)) return { error: 'El RUT tiene caracteres que no corresponden.' };
  if (digitoVerificador(cuerpo) !== dv) return { error: 'El dígito verificador no coincide.' };
  return { rut: `${Number(cuerpo)}-${dv}` };
}

// '12345678-5' → '12.345.678-5'
export function formatearRut(rut) {
  if (!rut) return '';
  const [c, dv] = String(rut).split('-');
  return `${Number(c).toLocaleString('es-CL')}-${dv}`;
}
