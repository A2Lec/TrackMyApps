import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPassword';
import { ResetPasswordPage } from '@/pages/auth/ResetPassword';
import { authService } from '@/services/auth.service';

vi.mock('@/services/auth.service', () => ({
  authService: {
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
  },
}));

function renderAt(ui: React.ReactElement, path = '/') {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('ForgotPasswordPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sends the email and shows a neutral confirmation', async () => {
    vi.mocked(authService.forgotPassword).mockResolvedValue({ message: 'ok' });
    renderAt(<ForgotPasswordPage />);

    fireEvent.change(screen.getByLabelText('Adresse email'), { target: { value: 'alex@test.fr' } });
    fireEvent.click(screen.getByRole('button', { name: /envoyer le lien/i }));

    await waitFor(() => {
      expect(screen.getByText(/Vérifiez votre boîte de réception/i)).toBeInTheDocument();
    });
    expect(authService.forgotPassword).toHaveBeenCalledWith('alex@test.fr');
    expect(screen.getByText('alex@test.fr')).toBeInTheDocument();
  });
});

describe('ResetPasswordPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('explains the link is invalid when there is no token', () => {
    renderAt(<ResetPasswordPage />, '/reset-password');

    expect(screen.getByText(/lien de réinitialisation est incomplet/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /demander un nouveau lien/i })).toHaveAttribute('href', '/forgot-password');
  });

  it('does not submit mismatched passwords', async () => {
    renderAt(<ResetPasswordPage />, '/reset-password?token=abc');

    fireEvent.change(screen.getByLabelText('Nouveau mot de passe'), { target: { value: 'Nouveau1!' } });
    fireEvent.change(screen.getByLabelText('Confirmer le mot de passe'), { target: { value: 'Autre1!!' } });
    fireEvent.click(screen.getByRole('button', { name: /enregistrer/i }));

    await waitFor(() => {
      expect(screen.getByText('Les mots de passe ne correspondent pas')).toBeInTheDocument();
    });
    expect(authService.resetPassword).not.toHaveBeenCalled();
  });

  it('resets the password with the token from the link', async () => {
    vi.mocked(authService.resetPassword).mockResolvedValue({ message: 'ok' });
    renderAt(<ResetPasswordPage />, '/reset-password?token=abc');

    fireEvent.change(screen.getByLabelText('Nouveau mot de passe'), { target: { value: 'Nouveau1!' } });
    fireEvent.change(screen.getByLabelText('Confirmer le mot de passe'), { target: { value: 'Nouveau1!' } });
    fireEvent.click(screen.getByRole('button', { name: /enregistrer/i }));

    await waitFor(() => {
      expect(screen.getByText('Mot de passe modifié')).toBeInTheDocument();
    });
    expect(authService.resetPassword).toHaveBeenCalledWith('abc', 'Nouveau1!');
  });

  it('offers a new link when the token is expired', async () => {
    vi.mocked(authService.resetPassword).mockRejectedValue({
      response: { data: { message: 'Lien de réinitialisation invalide ou expiré' } },
    });
    renderAt(<ResetPasswordPage />, '/reset-password?token=old');

    fireEvent.change(screen.getByLabelText('Nouveau mot de passe'), { target: { value: 'Nouveau1!' } });
    fireEvent.change(screen.getByLabelText('Confirmer le mot de passe'), { target: { value: 'Nouveau1!' } });
    fireEvent.click(screen.getByRole('button', { name: /enregistrer/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalide ou expiré/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: /demander un nouveau lien/i })).toBeInTheDocument();
  });
});
