import { describe, it, expect, vi, afterEach } from 'vitest';
import { useUIStore } from '@/store/uiStore';

function mockViewport(desktop: boolean) {
  vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
    matches: query.includes('min-width: 1024px') ? desktop : false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }) as unknown as MediaQueryList);
}

function persistSidebar(open: boolean) {
  localStorage.setItem('ui-storage', JSON.stringify({ state: { sidebarOpen: open, theme: 'light' }, version: 0 }));
}

describe('Sidebar default state', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('stays closed on mobile even if it was saved as open', async () => {
    mockViewport(false);
    persistSidebar(true);

    await useUIStore.persist.rehydrate();

    expect(useUIStore.getState().sidebarOpen).toBe(false);
    expect(useUIStore.getState().theme).toBe('light'); // other preferences still restored
  });

  it('keeps the saved expanded/collapsed preference on desktop', async () => {
    mockViewport(true);

    persistSidebar(false);
    await useUIStore.persist.rehydrate();
    expect(useUIStore.getState().sidebarOpen).toBe(false);

    persistSidebar(true);
    await useUIStore.persist.rehydrate();
    expect(useUIStore.getState().sidebarOpen).toBe(true);
  });
});
