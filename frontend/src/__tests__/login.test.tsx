import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/services/auth.service', () => ({
  authService: { login: vi.fn() },
}));

async function renderLogin() {
  // The demo credentials are read when the module loads
  vi.resetModules();
  const { LoginPage } = await import('@/pages/auth/Login');
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Page: LoginPage', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('hides the demo button when the deployment has no demo account', async () => {
    vi.stubEnv('VITE_DEMO_EMAIL', '');
    vi.stubEnv('VITE_DEMO_PASSWORD', '');
    await renderLogin();

    expect(screen.queryByRole('button', { name: /compte démo/i })).not.toBeInTheDocument();
  });

  it('shows the demo button when demo credentials are configured', async () => {
    vi.stubEnv('VITE_DEMO_EMAIL', 'demo@example.com');
    vi.stubEnv('VITE_DEMO_PASSWORD', 'Demo1234!');
    await renderLogin();

    expect(screen.getByRole('button', { name: /compte démo/i })).toBeInTheDocument();
  });
});
