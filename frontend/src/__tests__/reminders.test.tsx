import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RemindersPage } from '@/pages/Reminders';
import { remindersService } from '@/services/reminders.service';
import type { Reminder } from '@/types';

vi.mock('@/services/reminders.service', () => ({
  remindersService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    triggerEmailCheck: vi.fn().mockResolvedValue({}),
  },
}));

const mockReminders: Reminder[] = [
  {
    id: 'rem-1',
    userId: 'user-1',
    title: 'Relance retardée Cabinet X',
    description: 'En retard depuis 3 jours',
    type: 'FOLLOW_UP',
    dueDate: '2026-01-10T10:00:00.000Z',
    isCompleted: false,
    createdAt: '2026-01-01T10:00:00.000Z',
  },
  {
    id: 'rem-2',
    userId: 'user-1',
    title: 'Entretien RH Alan',
    description: 'Préparer questions culture fit',
    type: 'INTERVIEW',
    dueDate: new Date().toISOString(),
    isCompleted: false,
    createdAt: '2026-01-01T10:00:00.000Z',
  },
  {
    id: 'rem-3',
    userId: 'user-1',
    title: 'Dossier Doctolib archivé',
    description: 'Offre déclinée',
    type: 'OTHER',
    dueDate: '2026-01-05T10:00:00.000Z',
    isCompleted: true,
    createdAt: '2026-01-01T10:00:00.000Z',
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

describe('Page: RemindersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(remindersService.getAll).mockResolvedValue(mockReminders);
  });

  it('renders reminders page with KPIs and chronological sections', async () => {
    renderWithProviders(<RemindersPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Rappels & Relances/i })).toBeInTheDocument();
      expect(screen.getByText('Relance retardée Cabinet X')).toBeInTheDocument();
      expect(screen.getByText('Entretien RH Alan')).toBeInTheDocument();
      expect(screen.getByText('Dossier Doctolib archivé')).toBeInTheDocument();
    });

    expect(screen.getAllByText(/En retard/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Aujourd'hui/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Terminés/i).length).toBeGreaterThanOrEqual(1);
  });

  it('filters reminders by search query', async () => {
    renderWithProviders(<RemindersPage />);

    await waitFor(() => {
      expect(screen.getByText('Relance retardée Cabinet X')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Rechercher un rappel/i);
    fireEvent.change(searchInput, { target: { value: 'Alan' } });

    await waitFor(() => {
      expect(screen.queryByText('Relance retardée Cabinet X')).not.toBeInTheDocument();
      expect(screen.getByText('Entretien RH Alan')).toBeInTheDocument();
    });
  });

  it('toggles completion status of a reminder when clicking the completion circle', async () => {
    renderWithProviders(<RemindersPage />);

    await waitFor(() => {
      expect(screen.getByText('Entretien RH Alan')).toBeInTheDocument();
    });

    const markButtons = screen.getAllByTitle('Marquer comme fait');
    fireEvent.click(markButtons[0]);

    await waitFor(() => {
      expect(remindersService.update).toHaveBeenCalled();
    });
  });

  it('opens and cancels create reminder dialog', async () => {
    renderWithProviders(<RemindersPage />);

    const newBtn = await screen.findByRole('button', { name: /Nouveau rappel/i });
    fireEvent.click(newBtn);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: 'Nouveau rappel' })).toBeInTheDocument();
    });

    const cancelBtn = screen.getByRole('button', { name: /Annuler/i });
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByRole('heading', { level: 2, name: 'Nouveau rappel' })).not.toBeInTheDocument();
    });
  });
});
