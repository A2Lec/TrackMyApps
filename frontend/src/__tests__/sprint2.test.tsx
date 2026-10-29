import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FollowUpTemplatesDialog } from '@/components/FollowUpTemplatesDialog';
import { ApplicationJournal } from '@/components/ApplicationJournal';
import { ApplicationDetailPage } from '@/pages/ApplicationDetail';
import { RemindersPage } from '@/pages/Reminders';
import { applicationsService } from '@/services/applications.service';
import { remindersService } from '@/services/reminders.service';
import type { Application, Reminder } from '@/types';
import type { ExchangeDebrief } from '@/lib/journal';

// Mock services
vi.mock('@/services/applications.service', () => ({
  applicationsService: {
    getById: vi.fn(),
    getAll: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    updateStatus: vi.fn(),
  },
}));

vi.mock('@/services/reminders.service', () => ({
  remindersService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    markAsCompleted: vi.fn(),
    triggerEmailCheck: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('@/services/documents.service', () => ({
  documentsService: {
    getAll: vi.fn().mockResolvedValue([]),
    getViewUrl: vi.fn().mockReturnValue('#'),
  },
}));

const mockApplication: Application = {
  id: 'app-sprint2',
  userId: 'user-1',
  companyName: 'Stripe France',
  position: 'Frontend Engineer',
  jobType: 'CDI',
  location: 'Paris',
  status: 'SENT',
  applicationDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
  notes: '',
  events: [
    {
      id: 'evt-1',
      applicationId: 'app-sprint2',
      type: 'SENT',
      description: 'Candidature transmise',
      createdAt: new Date().toISOString(),
    },
  ],
  reminders: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function renderWithProviders(ui: React.ReactElement, initialRoute: string = '/') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Sprint 2: Décloisonnement des Rappels & Workflow Candidature 360°', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('TICK-202: Modèles d\'emails de relance (FollowUpTemplatesDialog)', () => {
    it('renders the follow-up templates modal with customized company and position', async () => {
      // Mock clipboard
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: { writeText: writeTextMock },
      });

      renderWithProviders(
        <FollowUpTemplatesDialog
          open={true}
          companyName="Doctolib"
          position="Product Designer"
        />
      );

      // Verify modal title
      expect(screen.getByText("Modèles d'emails de relance")).toBeInTheDocument();

      // Check that the template content replaced placeholders with company & position
      expect(screen.getAllByText(/Product Designer/i).length).toBeGreaterThanOrEqual(1);

      // Click copy button
      const copyBtn = screen.getByRole('button', { name: /Copier le modèle/i });
      fireEvent.click(copyBtn);

      await waitFor(() => {
        expect(writeTextMock).toHaveBeenCalled();
        expect(writeTextMock.mock.calls[0][0]).toContain('Product Designer');
      });
    });
  });

  describe('TICK-203: Journal de bord des échanges (ApplicationJournal)', () => {
    it('displays empty state and opens dialog to log a new exchange', async () => {
      const onSaveMock = vi.fn().mockResolvedValue(undefined);

      renderWithProviders(
        <ApplicationJournal
          application={mockApplication}
          exchanges={[]}
          onSaveExchanges={onSaveMock}
        />
      );

      expect(screen.getByText('Journal de bord des échanges (0)')).toBeInTheDocument();
      expect(
        screen.getByText(/Aucun échange consigné pour cette candidature/i)
      ).toBeInTheDocument();

      // Click Noter un échange
      const addBtn = screen.getByRole('button', { name: /Noter mon premier échange/i });
      fireEvent.click(addBtn);

      await waitFor(() => {
        expect(screen.getByText('Noter un nouvel échange')).toBeInTheDocument();
      });

      // Fill form
      fireEvent.change(screen.getByPlaceholderText(/ex: Sophie Bernard/i), {
        target: { value: 'Marc RH' },
      });
      fireEvent.change(
        screen.getByPlaceholderText(/Questions techniques posées/i),
        {
          target: { value: 'Entretien découverte et culture fit 30min' },
        }
      );
      fireEvent.change(screen.getByPlaceholderText(/ex: Réponse RH d'ici vendredi/i), {
        target: { value: 'Test technique à recevoir lundi' },
      });

      // Submit
      const submitBtn = screen.getByRole('button', { name: /Enregistrer dans le journal/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(onSaveMock).toHaveBeenCalled();
        const savedList: ExchangeDebrief[] = onSaveMock.mock.calls[0][0];
        expect(savedList).toHaveLength(1);
        expect(savedList[0].interlocutorName).toBe('Marc RH');
        expect(savedList[0].notes).toBe('Entretien découverte et culture fit 30min');
        expect(savedList[0].nextSteps).toBe('Test technique à recevoir lundi');
      });
    });

    it('renders existing exchange cards with details and feeling', () => {
      const mockExchanges: ExchangeDebrief[] = [
        {
          id: 'exc-1',
          date: '2026-09-23',
          type: 'VISIO',
          interlocutorName: 'Alice Tech',
          interlocutorRoleOrLink: 'Lead Frontend',
          notes: 'Discussion architecture React 19 et Vite',
          feeling: 'POSITIVE',
          nextSteps: 'Proposition de contrat sous 48h',
          createdAt: '2026-09-23T10:00:00.000Z',
        },
      ];

      renderWithProviders(
        <ApplicationJournal
          application={mockApplication}
          exchanges={mockExchanges}
          onSaveExchanges={vi.fn()}
        />
      );

      expect(screen.getByText('Alice Tech')).toBeInTheDocument();
      expect(screen.getByText('Lead Frontend')).toBeInTheDocument();
      expect(screen.getByText(/Discussion architecture React 19 et Vite/i)).toBeInTheDocument();
      expect(screen.getByText(/Proposition de contrat sous 48h/i)).toBeInTheDocument();
      expect(screen.getByText('Positif / Confiant')).toBeInTheDocument();
      expect(screen.getByText('Entretien Visio')).toBeInTheDocument();
    });
  });

  describe('TICK-203 & TICK-201: ApplicationDetail Hub & Direct Reminder creation', () => {
    it('switches between Details and Journal tabs and provides direct reminder action', async () => {
      vi.mocked(applicationsService.getById).mockResolvedValue({
        ...mockApplication,
        notes: JSON.stringify({
          generalNotes: 'Note de cadrage générale',
          exchanges: [
            {
              id: 'exc-det-1',
              date: '2026-09-22',
              type: 'TECH',
              interlocutorName: 'David Dev',
              notes: 'Test pratique complété avec succès',
              feeling: 'POSITIVE',
              createdAt: '2026-09-22T10:00:00.000Z',
            },
          ],
        }),
      });

      renderWithProviders(
        <Routes>
          <Route path="/applications/:id" element={<ApplicationDetailPage />} />
        </Routes>,
        '/applications/app-sprint2'
      );

      await waitFor(() => {
        expect(screen.getAllByText(/Stripe France/i).length).toBeGreaterThanOrEqual(1);
      });

      // Check Tab trigger shows exchange count
      expect(screen.getByRole('tab', { name: /Journal des échanges/i })).toBeInTheDocument();

      // Check "+ Ajouter" in Reminders widget
      const addReminderBtn = screen.getByRole('button', { name: /Ajouter un rappel/i });
      fireEvent.click(addReminderBtn);

      await waitFor(() => {
        expect(screen.getByText(/Nouveau rappel pour Stripe France/i)).toBeInTheDocument();
      });

      // Quick preset J+7
      const j7Chip = screen.getByRole('button', { name: /⚡ Relance à J\+7/i });
      fireEvent.click(j7Chip);

      // Verify title input updated
      const titleInput = screen.getByDisplayValue(/Relancer Stripe France à J\+7/i);
      expect(titleInput).toBeInTheDocument();

      // Submit reminder
      vi.mocked(remindersService.create).mockResolvedValue({} as any);
      const submitReminderBtn = screen.getByRole('button', { name: /Créer le rappel/i });
      fireEvent.click(submitReminderBtn);

      await waitFor(() => {
        expect(remindersService.create).toHaveBeenCalledWith(
          expect.objectContaining({
            applicationId: 'app-sprint2',
            title: 'Relancer Stripe France à J+7',
            type: 'FOLLOW_UP',
          })
        );
      });
    });
  });

  describe('TICK-204 & TICK-202: Reminders View Switcher & Smart Follow-up Banner', () => {
    it('switches between List and Calendar views and shows Smart Follow-up banner', async () => {
      vi.mocked(remindersService.getAll).mockResolvedValue([
        {
          id: 'rem-sprint2-1',
          userId: 'user-1',
          title: 'Relancer Qonto',
          type: 'FOLLOW_UP',
          dueDate: new Date().toISOString(),
          isCompleted: false,
          createdAt: new Date().toISOString(),
          application: {
            id: 'app-qonto',
            companyName: 'Qonto',
            position: 'Fullstack Dev',
            status: 'SENT',
          },
        } as Reminder,
      ]);

      vi.mocked(applicationsService.getAll).mockResolvedValue({
        data: [
          {
            id: 'app-stale',
            userId: 'user-1',
            companyName: 'Datadog',
            position: 'DevOps Intern',
            jobType: 'STAGE',
            location: 'Paris',
            status: 'SENT',
            applicationDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            reminders: [], // No active reminders!
          } as Application,
        ],
        total: 1,
        page: 1,
        pageSize: 100,
        totalPages: 1,
      });

      renderWithProviders(<RemindersPage />);

      await waitFor(() => {
        expect(screen.getByText('Relancer Qonto')).toBeInTheDocument();
      });

      // TICK-201: Check linked application badge on reminder card
      expect(screen.getByText('Qonto')).toBeInTheDocument();
      expect(screen.getByText('Fullstack Dev')).toBeInTheDocument();
      expect(screen.getByText('Voir la candidature')).toBeInTheDocument();

      // TICK-202: Check Smart Follow-up banner appears for Datadog (>5 days without reminder)
      await waitFor(() => {
        expect(screen.getByText(/1 relance suggérée cette semaine/i)).toBeInTheDocument();
        expect(screen.getByText(/Planifier pour Datadog/i)).toBeInTheDocument();
      });

      // TICK-204: Check View Switcher
      const calendarViewBtn = screen.getByRole('button', { name: /Vue Calendrier/i });
      expect(calendarViewBtn).toBeInTheDocument();

      // Click Vue Calendrier
      fireEvent.click(calendarViewBtn);

      await waitFor(() => {
        // RemindersCalendarView rendered
        expect(screen.getByText(/Aujourd'hui/i)).toBeInTheDocument();
      });
    });
  });
});
