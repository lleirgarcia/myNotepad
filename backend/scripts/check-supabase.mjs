#!/usr/bin/env node
/**
 * Run from backend folder: node scripts/check-supabase.mjs
 * Tests if the backend can reach Supabase (network + URL + key).
 */
import 'dotenv/config';

const url = process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

console.log('SUPABASE_URL:', url.replace(/.\w+$/, '***'));
console.log('Key length:', key.length, '(service_role is usually 200+ chars)\n');

// 1. Raw fetch to Supabase REST
console.log('1. Testing raw fetch to Supabase...');
try {
  const res = await fetch(`${url}/rest/v1/`, {
    headers: { Apikey: key, Authorization: `Bearer ${key}` },
  });
  console.log('   Status:', res.status, res.statusText);
  if (res.status === 200 || res.status === 401) {
    console.log('   OK – backend can reach Supabase.\n');
  } else {
  }
} catch (e) {
  console.error('   FAILED:', e.message || e);
  console.error('   Cause: network/firewall, wrong URL, or SSL. Try: curl -I', url);
  process.exit(1);
}

// 2. Supabase client – list tables (todos)
console.log('2. Testing Supabase client (todos table)...');
const { createClient } = await import('@supabase/supabase-js');
const supabase = createClient(url, key);
const { data, error } = await supabase.from('todos').select('id').limit(1);
if (error) {
  console.error('   FAILED:', error.message);
  if (error.message.includes('fetch failed')) {
    console.error('   → Node fetch to Supabase failed. Check network or run from a different terminal (e.g. outside Cursor).');
  }
  process.exit(1);
}
console.log('   OK – Supabase client works.\n');
console.log('Backend can reach Supabase. If the app still fails, restart the backend (npm run dev).');
