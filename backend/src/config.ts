import 'dotenv/config';

const apiKey = process.env.OPENAI_API_KEY;
const supabaseUrl =
  process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim();
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const backendApiKey = process.env.BACKEND_API_KEY?.trim();
const defaultUserId = process.env.DEFAULT_USER_ID?.trim();

if (!apiKey?.trim()) {
  throw new Error(
    'Missing OPENAI_API_KEY. Set it in .env or the environment. Get a key at https://platform.openai.com/api-keys'
  );
}

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    'Missing Supabase config. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend .env (service role key from Supabase Dashboard → Settings → API)'
  );
}

if (!backendApiKey) {
  throw new Error(
    'Missing BACKEND_API_KEY. Set it in backend .env. Frontend uses VITE_BACKEND_API_KEY (same value) to call the API.'
  );
}

if (!defaultUserId) {
  throw new Error(
    'Missing DEFAULT_USER_ID. Set it in backend .env to any UUID (e.g. from https://www.uuidgenerator.net/). All data is stored under this single user.'
  );
}

export const config = {
  openai: {
    apiKey: apiKey.trim(),
  },
  server: {
    port: Number(process.env.PORT) || 3000,
  },
  supabase: {
    url: supabaseUrl,
    serviceRoleKey: supabaseServiceRoleKey,
  },
  backendApiKey: backendApiKey,
  defaultUserId: defaultUserId,
} as const;
