import { z } from 'zod';

// Mirrors the backend rules (strongPassword in validation.middleware.ts)
export const strongPasswordSchema = z.string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .regex(/[A-Z]/, 'Au moins une lettre majuscule')
  .regex(/[a-z]/, 'Au moins une lettre minuscule')
  .regex(/[0-9]/, 'Au moins un chiffre')
  .regex(/[^A-Za-z0-9]/, 'Au moins un caractère spécial');
