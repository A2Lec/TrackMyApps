import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardPage } from '@/pages/Dashboard';
import { analyticsService } from '@/services/analytics.service';
import { remindersService } from '@/services/reminders.service';
import { useAuthStore } from '@/store/authStore';
import type { DashboardStats, Reminder, User } from '@/types';

vi.mock('@/services/analytics.service', () => ({
  analyticsService: {
    getDashboard: vi.fn(),
  },
}));

vi.mock('@/services/reminders.service', () => ({
  remindersService: {
    getUpcoming: vi.fn(),
  },
}));

const mockUser: User = {
  id: 'user-789',
  email: 'lucas@ecole.fr',
  firstName: 'Lucas',
  lastName: 'Martin',
  school: 'INSA Lyon',
  fieldOfStudy: 'Génie Logiciel',
  emailNotifications: true,
  relanceFrequency: 7,
  emailVerified: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const mockDashboardStats: DashboardStats = {
  totalApplications: 12,
  sentThisMonth: 8,
  scheduledInterviews: 2,
  pendingReminders: 3,
  responseRate: 25,
  statusOverview: {
    DRAFT: 1,
    SENT: 5,
    VIEWED: 3,
    INTERVIEW_SCHEDULED: 2,
    AWAITING_RESPONSE: 1,
    REJECTED: 0,
    ACCEPTED: 1,
    GHOSTED: 0,
  },
  byStatus: {
    DRAFT: 1,
    SENT: 5,
    VIEWED: 3,
    INTERVIEW_SCHEDULED: 2,
    AWAITING_RESPONSE: 1,
    REJECTED: 0,
    ACCEPTED: 1,
    GHOSTED: 0,
  },
  recentApplications: [
    {
      id: 'app-1',
      userId: 'user-789',
      companyName: 'Stripe',
      position: 'Software Engineer Intern',
      jobType: 'STAGE',
      location: 'Paris',
      status: 'INTERVIEW_SCHEDULED',
      applicationDate: '2026-03-01T10:00:00.000Z',
      createdAt: '2026-03-01T10:00:00.000Z',
      updatedAt: '2026-03-01T10:00:00.000Z',
    },
  ],
  upcomingInterviews: [
    {
      id: 'app-1',
      userId: 'user-789',
      companyName: 'Stripe',
      position: 'Software Engineer Intern',
      jobType: 'STAGE',
      location: 'Paris',
      status: 'INTERVIEW_SCHEDULED',
      interviewDate: '2026-03-25T14:00:00.000Z',
      applicationDate: '2026-03-01T10:00:00.000Z',
      createdAt: '2026-03-01T10:00:00.000Z',
      updatedAt: '2026-03-01T10:00:00.000Z',
    },
  ],
};

const mockReminders: Reminder[] = [
  {
    id: 'rem-1',
    userId: 'user-789',
    title: 'Relancer RH après entretien',
    type: 'RELANCE',
    dueDate: '2026-03-22T10:00:00.000Z',
    isCompleted: false,
    createdAt: '2026-03-15T10:00:00.000Z',
    application: {
      id: 'app-1',
      companyName: 'Stripe',
      position: 'Software Engineer Intern',
      status: 'INTERVIEW_SCHEDULED',
    },
  },
];

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Page: DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().setAuth(mockUser, 'test-jwt');
    vi.mocked(analyticsService.getDashboard).mockResolvedValue(mockDashboardStats);
    vi.mocked(remindersService.getUpcoming).mockResolvedValue(mockReminders);
  });

  it('renders personalized welcome greeting and user profile info', async () => {
    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Lucas/)).toBeInTheDocument();
      expect(screen.getByText('INSA Lyon')).toBeInTheDocument();
      expect(screen.getByText('Génie Logiciel')).toBeInTheDocument();
    });
  });

  it('renders Hero Focus Card when an upcoming interview exists', async () => {
    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Entretien imminent/i)).toBeInTheDocument();
      expect(screen.getByText(/Software Engineer Intern chez/i)).toBeInTheDocument();
      expect(screen.getAllByText('Stripe').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Simuler cet entretien/i)).toBeInTheDocument();
    });
  });

  it('renders operational action-plan KPI cards with correct metric values', async () => {
    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      // Candidatures actives
      expect(screen.getByText('Candidatures actives')).toBeInTheDocument();
      expect(screen.getAllByText('12').length).toBeGreaterThanOrEqual(1);

      // Relances à effectuer
      expect(screen.getByText('Relances à effectuer')).toBeInTheDocument();

      // Prochain entretien
      expect(screen.getByText('Prochain entretien')).toBeInTheDocument();

      // Offres & Réussites
      expect(screen.getByText('Offres & Réussites')).toBeInTheDocument();
      // Sillage: key figures on two digits
      expect(screen.getAllByText('01').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders Plan d action du jour card, agenda export, and quick action CTAs', async () => {
    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Plan d'action du jour")).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Simulateur IA/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Nouvelle candidature/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Ajouter à mon agenda/i })).toBeInTheDocument();
    });
  });

  it('renders "Tout est sous contrôle" fallback when no urgent interview or reminder', async () => {
    vi.mocked(analyticsService.getDashboard).mockResolvedValue({
      ...mockDashboardStats,
      upcomingInterviews: [],
    });
    vi.mocked(remindersService.getUpcoming).mockResolvedValue([]);

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Tout est sous contrôle !/i)).toBeInTheDocument();
    });
  });
});
