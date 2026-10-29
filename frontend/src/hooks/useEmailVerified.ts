import { useAuthStore } from '@/store/authStore';

/** Whether the current user has verified their email (required for any change) */
export function useEmailVerified() {
  return useAuthStore((state) => state.user?.emailVerified ?? false);
}
