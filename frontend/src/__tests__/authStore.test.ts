import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '@/store/authStore';
import { useEmailVerified } from '@/components/EmailVerifiedGuard';
import type { User } from '@/types';

const mockUser: User = {
  id: 'user-123',
  email: 'etudiant@example.com',
  firstName: 'Lucas',
  lastName: 'Dupont',
  school: 'EPITECH',
  graduationYear: 2026,
  fieldOfStudy: 'Informatique',
  emailNotifications: true,
  relanceFrequency: 7,
  emailVerified: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('Store: useAuthStore', () => {
  beforeEach(() => {
    act(() => {
      useAuthStore.getState().logout();
    });
  });

  it('should initialize with empty credentials and unauthenticated status', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('should set authenticated user and token upon login', () => {
    act(() => {
      useAuthStore.getState().setAuth(mockUser, 'fake-jwt-token-xyz');
    });

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.token).toBe('fake-jwt-token-xyz');
    expect(state.isAuthenticated).toBe(true);
  });

  it('should update partial user attributes without clearing token or auth status', () => {
    act(() => {
      useAuthStore.getState().setAuth(mockUser, 'fake-token');
      useAuthStore.getState().updateUser({ emailVerified: true, firstName: 'Alexandre' });
    });

    const state = useAuthStore.getState();
    expect(state.user?.emailVerified).toBe(true);
    expect(state.user?.firstName).toBe('Alexandre');
    expect(state.user?.lastName).toBe('Dupont');
    expect(state.isAuthenticated).toBe(true);
    expect(state.token).toBe('fake-token');
  });

  it('should completely clear user and token on logout', () => {
    act(() => {
      useAuthStore.getState().setAuth(mockUser, 'fake-token');
      useAuthStore.getState().logout();
    });

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});

describe('Hook: useEmailVerified', () => {
  beforeEach(() => {
    act(() => {
      useAuthStore.getState().logout();
    });
  });

  it('should return false when user is not logged in', () => {
    const { result } = renderHook(() => useEmailVerified());
    expect(result.current).toBe(false);
  });

  it('should return false when user emailVerified is false', () => {
    act(() => {
      useAuthStore.getState().setAuth({ ...mockUser, emailVerified: false }, 'token');
    });

    const { result } = renderHook(() => useEmailVerified());
    expect(result.current).toBe(false);
  });

  it('should return true when user emailVerified is true', () => {
    act(() => {
      useAuthStore.getState().setAuth({ ...mockUser, emailVerified: true }, 'token');
    });

    const { result } = renderHook(() => useEmailVerified());
    expect(result.current).toBe(true);
  });
});
