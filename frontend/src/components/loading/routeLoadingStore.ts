import { create } from 'zustand';

// Counts Suspense fallbacks currently on screen (page chunks being downloaded),
// so the top progress bar also covers navigation, not only data fetching.
interface RouteLoadingState {
  pending: number;
  start: () => void;
  end: () => void;
}

export const useRouteLoadingStore = create<RouteLoadingState>((set) => ({
  pending: 0,
  start: () => set((s) => ({ pending: s.pending + 1 })),
  end: () => set((s) => ({ pending: Math.max(0, s.pending - 1) })),
}));
