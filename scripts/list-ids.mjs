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

async function listIds() {
  const { data: cls } = await sb.from('clientes').select('id_cliente, nombres, apellidos');
  console.log("=== CLIENTES ===");
  console.log(cls);

  const { data: mecs } = await sb.from('mecanicos').select('id_mecanico, nombres, apellidos');
  console.log("\n=== MECANICOS ===");
  console.log(mecs);

  const { data: vcs } = await sb.from('vehiculoclientes').select('id_registro, id_cliente, id_vehiculo');
  console.log("\n=== VEHICULO CLIENTES ===");
  console.log(vcs);
}

listIds();
