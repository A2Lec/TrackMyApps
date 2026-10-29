import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DocumentsPage } from '@/pages/Documents';
import { documentsService } from '@/services/documents.service';
import type { Document } from '@/types';

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

const mockDocuments: Document[] = [
  {
    id: 'doc-1',
    userId: 'user-1',
    name: 'CV Développeur Fullstack 2026',
    fileName: 'cv_fullstack.pdf',
    mimeType: 'application/pdf',
    type: 'CV',
    fileSize: 1024 * 350,
    isDefault: true,
    createdAt: '2026-03-01T10:00:00.000Z',
    updatedAt: '2026-03-01T10:00:00.000Z',
  },
  {
    id: 'doc-2',
    userId: 'user-1',
    name: 'Lettre de motivation Stage Stripe',
    fileName: 'lettre_stripe.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    type: 'COVER_LETTER',
    fileSize: 1024 * 120,
    isDefault: false,
    createdAt: '2026-03-05T12:00:00.000Z',
    updatedAt: '2026-03-05T12:00:00.000Z',
  },
  {
    id: 'doc-3',
    userId: 'user-1',
    name: 'Portfolio Démo Projets',
    fileName: 'portfolio.pdf',
    mimeType: 'application/pdf',
    type: 'PORTFOLIO',
    fileSize: 1024 * 1024 * 2,
    isDefault: false,
    createdAt: '2026-03-10T14:00:00.000Z',
    updatedAt: '2026-03-10T14:00:00.000Z',
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

describe('Page: DocumentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(documentsService.getAll).mockResolvedValue(mockDocuments);
  });

  it('renders documents with correct titles and default badge', async () => {
    renderWithProviders(<DocumentsPage />);

    await waitFor(() => {
      expect(screen.getByText('CV Développeur Fullstack 2026')).toBeInTheDocument();
      expect(screen.getByText('Lettre de motivation Stage Stripe')).toBeInTheDocument();
      expect(screen.getByText('Portfolio Démo Projets')).toBeInTheDocument();
      expect(screen.getByText('Par défaut')).toBeInTheDocument();
    });
  });

  it('filters documents by search query', async () => {
    renderWithProviders(<DocumentsPage />);

    await waitFor(() => {
      expect(screen.getByText('CV Développeur Fullstack 2026')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Rechercher par titre/i);
    fireEvent.change(searchInput, { target: { value: 'Stripe' } });

    await waitFor(() => {
      expect(screen.getByText('Lettre de motivation Stage Stripe')).toBeInTheDocument();
      expect(screen.queryByText('CV Développeur Fullstack 2026')).not.toBeInTheDocument();
      expect(screen.queryByText('Portfolio Démo Projets')).not.toBeInTheDocument();
    });
  });

  it('filters documents when clicking category chips', async () => {
    renderWithProviders(<DocumentsPage />);

    await waitFor(() => {
      expect(screen.getByText('CV Développeur Fullstack 2026')).toBeInTheDocument();
    });

    // Click on CVs chip
    const cvChip = screen.getByRole('button', { name: /CVs \(/i });
    fireEvent.click(cvChip);

    await waitFor(() => {
      expect(screen.getByText('CV Développeur Fullstack 2026')).toBeInTheDocument();
      expect(screen.queryByText('Lettre de motivation Stage Stripe')).not.toBeInTheDocument();
      expect(screen.queryByText('Portfolio Démo Projets')).not.toBeInTheDocument();
    });
  });

  it('opens and closes the upload dialog', async () => {
    renderWithProviders(<DocumentsPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Importer un document/i })).toBeInTheDocument();
    });

    const uploadBtn = screen.getByRole('button', { name: /Importer un document/i });
    fireEvent.click(uploadBtn);

    await waitFor(() => {
      expect(screen.getByText('Glissez votre fichier ici ou')).toBeInTheDocument();
      expect(screen.getByLabelText(/Nom usuel du document/i)).toBeInTheDocument();
    });

    const cancelBtn = screen.getByRole('button', { name: /Annuler/i });
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByText('Glissez votre fichier ici ou')).not.toBeInTheDocument();
    });
  });

  it('displays empty state when no documents exist', async () => {
    vi.mocked(documentsService.getAll).mockResolvedValue([]);
    renderWithProviders(<DocumentsPage />);

    await waitFor(() => {
      expect(screen.getByText('Aucun document')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Importer mon premier document/i })).toBeInTheDocument();
    });
  });
});
