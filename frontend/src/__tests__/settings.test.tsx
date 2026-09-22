import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SettingsPage } from '@/pages/Settings';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';
import type { User } from '@/types';

vi.mock('@/services/auth.service', () => ({
  authService: {
    updateProfile: vi.fn(),
    updatePassword: vi.fn(),
    deleteAccount: vi.fn(),
  },
}));

const mockUser: User = {
  id: 'user-settings-1',
  email: 'emma.roux@polytechnique.edu',
  firstName: 'Emma',
  lastName: 'Roux',
  school: 'Polytechnique',
  fieldOfStudy: 'Informatique',
  graduationYear: 2026,
  emailNotifications: true,
  relanceFrequency: 7,
  emailVerified: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Page: SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: mockUser,
      token: 'mock-token',
      isAuthenticated: true,
    });
    vi.mocked(authService.updateProfile).mockResolvedValue({
      ...mockUser,
      firstName: 'Emma-Louise',
    });
  });

  it('renders settings page with profile inputs and user initials', async () => {
    renderWithProviders(<SettingsPage />);

    expect(screen.getByRole('heading', { level: 1, name: /Paramètres/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Emma')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Roux')).toBeInTheDocument();
    expect(screen.getByDisplayValue('emma.roux@polytechnique.edu')).toBeInTheDocument();
    expect(screen.getByText('ER')).toBeInTheDocument(); // Initials
  });

  it('switches between navigation tabs', async () => {
    renderWithProviders(<SettingsPage />);

    // Click on Compte & Sécurité
    const accountTabBtns = screen.getAllByText(/Compte & Sécurité/i);
    fireEvent.click(accountTabBtns[0]);

    await waitFor(() => {
      expect(screen.getByText(/Mot de passe de connexion/i)).toBeInTheDocument();
      expect(screen.getByText(/Portabilité des données \(RGPD\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Zone de danger/i)).toBeInTheDocument();
    });

    // Click on Notifications
    const notifTabBtns = screen.getAllByText(/Notifications/i);
    fireEvent.click(notifTabBtns[0]);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Préférences de notification/i })).toBeInTheDocument();
      expect(screen.getByText(/Fréquence des relances suggérées/i)).toBeInTheDocument();
    });

    // Click on Apparence
    const appearanceTabBtns = screen.getAllByText(/Apparence/i);
    fireEvent.click(appearanceTabBtns[0]);

    await waitFor(() => {
      expect(screen.getByText(/Thème de l'interface/i)).toBeInTheDocument();
      expect(screen.getByText('Clair')).toBeInTheDocument();
      expect(screen.getByText('Sombre')).toBeInTheDocument();
    });
  });

  it('saves updated profile data when clicking save button', async () => {
    renderWithProviders(<SettingsPage />);

    const firstNameInput = screen.getByDisplayValue('Emma');
    fireEvent.change(firstNameInput, { target: { value: 'Emma-Louise' } });

    const saveBtn = screen.getByRole('button', { name: /Enregistrer le profil/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(authService.updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'Emma-Louise',
        })
      );
    });
  });
});
