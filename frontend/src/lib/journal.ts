export type ExchangeType = 'CALL' | 'VISIO' | 'TECH' | 'PHYSICAL' | 'EMAIL' | 'OTHER';
export type ExchangeFeeling = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';

export interface ExchangeDebrief {
  id: string;
  date: string; // YYYY-MM-DD
  type: ExchangeType;
  interlocutorName: string;
  interlocutorRoleOrLink?: string;
  notes: string;
  feeling?: ExchangeFeeling;
  nextSteps?: string;
  createdAt: string;
}

export interface ParsedNotes {
  generalNotes: string;
  exchanges: ExchangeDebrief[];
}

export const EXCHANGE_TYPE_CONFIG: Record<
  ExchangeType,
  { label: string; badgeClass: string }
> = {
  CALL: {
    label: 'Appel téléphonique',
    badgeClass: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  },
  VISIO: {
    label: 'Entretien Visio',
    badgeClass: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  },
  TECH: {
    label: 'Test technique',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  },
  PHYSICAL: {
    label: 'Rencontre physique',
    badgeClass: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  },
  EMAIL: {
    label: 'Échange Email',
    badgeClass: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
  },
  OTHER: {
    label: 'Autre échange',
    badgeClass: 'bg-muted text-muted-foreground border-border',
  },
};

export const EXCHANGE_FEELING_CONFIG: Record<
  ExchangeFeeling,
  { label: string; badgeClass: string; emoji: string }
> = {
  POSITIVE: {
    label: 'Positif / Confiant',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    emoji: '🟢',
  },
  NEUTRAL: {
    label: 'Mitigé / En attente',
    badgeClass: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    emoji: '🟡',
  },
  NEGATIVE: {
    label: 'Réservé / Peu convaincu',
    badgeClass: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
    emoji: '🔴',
  },
};

export function parseApplicationNotes(rawNotes?: string | null): ParsedNotes {
  if (!rawNotes || !rawNotes.trim()) {
    return { generalNotes: '', exchanges: [] };
  }

  const trimmed = rawNotes.trim();

  // Try parsing JSON structure
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return { generalNotes: '', exchanges: parsed };
      }
      if (parsed && typeof parsed === 'object') {
        return {
          generalNotes: typeof parsed.generalNotes === 'string' ? parsed.generalNotes : '',
          exchanges: Array.isArray(parsed.exchanges) ? parsed.exchanges : [],
        };
      }
    } catch {
      // Fallback to plain text
    }
  }

  return { generalNotes: rawNotes, exchanges: [] };
}

export function serializeApplicationNotes(parsed: ParsedNotes): string {
  // If there are no exchanges, we can keep generalNotes as plain text for clean backward compatibility
  if (!parsed.exchanges || parsed.exchanges.length === 0) {
    return parsed.generalNotes || '';
  }

  return JSON.stringify({
    generalNotes: parsed.generalNotes || '',
    exchanges: parsed.exchanges,
  });
}
