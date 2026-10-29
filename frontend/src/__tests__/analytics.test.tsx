import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnalyticsPage } from '@/pages/Analytics';
import { analyticsService } from '@/services/analytics.service';
import type { DashboardStats } from '@/types';

vi.mock('@/services/analytics.service', () => ({
  analyticsService: {
    getDashboard: vi.fn(),
    getStats: vi.fn(),
    getTimeline: vi.fn(),
  },
}));

const mockDashboard: DashboardStats = {
  totalApplications: 24,
  sentThisMonth: 10,
  scheduledInterviews: 5,
  pendingReminders: 2,
  responseRate: 40,
  statusOverview: {
    DRAFT: 2,
    SENT: 10,
    VIEWED: 3,
    INTERVIEW_SCHEDULED: 5,
    AWAITING_RESPONSE: 2,
    REJECTED: 1,
    ACCEPTED: 1,
    GHOSTED: 0,
  },
  byStatus: {
    DRAFT: 2,
    SENT: 10,
    VIEWED: 3,
    INTERVIEW_SCHEDULED: 5,
    AWAITING_RESPONSE: 2,
    REJECTED: 1,
    ACCEPTED: 1,
    GHOSTED: 0,
  },
  recentApplications: [],
  upcomingInterviews: [],
};

const mockStats = {
  byJobType: {
    STAGE: 14,
    ALTERNANCE: 6,
    CDI: 4,
  },
  avgResponseTime: 8,
};

const mockTimeline = [
  { date: '2026-03-01T00:00:00.000Z', count: 3 },
  { date: '2026-03-08T00:00:00.000Z', count: 7 },
];

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

describe('Page: AnalyticsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(analyticsService.getDashboard).mockResolvedValue(mockDashboard);
    vi.mocked(analyticsService.getStats).mockResolvedValue(mockStats as unknown as import('@/types').AnalyticsData);
    vi.mocked(analyticsService.getTimeline).mockResolvedValue(mockTimeline);
  });

  it('renders analytics cockpit with KPIs and conversion metrics', async () => {
    renderWithProviders(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Statistiques & Performance/i })).toBeInTheDocument();
      expect(screen.getByText('Total candidatures')).toBeInTheDocument();
      expect(screen.getByText('Entretiens obtenus')).toBeInTheDocument();
      expect(screen.getByText('Offres acceptées')).toBeInTheDocument();
      expect(screen.getByText('Taux de réponse')).toBeInTheDocument();
    });

    expect(screen.getByText('24')).toBeInTheDocument();
    expect(screen.getAllByText('40%').length).toBeGreaterThanOrEqual(1);
  });

  it('renders funnel diagnostic steps', async () => {
    renderWithProviders(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Étape 1 : Accès aux entretiens/i)).toBeInTheDocument();
      expect(screen.getByText(/Étape 2 : Transformation en offre/i)).toBeInTheDocument();
    });
  });

  it('changes timeline period filter when clicking period buttons', async () => {
    renderWithProviders(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '7 jours' })).toBeInTheDocument();
    });

    const sevenDaysBtn = screen.getByRole('button', { name: '7 jours' });
    fireEvent.click(sevenDaysBtn);

    await waitFor(() => {
      expect(analyticsService.getTimeline).toHaveBeenCalledWith('7d');
    });
  });
});
