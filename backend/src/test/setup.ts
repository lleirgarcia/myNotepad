/**
 * Runs before all tests. Sets env vars so config.ts can load without throwing.
 */
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? 'test-openai-key';
process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'test-service-role-key';
process.env.BACKEND_API_KEY = process.env.BACKEND_API_KEY ?? 'test-backend-api-key';
process.env.DEFAULT_USER_ID =
  process.env.DEFAULT_USER_ID ?? '00000000-0000-0000-0000-000000000001';
