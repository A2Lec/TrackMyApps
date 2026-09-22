import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

describe('Hook: useMediaQuery', () => {
  let listeners: ((e: MediaQueryListEvent) => void)[] = [];
  let currentMatches = false;

  beforeEach(() => {
    listeners = [];
    currentMatches = false;

    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: currentMatches,
      media: query,
      onchange: null,
      addListener: vi.fn((listener) => listeners.push(listener)),
      removeListener: vi.fn((listener) => {
        listeners = listeners.filter((l) => l !== listener);
      }),
      addEventListener: vi.fn((_, listener) => listeners.push(listener)),
      removeEventListener: vi.fn((_, listener) => {
        listeners = listeners.filter((l) => l !== listener);
      }),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return initial false when query does not match', () => {
    currentMatches = false;
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(false);
  });

  it('should return initial true when query matches', () => {
    currentMatches = true;
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(true);
  });

  it('should react to change events and update matches', () => {
    currentMatches = false;
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(false);

    // Simulate viewport resize / breakpoint trigger
    act(() => {
      listeners.forEach((listener) =>
        listener({ matches: true, media: '(min-width: 768px)' } as MediaQueryListEvent)
      );
    });

    expect(result.current).toBe(true);

    // Simulate resizing back down
    act(() => {
      listeners.forEach((listener) =>
        listener({ matches: false, media: '(min-width: 768px)' } as MediaQueryListEvent)
      );
    });

    expect(result.current).toBe(false);
  });

  it('should clean up listeners on unmount', () => {
    const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(listeners.length).toBe(1);

    unmount();
    expect(listeners.length).toBe(0);
  });
});
