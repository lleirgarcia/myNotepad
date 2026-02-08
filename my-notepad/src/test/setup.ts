import '@testing-library/jest-dom/vitest';

// No backend in tests by default (components use local state / mocks)
if (typeof import.meta.env !== 'undefined') {
  (import.meta.env as { VITE_BACKEND_URL?: string }).VITE_BACKEND_URL = '';
}
