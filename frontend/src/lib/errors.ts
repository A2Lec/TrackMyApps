type ApiErrorShape = { response?: { data?: { message?: unknown } } } | null | undefined;

/** Message to show for a failed API call: the backend's message when there is one */
export function getErrorMessage(error: unknown, fallback: string): string {
  const message = (error as ApiErrorShape)?.response?.data?.message;
  return typeof message === 'string' && message ? message : fallback;
}
