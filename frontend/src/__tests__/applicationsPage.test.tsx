import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApplicationsPage } from '@/pages/Applications';
import { applicationsService } from '@/services/applications.service';
import { useAuthStore } from '@/store/authStore';
import type { KanbanColumns, User } from '@/types';

vi.mock('@/services/applications.service', () => ({
  applicationsService: {
    getByStatus: vi.fn(),
    getAll: vi.fn(),
    create: vi.fn(),
    updateStatus: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/hooks/useMediaQuery', () => ({
  useMediaQuery: vi.fn(() => true), // Desktop view
}));

const mockUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  firstName: 'Jean',
  lastName: 'Dupont',
  emailNotifications: true,
  relanceFrequency: 7,
  emailVerified: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const mockKanbanData: KanbanColumns = {
  DRAFT: [
    {
      id: 'app-draft',
      userId: 'user-1',
      companyName: 'DraftCorp',
      position: 'Stagiaire',
      jobType: 'STAGE',
      location: 'Paris',
      status: 'DRAFT',
      applicationDate: '2026-03-01T10:00:00.000Z',
      createdAt: '2026-03-01T10:00:00.000Z',
      updatedAt: '2026-03-01T10:00:00.000Z',
    },
  ],
  SENT: [
    {
      id: 'app-sent',
      userId: 'user-1',
      companyName: 'Acme Corp',
      companyId: 'comp-acme',
      position: 'Frontend Dev',
      jobType: 'CDI',
      location: 'Paris',
      status: 'SENT',
      applicationDate: '2026-03-02T10:00:00.000Z',
      createdAt: '2026-03-02T10:00:00.000Z',
      updatedAt: '2026-03-02T10:00:00.000Z',
    },
  ],
  VIEWED: [
    {
      id: 'app-viewed',
      userId: 'user-1',
      companyName: 'ViewedCorp',
      position: 'Backend Dev',
      jobType: 'CDI',
      location: 'Lyon',
      status: 'VIEWED',
      applicationDate: '2026-03-03T10:00:00.000Z',
      createdAt: '2026-03-03T10:00:00.000Z',
      updatedAt: '2026-03-03T10:00:00.000Z',
    },
  ],
  INTERVIEW_SCHEDULED: [],
  AWAITING_RESPONSE: [],
  REJECTED: [],
  ACCEPTED: [],
  GHOSTED: [],
};

function renderWithClient(ui: React.ReactElement) {
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

describe('Sprint 1 - TICK-102 & TICK-104: ApplicationsPage Kanban & Delete Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().setAuth(mockUser, 'test-token');
    vi.mocked(applicationsService.getByStatus).mockResolvedValue(mockKanbanData);
    vi.mocked(applicationsService.delete).mockResolvedValue({ message: 'Deleted' } as any);
  });

  it('renders exactly the 5 canonical Kanban columns on desktop', async () => {
    renderWithClient(<ApplicationsPage />);

    await waitFor(() => {
      expect(screen.getByText('Candidatures')).toBeInTheDocument();
    });

    // 5 canonical headers
    expect(screen.getByRole('heading', { level: 3, name: 'Brouillon' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Envoyée' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Entretien' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Acceptée' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Refusée' })).toBeInTheDocument();

    // Must NOT have standalone legacy column headers
    expect(screen.queryByRole('heading', { level: 3, name: 'Vue' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 3, name: 'En attente' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 3, name: 'Sans réponse' })).not.toBeInTheDocument();

    // VIEWED application is displayed inside the Envoyée column with a 'Vue' substatus badge
    expect(screen.getByText('ViewedCorp')).toBeInTheDocument();
    expect(screen.getByText('Vue')).toBeInTheDocument();
  });

  it('TICK-104: displays a single, reassuring deletion dialog without the company deletion prompt', async () => {
    renderWithClient(<ApplicationsPage />);

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });

    // Click on the Acme Corp card to open quick view drawer
    const acmeCard = screen.getByText('Acme Corp');
    fireEvent.click(acmeCard);

    // In the drawer, click 'Supprimer'
    const drawerDeleteBtn = await screen.findByRole('button', { name: /supprimer/i });
    fireEvent.click(drawerDeleteBtn);

    // Verify confirmation modal
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Supprimer la candidature/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Êtes-vous sûr de vouloir supprimer votre candidature chez/i)
    ).toBeInTheDocument();

    // Must NOT contain the old dual-choice prompt:
    expect(
      screen.queryByText(/Souhaitez-vous également supprimer l'entreprise de votre carnet/i)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Supprimer la candidature et l'entreprise/i })
    ).not.toBeInTheDocument();

    // Confirm deletion
    const confirmBtn = screen.getByRole('button', { name: /^Supprimer$/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      // Must call delete with deleteCompany = false
      expect(applicationsService.delete).toHaveBeenCalledWith('app-sent', false);
    });
  });
});
