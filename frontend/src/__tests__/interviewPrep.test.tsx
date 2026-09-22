import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InterviewPrepPage } from '@/pages/InterviewPrep';
import api from '@/services/api';
import { applicationsService } from '@/services/applications.service';
import type { InterviewPrep, Application } from '@/types';

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/services/applications.service', () => ({
  applicationsService: {
    getAll: vi.fn(),
  },
}));

vi.mock('@/services/documents.service', () => ({
  documentsService: {
    getAll: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('@/services/interviewSimulation.service', () => ({
  interviewSimulationService: {
    getSessionsByApplication: vi.fn().mockResolvedValue([]),
    getSession: vi.fn(),
    startSession: vi.fn(),
    sendMessage: vi.fn(),
    deleteSession: vi.fn(),
  },
}));

const mockQuestions: InterviewPrep[] = [
  {
    id: 'q-1',
    userId: 'user-1',
    question: 'Parlez-moi de votre plus grand défi technique ?',
    answer: 'Lors de mon projet de fin d\'études, j\'ai dû migrer une base SQL vers un cluster haute disponibilité.',
    category: 'TECHNICAL',
    notes: 'Mentionner Docker et Kubernetes',
    isFavorite: true,
    createdAt: '2026-03-01T10:00:00.000Z',
    updatedAt: '2026-03-01T10:00:00.000Z',
  },
  {
    id: 'q-2',
    userId: 'user-1',
    question: 'Comment gérez-vous un désaccord avec un collègue ?',
    answer: 'J\'écoute d\'abord son point de vue, puis je propose un test A/B pour comparer objectivement les solutions.',
    category: 'BEHAVIORAL',
    notes: '',
    isFavorite: false,
    createdAt: '2026-03-02T10:00:00.000Z',
    updatedAt: '2026-03-02T10:00:00.000Z',
  },
];

const mockApplications: Application[] = [
  {
    id: 'app-stripe',
    userId: 'user-1',
    companyName: 'Stripe',
    position: 'Software Engineer Intern',
    jobType: 'STAGE',
    location: 'Paris, France',
    status: 'INTERVIEW_SCHEDULED',
    applicationDate: '2026-03-01T10:00:00.000Z',
    createdAt: '2026-03-01T10:00:00.000Z',
    updatedAt: '2026-03-01T10:00:00.000Z',
  },
];

function renderWithProviders(ui: React.ReactElement, initialRoute: string = '/interview-prep') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Page: InterviewPrepPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.get).mockResolvedValue({ data: mockQuestions });
    vi.mocked(applicationsService.getAll).mockResolvedValue({
      data: mockApplications,
      total: 1,
      page: 1,
      pageSize: 100,
      totalPages: 1,
    });
  });

  it('renders questions list with favorite questions highlighted', async () => {
    renderWithProviders(<InterviewPrepPage />);

    await waitFor(() => {
      expect(screen.getByText('Parlez-moi de votre plus grand défi technique ?')).toBeInTheDocument();
      expect(screen.getByText('Comment gérez-vous un désaccord avec un collègue ?')).toBeInTheDocument();
      expect(screen.getByText(/Questions clés favorites/i)).toBeInTheDocument();
    });
  });

  it('filters questions by category chips', async () => {
    renderWithProviders(<InterviewPrepPage />);

    await waitFor(() => {
      expect(screen.getByText('Parlez-moi de votre plus grand défi technique ?')).toBeInTheDocument();
    });

    const technicalChip = screen.getByRole('button', { name: /Technique \(/i });
    fireEvent.click(technicalChip);

    await waitFor(() => {
      expect(screen.getByText('Parlez-moi de votre plus grand défi technique ?')).toBeInTheDocument();
      expect(screen.queryByText('Comment gérez-vous un désaccord avec un collègue ?')).not.toBeInTheDocument();
    });
  });

  it('opens create question dialog with STAR method guide toggle', async () => {
    renderWithProviders(<InterviewPrepPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Nouvelle question/i })).toBeInTheDocument();
    });

    const addBtn = screen.getByRole('button', { name: /Nouvelle question/i });
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(screen.getByText('Nouvelle question type')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Méthode STAR/i })).toBeInTheDocument();
    });

    // Toggle STAR guide
    const starBtn = screen.getByRole('button', { name: /Méthode STAR/i });
    fireEvent.click(starBtn);

    await waitFor(() => {
      expect(screen.getByText(/Structurez avec la méthode STAR/i)).toBeInTheDocument();
      expect(screen.getByText(/S \(Situation\)/i)).toBeInTheDocument();
    });
  });

  it('renders Simulation IA tab when navigated with tab=simulation query param', async () => {
    renderWithProviders(<InterviewPrepPage />, '/interview-prep?tab=simulation');

    await waitFor(() => {
      expect(screen.getByText(/Candidature ciblée pour l'entretien/i)).toBeInTheDocument();
      expect(screen.getByText(/Sélectionnez une candidature/i)).toBeInTheDocument();
    });
  });
});
