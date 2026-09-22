import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardPage } from '@/pages/Dashboard';
import { AnalyticsPage } from '@/pages/Analytics';
import { SettingsPage } from '@/pages/Settings';
import {
  generateIcsContent,
  downloadIcsFile,
  getGoogleCalendarUrl,
  getOutlookCalendarUrl,
} from '@/lib/calendarExport';
import { analyticsService } from '@/services/analytics.service';
import { remindersService } from '@/services/reminders.service';
import { applicationsService } from '@/services/applications.service';
import { useAuthStore } from '@/store/authStore';
import type { DashboardStats, Reminder, User } from '@/types';

vi.mock('@/services/analytics.service', () => ({
  analyticsService: {
    getDashboard: vi.fn(),
    getStats: vi.fn(),
    getTimeline: vi.fn(),
  },
}));

vi.mock('@/services/reminders.service', () => ({
  remindersService: {
    getUpcoming: vi.fn(),
    getAll: vi.fn(),
  },
}));

vi.mock('@/services/applications.service', () => ({
  applicationsService: {
    getAll: vi.fn(),
  },
}));

const mockUser: User = {
  id: 'user-sprint4',
  email: 'test@sprint4.fr',
  firstName: 'Camille',
  lastName: 'Dupont',
  school: 'Centrale',
  fieldOfStudy: 'Data & AI',
  emailNotifications: true,
  relanceFrequency: 7,
  emailVerified: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const mockDashboardStats: DashboardStats = {
  totalApplications: 6, // < 10 for small volume testing
  sentThisMonth: 4,
  scheduledInterviews: 1,
  pendingReminders: 2,
  responseRate: 20,
  statusOverview: {
    DRAFT: 1,
    SENT: 2,
    VIEWED: 1,
    INTERVIEW_SCHEDULED: 1,
    AWAITING_RESPONSE: 0,
    REJECTED: 0,
    ACCEPTED: 1,
    GHOSTED: 0,
  },
  byStatus: {
    DRAFT: 1,
    SENT: 2,
    VIEWED: 1,
    INTERVIEW_SCHEDULED: 1,
    AWAITING_RESPONSE: 0,
    REJECTED: 0,
    ACCEPTED: 1,
    GHOSTED: 0,
  },
  recentApplications: [
    {
      id: 'app-s4-1',
      userId: 'user-sprint4',
      companyName: 'Datadog',
      position: 'Frontend Engineer',
      jobType: 'CDI',
      location: 'Paris',
      status: 'INTERVIEW_SCHEDULED',
      interviewDate: '2026-03-30T10:00:00.000Z',
      applicationDate: '2026-03-01T10:00:00.000Z',
      createdAt: '2026-03-01T10:00:00.000Z',
      updatedAt: '2026-03-01T10:00:00.000Z',
    },
  ],
  upcomingInterviews: [
    {
      id: 'app-s4-1',
      userId: 'user-sprint4',
      companyName: 'Datadog',
      position: 'Frontend Engineer',
      jobType: 'CDI',
      location: 'Paris',
      status: 'INTERVIEW_SCHEDULED',
      interviewDate: '2026-03-30T10:00:00.000Z',
      applicationDate: '2026-03-01T10:00:00.000Z',
      createdAt: '2026-03-01T10:00:00.000Z',
      updatedAt: '2026-03-01T10:00:00.000Z',
    },
  ],
};

const mockReminders: Reminder[] = [
  {
    id: 'rem-s4-1',
    userId: 'user-sprint4',
    applicationId: 'app-s4-1',
    title: 'Relance Datadog',
    description: 'Relancer suite au premier tour',
    type: 'FOLLOW_UP',
    dueDate: '2026-03-28T09:00:00.000Z',
    isCompleted: false,
    createdAt: '2026-03-20T10:00:00.000Z',
    application: {
      id: 'app-s4-1',
      companyName: 'Datadog',
      position: 'Frontend Engineer',
      status: 'INTERVIEW_SCHEDULED',
    },
  },
];

function renderWithProviders(ui: React.ReactElement, initialRoute = '/') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Sprint 4 - TICK-403: Calendar Export Utilities', () => {
  beforeEach(() => {
    window.URL.createObjectURL = vi.fn(() => 'blob:mock-calendar-url');
    window.URL.revokeObjectURL = vi.fn();
  });

  it('generates standard RFC 5545 iCalendar content with BEGIN:VCALENDAR and VEVENT', () => {
    const events = [
      {
        title: 'Entretien RH Datadog',
        description: 'Échange visio avec recruteur',
        startDate: new Date('2026-03-30T14:00:00.000Z'),
        durationMinutes: 45,
        location: 'Google Meet',
      },
    ];

    const ics = generateIcsContent(events);

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('PRODID:-//TrackMyApps//Job Application Tracker//FR');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('SUMMARY:Entretien RH Datadog');
    expect(ics).toContain('DESCRIPTION:Échange visio avec recruteur');
    expect(ics).toContain('LOCATION:Google Meet');
    expect(ics).toContain('END:VEVENT');
    expect(ics).toContain('END:VCALENDAR');
  });

  it('generates valid Google Calendar action template URL', () => {
    const event = {
      title: 'Entretien Technique Doctolib',
      description: 'Test technique React',
      startDate: new Date('2026-04-02T10:00:00.000Z'),
      durationMinutes: 60,
      location: 'Paris',
    };

    const url = getGoogleCalendarUrl(event);

    expect(url).toContain('https://calendar.google.com/calendar/render?action=TEMPLATE');
    expect(url).toContain('text=Entretien+Technique+Doctolib');
    expect(url).toContain('details=Test+technique+React');
    expect(url).toContain('location=Paris');
  });

  it('generates valid Outlook Web deep link URL', () => {
    const event = {
      title: 'Entretien Final Qonto',
      description: 'Rencontre avec le VP Engineering',
      startDate: new Date('2026-04-05T15:00:00.000Z'),
      durationMinutes: 30,
    };

    const url = getOutlookCalendarUrl(event);

    expect(url).toContain('https://outlook.live.com/calendar/0/deeplink/compose');
    expect(url).toContain('subject=Entretien+Final+Qonto');
    expect(url).toContain('body=Rencontre+avec+le+VP+Engineering');
  });

  it('triggers browser file download when downloadIcsFile is called', () => {
    const createElementSpy = vi.spyOn(document, 'createElement');
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    const removeChildSpy = vi.spyOn(document.body, 'removeChild');

    downloadIcsFile('test.ics', 'BEGIN:VCALENDAR\nEND:VCALENDAR');

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
  });
});

