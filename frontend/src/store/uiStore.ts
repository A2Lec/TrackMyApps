import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

// Matches Tailwind's `lg` breakpoint, where the sidebar becomes a permanent column
export const DESKTOP_SIDEBAR_QUERY = '(min-width: 1024px)';

export const isDesktopViewport = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia(DESKTOP_SIDEBAR_QUERY).matches;

interface UIState {
  sidebarOpen: boolean;
  theme: Theme;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: Theme) => void;
}

// Fonction pour appliquer le thème au DOM
const applyTheme = (theme: Theme) => {
  const root = window.document.documentElement;
  root.classList.remove('light', 'dark');

  if (theme === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
    root.classList.add(systemTheme);
  } else {
    root.classList.add(theme);
  }
};

// Écouter les changements de préférence système
if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const currentTheme = useUIStore.getState().theme;
    if (currentTheme === 'system') {
      applyTheme('system');
    }
  });
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // On mobile the sidebar is an overlay: it must start closed
      sidebarOpen: isDesktopViewport(),
      theme: 'system',
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
    }),
    {
      name: 'ui-storage',
      // The persisted value is the desktop expanded/collapsed preference; never reopen the mobile overlay from it
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<UIState>;
        return {
          ...current,
          ...saved,
          sidebarOpen: isDesktopViewport() ? saved.sidebarOpen ?? current.sidebarOpen : false,
        };
      },
      onRehydrateStorage: () => (state) => {
        // Appliquer le thème au chargement
        if (state) {
          applyTheme(state.theme);
        }
      },
    }
  )
);

// Appliquer le thème initial
if (typeof window !== 'undefined') {
  const savedTheme = localStorage.getItem('ui-storage');
  if (savedTheme) {
    try {
      const parsed = JSON.parse(savedTheme);
      applyTheme(parsed.state?.theme || 'system');
    } catch {
      applyTheme('system');
    }
  } else {
    applyTheme('system');
  }
}
