import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EmailVerifiedGuard } from '@/components/EmailVerifiedGuard';
import { EmailVerificationBanner } from '@/components/EmailVerificationBanner';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth.service';
import type { User } from '@/types';

// Mock authService
vi.mock('@/services/auth.service', () => ({
  authService: {
    resendVerification: vi.fn(),
  },
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockUser: User = {
  id: 'user-456',
  email: 'candidate@ecole.fr',
  firstName: 'Sarah',
  lastName: 'Connor',
  emailNotifications: true,
  relanceFrequency: 7,
  emailVerified: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('Component: EmailVerifiedGuard', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it('renders children directly when email is verified', () => {
    useAuthStore.getState().setAuth({ ...mockUser, emailVerified: true }, 'fake-token');

    render(
      <EmailVerifiedGuard>
        <button>Créer une candidature</button>
      </EmailVerifiedGuard>
    );

    expect(screen.getByText('Créer une candidature')).toBeInTheDocument();
    expect(screen.queryByText(/veuillez vérifier votre adresse email/i)).not.toBeInTheDocument();
  });

  it('renders custom fallback when provided and email is not verified', () => {
    useAuthStore.getState().setAuth({ ...mockUser, emailVerified: false }, 'fake-token');

    render(
      <EmailVerifiedGuard fallback={<span>Action indisponible</span>}>
        <button>Créer une candidature</button>
      </EmailVerifiedGuard>
    );

    expect(screen.getByText('Action indisponible')).toBeInTheDocument();
    expect(screen.queryByText('Créer une candidature')).not.toBeInTheDocument();
  });

  it('renders disabled container with opacity when unverified and no fallback provided', () => {
    useAuthStore.getState().setAuth({ ...mockUser, emailVerified: false }, 'fake-token');

    const { container } = render(
      <EmailVerifiedGuard>
        <button>Créer une candidature</button>
      </EmailVerifiedGuard>
    );

    expect(screen.getByText('Créer une candidature')).toBeInTheDocument();
    const wrapper = container.querySelector('.cursor-not-allowed.opacity-60');
    expect(wrapper).toBeInTheDocument();
  });
});

describe('Component: EmailVerificationBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().logout();
  });

  it('renders nothing when no user is logged in', () => {
    const { container } = render(<EmailVerificationBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when user email is already verified', () => {
    useAuthStore.getState().setAuth({ ...mockUser, emailVerified: true }, 'fake-token');
    const { container } = render(<EmailVerificationBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders warning banner with user email address when unverified', () => {
    useAuthStore.getState().setAuth({ ...mockUser, emailVerified: false }, 'fake-token');
    render(<EmailVerificationBanner />);

    expect(screen.getByText(/Vérification requise/i)).toBeInTheDocument();
    expect(screen.getByText('candidate@ecole.fr')).toBeInTheDocument();
    expect(screen.getByText('Renvoyer le lien')).toBeInTheDocument();
  });

  it('allows dismissing the banner when clicking the close button', () => {
    useAuthStore.getState().setAuth({ ...mockUser, emailVerified: false }, 'fake-token');
    render(<EmailVerificationBanner />);

    const closeBtn = screen.getByRole('button', { name: /fermer la bannière/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByText(/Vérification requise/i)).not.toBeInTheDocument();
  });

  it('triggers authService.resendVerification upon clicking resend button', async () => {
    vi.mocked(authService.resendVerification).mockResolvedValueOnce({} as any);
    useAuthStore.getState().setAuth({ ...mockUser, emailVerified: false }, 'fake-token');

    render(<EmailVerificationBanner />);

    const resendBtn = screen.getByText('Renvoyer le lien');
    fireEvent.click(resendBtn);

    await waitFor(() => {
      expect(authService.resendVerification).toHaveBeenCalledTimes(1);
    });
  });
});

describe('Component: Footer', () => {
  it('renders modern footer with brand, operational status, and legal links', async () => {
    const { Footer } = await import('@/components/layout/Footer');
    const { MemoryRouter } = await import('react-router-dom');

    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    expect(screen.getByText('TrackMyApps')).toBeInTheDocument();
    expect(screen.getByText('v1.2')).toBeInTheDocument();
    expect(screen.getByText('Systèmes opérationnels')).toBeInTheDocument();
    expect(screen.getByText('Politique de confidentialité')).toBeInTheDocument();
    expect(screen.getByText('Conditions générales d\'utilisation')).toBeInTheDocument();
    expect(screen.getByText(/Tous droits réservés/i)).toBeInTheDocument();
  });
});