describe('Sprint 4 - TICK-401: Dashboard Action Plan & KPIs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: mockUser, token: 'fake-token', isAuthenticated: true });
    vi.mocked(analyticsService.getDashboard).mockResolvedValue(mockDashboardStats);
    vi.mocked(remindersService.getUpcoming).mockResolvedValue(mockReminders);
    vi.mocked(applicationsService.getAll).mockResolvedValue({
      data: mockDashboardStats.recentApplications as any,
      total: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    });
  });

  it('renders the central "Plan d\'action du jour" cockpit instead of raw statistics', async () => {
    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Plan d'action du jour")).toBeInTheDocument();
    });

    // Check the 4 operational KPIs
    expect(screen.getByText(/Candidatures actives/i)).toBeInTheDocument();
    expect(screen.getByText(/Relances à effectuer/i)).toBeInTheDocument();
    expect(screen.getByText(/Prochain entretien/i)).toBeInTheDocument();
    expect(screen.getByText(/Offres & Réussites/i)).toBeInTheDocument();

    // Check quick CTA for AI simulator
    expect(screen.getByText(/Simulateur IA/i)).toBeInTheDocument();
    expect(screen.getByText(/Nouvelle candidature/i)).toBeInTheDocument();
  });

  it('verifies redundant 8-status grid is completely removed from the dashboard', async () => {
    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Plan d'action du jour")).toBeInTheDocument();
    });

    // The heading "Répartition par statut" or "8 statuts" must NOT exist
    expect(screen.queryByText(/Répartition par statut/i)).toBeNull();
    expect(screen.queryByText(/Vue d'ensemble par statut/i)).toBeNull();
  });
});

describe('Sprint 4 - TICK-402: Benevolent Analytics for Small Volumes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(analyticsService.getDashboard).mockResolvedValue(mockDashboardStats);
    vi.mocked(analyticsService.getStats).mockResolvedValue({
      byJobType: { CDI: 4, STAGE: 2 },
      byStatus: mockDashboardStats.statusOverview,
      monthlyTrends: [],
      responseRateTrend: [],
    } as any);
    vi.mocked(analyticsService.getTimeline).mockResolvedValue([]);
  });

  it('displays encouraging banner when user has fewer than 10 applications', async () => {
    renderWithProviders(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Vos premières tendances prennent forme !/i)).toBeInTheDocument();
      expect(screen.getByText(/Vous débutez votre recherche/i)).toBeInTheDocument();
    });
  });
});

describe('Sprint 4 - TICK-403: Calendar Synchronisation in Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: mockUser, token: 'fake-token', isAuthenticated: true });
    vi.mocked(remindersService.getAll).mockResolvedValue(mockReminders);
  });

  it('renders Calendar Synchronization card in Settings account tab', async () => {
    renderWithProviders(<SettingsPage />);

    // Click on Compte & Sécurité tab (first one found between mobile and desktop nav)
    const accountTabs = screen.getAllByRole('button', { name: /Compte & Sécurité/i });
    fireEvent.click(accountTabs[0]);

    await waitFor(() => {
      expect(screen.getByText(/Synchronisation Agenda & Calendrier \(\.ics\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Télécharger mon agenda \(\.ics\)/i)).toBeInTheDocument();
    });
  });
});
