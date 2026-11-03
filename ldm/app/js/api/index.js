// Elige la conexión: modo demostración (?demo en la dirección) o Supabase real.
import { CONFIG } from '../../config.js';

export const enDemo = new URLSearchParams(location.search).has('demo') || !CONFIG.supabaseUrl || !CONFIG.supabaseKey;

export async function cargarApi() {
  const mod = enDemo ? await import('./demo.js') : await import('./supabase.js');
  return { api: mod.api, hoyDemo: mod.HOY_DEMO ?? null };
}
