import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { TopProgressBar } from '@/components/loading/TopProgressBar';
import { AppLoader } from '@/components/loading/AppLoader';
import { RouteLoadingSignal } from '@/components/loading/RouteLoadingSignal';
import { useRouteLoadingStore } from '@/components/loading/routeLoadingStore';

function NeverResolvingQuery() {
  useQuery({ queryKey: ['slow'], queryFn: () => new Promise(() => {}) });
  return null;
}

function BackgroundRefetch() {
  // Data already displayed: a refetch must not show the bar
  useQuery({ queryKey: ['cached'], queryFn: () => new Promise(() => {}), initialData: 1, staleTime: 0 });
  return null;
}

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('Loading indicators', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useRouteLoadingStore.setState({ pending: 0 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the progress bar for a first load, then the slow-server hint after 3s', async () => {
    renderWithClient(
      <>
        <TopProgressBar />
        <NeverResolvingQuery />
      </>
    );

    // let react-query notify the fetch start (it batches through setTimeout 0)
    await act(async () => { vi.advanceTimersByTime(1); });
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    await act(async () => { vi.advanceTimersByTime(200); });
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByText(/Démarrage du serveur/)).not.toBeInTheDocument();

    await act(async () => { vi.advanceTimersByTime(3000); });
    expect(screen.getByText(/Démarrage du serveur/)).toBeInTheDocument();
  });

  it('ignores background refetches of data already on screen', async () => {
    renderWithClient(
      <>
        <TopProgressBar />
        <BackgroundRefetch />
      </>
    );

    await act(async () => { vi.advanceTimersByTime(1); });
    await act(async () => { vi.advanceTimersByTime(4000); });
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.queryByText(/Démarrage du serveur/)).not.toBeInTheDocument();
  });

  it('also tracks page chunks being downloaded (Suspense fallbacks)', async () => {
    const { rerender } = renderWithClient(
      <>
        <TopProgressBar />
        <RouteLoadingSignal />
      </>
    );

    await act(async () => { vi.advanceTimersByTime(200); });
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <TopProgressBar />
      </QueryClientProvider>
    );
    expect(useRouteLoadingStore.getState().pending).toBe(0);
  });

  it('the app loader explains a slow start after 3s', async () => {
    render(<AppLoader />);

    expect(screen.getByText('TrackMyApps')).toBeInTheDocument();
    expect(screen.queryByText(/Démarrage du serveur/)).not.toBeInTheDocument();

    await act(async () => { vi.advanceTimersByTime(3100); });
    expect(screen.getByText(/Démarrage du serveur/)).toBeInTheDocument();
  });
});
