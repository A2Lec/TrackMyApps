import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApplicationForm } from '@/components/ApplicationForm';
import { companiesService } from '@/services/companies.service';

vi.mock('@/services/companies.service', () => ({
  companiesService: {
    getAll: vi.fn(),
  },
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('Sprint 1 - TICK-103: Quick Add Application Form', () => {
  const mockCompanies = [
    { id: 'comp-1', name: 'Google', createdAt: '', updatedAt: '' },
    { id: 'comp-2', name: 'Doctolib', createdAt: '', updatedAt: '' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(companiesService.getAll).mockResolvedValue(mockCompanies as any);
  });

  it('renders essential fields (Entreprise & Poste) and datalist suggestions', async () => {
    renderWithClient(<ApplicationForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText(/Entreprise \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Poste \*/i)).toBeInTheDocument();
    expect(screen.getByText(/Type de contrat/i)).toBeInTheDocument();
    expect(screen.getByText(/Statut initial/i)).toBeInTheDocument();
    expect(screen.getByText(/Détails complémentaires \(optionnel\)/i)).toBeInTheDocument();

    await waitFor(() => {
      const datalist = document.getElementById('company-suggestions');
      expect(datalist).toBeInTheDocument();
      expect(datalist?.querySelectorAll('option')).toHaveLength(2);
    });
  });

  it('submits successfully with only Entreprise and Poste (location defaults to Non précisée)', async () => {
    const handleSubmit = vi.fn();
    const user = userEvent.setup();

    renderWithClient(<ApplicationForm onSubmit={handleSubmit} />);

    const companyInput = screen.getByLabelText(/Entreprise \*/i);
    const positionInput = screen.getByLabelText(/Poste \*/i);

    await user.type(companyInput, 'Mistral AI');
    await user.type(positionInput, 'AI Research Engineer');

    // Submit form via submit event on form
    const form = companyInput.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    const submittedData = handleSubmit.mock.calls[0][0];
    expect(submittedData.companyName).toBe('Mistral AI');
    expect(submittedData.position).toBe('AI Research Engineer');
    expect(submittedData.location).toBe('Non précisée');
    expect(submittedData.status).toBe('SENT');
  });

  it('shows validation errors when required fields are missing', async () => {
    const handleSubmit = vi.fn();
    renderWithClient(<ApplicationForm onSubmit={handleSubmit} />);

    const companyInput = screen.getByLabelText(/Entreprise \*/i);
    const form = companyInput.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText(/Le nom de l'entreprise est requis/i)).toBeInTheDocument();
      expect(screen.getByText(/Le poste est requis/i)).toBeInTheDocument();
      expect(handleSubmit).not.toHaveBeenCalled();
    });
  });

  it('toggles collapsible optional fields when clicking the toggle button', async () => {
    const user = userEvent.setup();
    renderWithClient(<ApplicationForm onSubmit={vi.fn()} />);

    // Optional fields should initially be collapsed
    expect(screen.queryByLabelText(/^Localisation$/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/URL de l'annonce/i)).not.toBeInTheDocument();

    // Click toggle
    const toggleBtn = screen.getByText(/Détails complémentaires \(optionnel\)/i);
    await user.click(toggleBtn);

    // Optional fields should now be visible
    expect(screen.getByLabelText(/^Localisation$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/URL de l'annonce/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Salaire \/ Rémunération/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Notes$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description de l'offre/i)).toBeInTheDocument();

    // Click toggle again to close
    await user.click(toggleBtn);
    expect(screen.queryByLabelText(/^Localisation$/i)).not.toBeInTheDocument();
  });

  it('automatically opens optional fields if initial default values contain optional details', () => {
    renderWithClient(
      <ApplicationForm
        onSubmit={vi.fn()}
        defaultValues={{
          location: 'Lyon',
          salary: '45k€',
        }}
      />
    );

    // Should already be open because location is provided
    expect(screen.getByLabelText(/^Localisation$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Localisation$/i)).toHaveValue('Lyon');
    expect(screen.getByLabelText(/Salaire \/ Rémunération/i)).toHaveValue('45k€');
  });
});
