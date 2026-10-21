import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';

describe('Component: Sidebar (Sprint 1 Navigation)', () => {
  beforeEach(() => {
    useUIStore.setState({ sidebarOpen: true });
    useAuthStore.setState({
      user: {
        id: 'user-1',
        email: 'alex@example.com',
        firstName: 'Alex',
        lastName: 'Dupont',
        emailNotifications: true,
        relanceFrequency: 7,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
      token: 'mock-token',
      isAuthenticated: true,
    });
  });

  it('renders exactly the 5 primary navigation links', () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/']}>
          <TooltipProvider>
            <Sidebar />
          </TooltipProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Primary 5 navigation items
    expect(screen.getByText('Tableau de bord')).toBeInTheDocument();
    expect(screen.getByText('Candidatures')).toBeInTheDocument();
    expect(screen.getByText('Rappels')).toBeInTheDocument();
    expect(screen.getByText('Entraînement IA')).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();

    // Removed or relocated secondary items must not be in primary nav list
    expect(screen.queryByText('Entreprises')).not.toBeInTheDocument();
    expect(screen.queryByText('Calendrier')).not.toBeInTheDocument();
    expect(screen.queryByText('Statistiques')).not.toBeInTheDocument();
  });

  it('renders user profile with quick access to settings in footer', () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/']}>
          <TooltipProvider>
            <Sidebar />
          </TooltipProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('Alex Dupont')).toBeInTheDocument();
    expect(screen.getByText('alex@example.com')).toBeInTheDocument();
    const settingsLink = screen.getByText('Alex Dupont').closest('a');
    expect(settingsLink).toHaveAttribute('href', '/settings');
  });
});
