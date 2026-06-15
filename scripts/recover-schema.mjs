import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = readFileSync('.env', 'utf8');
const url = env.match(/VITE_SUPABASE_URL\s*=\s*(.+)/)?.[1]?.trim();
const key = env.match(/VITE_SUPABASE_API_KEY\s*=\s*(.+)/)?.[1]?.trim();

if (!url || !key) {
  console.error('Missing env vars');
  process.exit(1);
}

const sb = createClient(url, key);

async function recover() {
  console.log("Intentando insertar registro vacío en 'cita'...");
  const { data, error } = await sb.from('cita').insert({}).select();
  
  if (error) {
    console.log("Error retornado:", error);
    console.log("Mensaje detallado:", error.message);
    console.log("Detalle:", error.details);
    console.log("Sugerencia:", error.hint);
  } else {
    console.log("¡Inserción exitosa! Fila creada:", data);
  }
}

recover();
