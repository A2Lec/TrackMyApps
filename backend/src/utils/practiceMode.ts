import type { Prisma } from '@prisma/client';

export const PRACTICE_MODE_MARKER = '[PRACTICE_MODE]';

/**
 * Excludes the hidden "free practice" applications created by the interview simulator.
 * `notes` is nullable: a bare NOT { contains } would also drop rows where notes IS NULL
 * (NOT (NULL LIKE ...) is NULL in SQL), so null notes are matched explicitly.
 */
export const excludePracticeMode: Prisma.ApplicationWhereInput = {
  OR: [{ notes: null }, { NOT: { notes: { contains: PRACTICE_MODE_MARKER } } }],
};
