import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DocumentsPage } from '@/pages/Documents';
import { InterviewPrepPage } from '@/pages/InterviewPrep';
import { InterviewSimulation } from '@/components/InterviewSimulation';
import { documentsService } from '@/services/documents.service';
import { applicationsService } from '@/services/applications.service';
import { interviewSimulationService } from '@/services/interviewSimulation.service';
import api from '@/services/api';
import type { Document } from '@/types';

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/services/documents.service', () => ({
  documentsService: {
    getAll: vi.fn(),
    upload: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
    getViewUrl: vi.fn((id: string) => `http://mock-api/documents/view/${id}`),
    download: vi.fn(),
  },
}));

vi.mock('@/services/applications.service', () => ({
  applicationsService: {
    getAll: vi.fn(),
  },
}));

vi.mock('@/services/interviewSimulation.service', () => ({
  interviewSimulationService: {
    getSessionsByApplication: vi.fn(),
    getAllSessions: vi.fn(),
    getSession: vi.fn(),
    startSession: vi.fn(),
    sendMessage: vi.fn(),
    completeSession: vi.fn(),
    deleteSession: vi.fn(),
  },
}));

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

describe('Sprint 3: Features & Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('TICK-304: Inverse Document Traceability', () => {
    it('displays usage counts and linked companies for CV and cover letters', async () => {
      const mockDocsWithUsage: Document[] = [
        {
          id: 'cv-used',
          userId: 'u-1',
          name: 'CV Senior Fullstack 2026',
          fileName: 'cv_senior.pdf',
          fileUrl: '/uploads/cv.pdf',
          mimeType: 'application/pdf',
          type: 'CV',
          fileSize: 204800,
          isDefault: true,
          createdAt: '2026-03-01T10:00:00.000Z',
          updatedAt: '2026-03-01T10:00:00.000Z',
          usageCount: 2,
          companies: ['Google France', 'Stripe EU'],
        },
        {
          id: 'cv-unused',
          userId: 'u-1',
          name: 'CV Ancien 2024',
          fileName: 'cv_ancien.pdf',
          fileUrl: '/uploads/cv_ancien.pdf',
          mimeType: 'application/pdf',
          type: 'CV',
          fileSize: 102400,
          isDefault: false,
          createdAt: '2026-01-01T10:00:00.000Z',
          updatedAt: '2026-01-01T10:00:00.000Z',
          usageCount: 0,
          companies: [],
        },
      ];

      vi.mocked(documentsService.getAll).mockResolvedValue(mockDocsWithUsage);

      renderWithProviders(<DocumentsPage />);

      await waitFor(() => {
        expect(screen.getByText('CV Senior Fullstack 2026')).toBeInTheDocument();
      });

      // Verification of usage count badge and company badges
      expect(screen.getByText(/Utilisé dans 2 candidatures/i)).toBeInTheDocument();
      expect(screen.getByText('Google France')).toBeInTheDocument();
      expect(screen.getByText('Stripe EU')).toBeInTheDocument();

      // Verification of unused document badge
      expect(screen.getByText(/Non utilisé/i)).toBeInTheDocument();
    });
  });

  describe('TICK-302: Free Practice Mode (Entraînement Libre)', () => {
    it('allows users to configure and launch a free practice interview session', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: [] });
      vi.mocked(applicationsService.getAll).mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      } as any);

      renderWithProviders(<InterviewPrepPage />, '/interview-prep?tab=simulation');

      await waitFor(() => {
        expect(screen.getByText(/Entraînement libre/i)).toBeInTheDocument();
      });

      // Switch to free practice mode
      const freeTabBtn = screen.getByRole('button', { name: /Entraînement libre/i });
      fireEvent.click(freeTabBtn);

      await waitFor(() => {
        expect(screen.getByText(/Paramètres de l'entraînement libre/i)).toBeInTheDocument();
      });

      // Fill in custom role
      const roleInput = screen.getByPlaceholderText(/Développeur Full-Stack/i);
      fireEvent.change(roleInput, { target: { value: 'Lead DevOps Engineer' } });

      // Click "Lancer la simulation libre"
      const launchBtn = screen.getByRole('button', { name: /Lancer la simulation libre/i });
      fireEvent.click(launchBtn);

      // Verify header of active free practice mode
      await waitFor(() => {
        expect(screen.getByText('Lead DevOps Engineer')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Changer de poste/i })).toBeInTheDocument();
      });
    });
  });

  describe('TICK-301: Post-simulation debriefing & scoring modal', () => {
    it('renders debriefing score, strengths, improvements, and ideal STAR answer', async () => {
      const mockSessionWithFeedback = {
        id: 'sess-123',
        title: 'Simulation DevOps',
        interviewerType: 'TECHNICAL',
        difficulty: 'MEDIUM',
        status: 'COMPLETED',
        createdAt: '2026-03-20T10:00:00.000Z',
        updatedAt: '2026-03-20T10:30:00.000Z',
        messages: [
          {
            id: 'm1',
            role: 'model',
            content: 'Bonjour, parlez-moi de votre expérience avec Kubernetes.',
            createdAt: '2026-03-20T10:01:00.000Z',
          },
          {
            id: 'm2',
            role: 'user',
            content: 'J\'ai déployé des clusters multi-régions avec ArgoCD.',
            createdAt: '2026-03-20T10:02:00.000Z',
          },
          {
            id: 'm3',
            role: 'feedback',
            content: JSON.stringify({
              score: 85,
              summary: 'Excellente prestation technique, réponses précises.',
              strengths: [
                'Maîtrise claire de l\'écosystème cloud native',
                'Exemples concrets avec métriques d\'impact',
                'Bonne élocution et clarté',
              ],
              improvements: [
                'Approfondir les aspects sécurité et RBAC',
                'Détailler le budget et coûts d\'infrastructure',
              ],
              idealAnswer: {
                question: 'Parlez-moi de votre expérience avec Kubernetes.',
                improvedAnswer: 'S: Lors d\'une migration critique. T: Réduire le downtime. A: Déploiement ArgoCD. R: Disponibilité 99.99%.',
              },
            }),
            createdAt: '2026-03-20T10:30:00.000Z',
          },
        ],
        _count: { messages: 3 },
      };

      vi.mocked(interviewSimulationService.getSession).mockResolvedValue(mockSessionWithFeedback as any);
      vi.mocked(interviewSimulationService.getSessionsByApplication).mockResolvedValue([mockSessionWithFeedback] as any);

      // Render simulation with pre-loaded session
      renderWithProviders(
        <InterviewSimulation applicationId="app-1" />
      );

      // Click on Historique button
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Historique/i })).toBeInTheDocument();
      });
      fireEvent.click(screen.getByRole('button', { name: /Historique/i }));

      // Click on past session to view it
      await waitFor(() => {
        expect(screen.getByText('Simulation DevOps')).toBeInTheDocument();
      });

      const sessionCard = screen.getByText('Simulation DevOps');
      fireEvent.click(sessionCard);

      // Check that "Mon Bilan (85/100)" button appears
      await waitFor(() => {
        expect(screen.getByText(/Mon Bilan \(85\/100\)/i)).toBeInTheDocument();
      });

      // Click to open debriefing modal
      const bilanBtn = screen.getByText(/Mon Bilan \(85\/100\)/i);
      fireEvent.click(bilanBtn);

      // Verify structured modal contents
      await waitFor(() => {
        expect(screen.getByText(/Bilan de votre simulation/i)).toBeInTheDocument();
        expect(screen.getByText(/Excellente prestation technique/i)).toBeInTheDocument();
        expect(screen.getByText(/Maîtrise claire de l'écosystème cloud native/i)).toBeInTheDocument();
        expect(screen.getByText(/Approfondir les aspects sécurité et RBAC/i)).toBeInTheDocument();
        expect(screen.getByText(/Question analysée :/i)).toBeInTheDocument();
        expect(screen.getByText(/Disponibilité 99.99%/i)).toBeInTheDocument();
      });
    });
  });

  describe('TICK-303: 1-click gateway from simulation questions to question bank', () => {
    it('opens SaveQuestionDialog pre-filled with recruiter question and user answer', async () => {
      const mockActiveSession = {
        id: 'sess-active',
        title: 'Simulation Technique',
        interviewerType: 'TECHNICAL',
        difficulty: 'HARD',
        status: 'IN_PROGRESS',
        createdAt: '2026-03-20T10:00:00.000Z',
        updatedAt: '2026-03-20T10:15:00.000Z',
        messages: [
          {
            id: 'm1',
            role: 'model',
            content: 'Quelle est la différence entre process et thread ?',
            createdAt: '2026-03-20T10:01:00.000Z',
          },
          {
            id: 'm2',
            role: 'user',
            content: 'Un process a son propre espace mémoire, tandis que les threads partagent la mémoire.',
            createdAt: '2026-03-20T10:02:00.000Z',
          },
        ],
        _count: { messages: 2 },
      };

      vi.mocked(interviewSimulationService.getSession).mockResolvedValue(mockActiveSession as any);
      vi.mocked(interviewSimulationService.getSessionsByApplication).mockResolvedValue([mockActiveSession] as any);

      renderWithProviders(<InterviewSimulation applicationId="app-1" />);

      // Click Historique then select active session
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Historique/i })).toBeInTheDocument();
      });
      fireEvent.click(screen.getByRole('button', { name: /Historique/i }));

      await waitFor(() => {
        expect(screen.getByText('Simulation Technique')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Simulation Technique'));

      // Check recruiter question displayed with Sauvegarder button
      await waitFor(() => {
        expect(screen.getByText('Quelle est la différence entre process et thread ?')).toBeInTheDocument();
      });

      const saveQuestionBtn = screen.getByRole('button', { name: /Sauvegarder/i });
      fireEvent.click(saveQuestionBtn);

      // Verify dialog is open and form inputs are pre-filled
      await waitFor(() => {
        expect(screen.getByText(/Ajouter à ma banque de questions/i)).toBeInTheDocument();
        expect(screen.getByDisplayValue('Quelle est la différence entre process et thread ?')).toBeInTheDocument();
        expect(screen.getByDisplayValue(/Un process a son propre espace mémoire/i)).toBeInTheDocument();
      });

      // Save question triggers api.post
      vi.mocked(api.post).mockResolvedValue({ data: { success: true } });
      const submitBtn = screen.getByRole('button', { name: /Sauvegarder dans la banque/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/interview-prep', expect.objectContaining({
          question: 'Quelle est la différence entre process et thread ?',
          category: 'TECHNICAL',
        }));
      });
    });
  });
});
