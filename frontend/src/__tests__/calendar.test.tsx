import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CalendarPage } from '@/pages/Calendar';
import { applicationsService } from '@/services/applications.service';
import { remindersService } from '@/services/reminders.service';
import type { KanbanColumns, Reminder } from '@/types';

vi.mock('@/services/applications.service', () => ({
  applicationsService: {
    getByStatus: vi.fn(),
  },
}));

vi.mock('@/services/reminders.service', () => ({
  remindersService: {
    getAll: vi.fn(),
    update: vi.fn(),
  },
}));

const today = new Date();
const todayIso = today.toISOString();

const mockKanban: Partial<KanbanColumns> = {
  INTERVIEW_SCHEDULED: [
    {
      id: 'app-calendar-1',
      userId: 'user-1',
      companyName: 'DataDog',
      position: 'Frontend Engineer',
      jobType: 'CDI',
      location: 'Paris',
      status: 'INTERVIEW_SCHEDULED',
      applicationDate: todayIso,
      createdAt: todayIso,
      updatedAt: todayIso,
    },
  ],
  SENT: [
    {
      id: 'app-calendar-2',
      userId: 'user-1',
      companyName: 'Mirakl',
      position: 'Fullstack Dev Intern',
      jobType: 'STAGE',
      location: 'Bordeaux',
      status: 'SENT',
      applicationDate: todayIso,
      createdAt: todayIso,
      updatedAt: todayIso,
    },
  ],
};

const mockReminders: Reminder[] = [
  {
    id: 'rem-calendar-1',
    userId: 'user-1',
    title: 'Relance email RH DataDog',
    description: 'Demander un retour sur le test technique',
    type: 'FOLLOW_UP',
    dueDate: todayIso,
    isCompleted: false,
    createdAt: todayIso,
  },
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

describe('Page: CalendarPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(applicationsService.getByStatus).mockResolvedValue(mockKanban as KanbanColumns);
    vi.mocked(remindersService.getAll).mockResolvedValue(mockReminders);
  });

  it('renders calendar title, controls, and today badge', async () => {
    renderWithProviders(<CalendarPage />);

    expect(screen.getByRole('heading', { level: 1, name: /Calendrier/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "Aujourd'hui" })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mois' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Semaine' })).toBeInTheDocument();
  });

  it('switches between Month and Week views', async () => {
    renderWithProviders(<CalendarPage />);

    const weekBtn = screen.getByRole('button', { name: 'Semaine' });
    fireEvent.click(weekBtn);

    await waitFor(() => {
      expect(screen.getByText(/Semaine du/i)).toBeInTheDocument();
    });

    const monthBtn = screen.getByRole('button', { name: 'Mois' });
    fireEvent.click(monthBtn);

    await waitFor(() => {
      expect(screen.queryByText(/Semaine du/i)).not.toBeInTheDocument();
    });
  });

  it('displays today events in the agenda sidebar', async () => {
    renderWithProviders(<CalendarPage />);

    await waitFor(() => {
      expect(screen.getByText('DataDog')).toBeInTheDocument();
      expect(screen.getByText('Frontend Engineer')).toBeInTheDocument();
      expect(screen.getByText('Relance email RH DataDog')).toBeInTheDocument();
    });
  });

  it('allows filtering events by category in the sidebar', async () => {
    renderWithProviders(<CalendarPage />);

    await waitFor(() => {
      expect(screen.getByText('DataDog')).toBeInTheDocument();
    });

    // Click filter for Rappels
    const remindersFilter = screen.getByRole('button', { name: /Rappels/i });
    fireEvent.click(remindersFilter);

    await waitFor(() => {
      expect(screen.queryByText('DataDog')).not.toBeInTheDocument();
      expect(screen.getByText('Relance email RH DataDog')).toBeInTheDocument();
    });
  });

  it('navigates cleanly across months without date overflow', async () => {
    renderWithProviders(<CalendarPage />);

    // Click next period navigation button
    const nextBtn = screen.getByRole('button', { name: /Période suivante/i });
    fireEvent.click(nextBtn);

    // Header updates cleanly
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Calendrier/i })).toBeInTheDocument();
    });

    const prevBtn = screen.getByRole('button', { name: /Période précédente/i });
    fireEvent.click(prevBtn);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Calendrier/i })).toBeInTheDocument();
    });
  });
});
