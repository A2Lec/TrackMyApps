import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BottomNav } from '@/components/layout/BottomNav';
import { useUIStore } from '@/store/uiStore';

describe('Component: BottomNav', () => {
  beforeEach(() => {
    useUIStore.setState({ sidebarOpen: false });
  });

  it('renders all key mobile navigation items and menu toggle button', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <BottomNav />
      </MemoryRouter>
    );

    expect(screen.getByText('Accueil')).toBeInTheDocument();
    expect(screen.getByText('Candidatures')).toBeInTheDocument();
    expect(screen.getByText('Rappels')).toBeInTheDocument();
    expect(screen.getByText('Entretiens')).toBeInTheDocument();
    expect(screen.getByText('Menu')).toBeInTheDocument();
    expect(screen.getByText('IA')).toBeInTheDocument(); // Badge IA on Entretiens
  });

  it('highlights the active tab corresponding to the current URL', () => {
    render(
      <MemoryRouter initialEntries={['/applications']}>
        <BottomNav />
      </MemoryRouter>
    );

    const applicationsLink = screen.getByText('Candidatures').closest('a');
    expect(applicationsLink).toHaveClass('text-primary');

    const homeLink = screen.getByText('Accueil').closest('a');
    expect(homeLink).not.toHaveClass('text-primary');
  });

  it('toggles sidebar state when clicking the Menu button', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <BottomNav />
      </MemoryRouter>
    );

    const menuButton = screen.getByRole('button', { name: /ouvrir le menu complet/i });
    expect(useUIStore.getState().sidebarOpen).toBe(false);

    fireEvent.click(menuButton);
    expect(useUIStore.getState().sidebarOpen).toBe(true);

    fireEvent.click(menuButton);
    expect(useUIStore.getState().sidebarOpen).toBe(false);
  });
});
