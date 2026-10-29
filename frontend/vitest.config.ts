import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/__tests__/setup.ts'],
    env: {
      VITE_LEGAL_OWNER_NAME: 'Camille Martin',
      VITE_LEGAL_CONTACT_EMAIL: 'contact@example.org',
      VITE_SITE_URL: 'https://trackmyapps.example.org',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
});
