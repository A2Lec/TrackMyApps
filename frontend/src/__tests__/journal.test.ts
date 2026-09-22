import { describe, it, expect } from 'vitest';
import {
  parseApplicationNotes,
  serializeApplicationNotes,
  type ExchangeDebrief,
} from '../lib/journal';

describe('Journal Notes Parsing & Serialization', () => {
  it('handles empty, null, or undefined notes cleanly', () => {
    expect(parseApplicationNotes(null)).toEqual({ generalNotes: '', exchanges: [] });
    expect(parseApplicationNotes(undefined)).toEqual({ generalNotes: '', exchanges: [] });
    expect(parseApplicationNotes('')).toEqual({ generalNotes: '', exchanges: [] });
    expect(parseApplicationNotes('   ')).toEqual({ generalNotes: '', exchanges: [] });
  });

  it('preserves legacy plain text notes without corruption', () => {
    const legacy = 'Contact RH: Paul Martin\nTél: 06 12 34 56 78\nBureau au 3e étage.';
    const result = parseApplicationNotes(legacy);
    expect(result.generalNotes).toBe(legacy);
    expect(result.exchanges).toEqual([]);

    // When serialized back without exchanges, should output plain text
    expect(serializeApplicationNotes(result)).toBe(legacy);
  });

  it('correctly parses structured JSON notes containing exchanges and general notes', () => {
    const exchange: ExchangeDebrief = {
      id: 'exc-1',
      date: '2026-09-23',
      type: 'VISIO',
      interlocutorName: 'Alice Dupont',
      interlocutorRoleOrLink: 'https://linkedin.com/in/alice',
      notes: 'Questions sur React 19 et nos projets open-source',
      feeling: 'POSITIVE',
      nextSteps: 'Test technique vendredi',
      createdAt: '2026-09-23T10:00:00.000Z',
    };

    const structuredJson = JSON.stringify({
      generalNotes: 'Notes globales sur l entreprise',
      exchanges: [exchange],
    });

    const parsed = parseApplicationNotes(structuredJson);
    expect(parsed.generalNotes).toBe('Notes globales sur l entreprise');
    expect(parsed.exchanges).toHaveLength(1);
    expect(parsed.exchanges[0]).toEqual(exchange);

    const reSerialized = serializeApplicationNotes(parsed);
    const reParsed = parseApplicationNotes(reSerialized);
    expect(reParsed).toEqual(parsed);
  });

  it('handles raw array JSON notes format for robustness', () => {
    const exchange: ExchangeDebrief = {
      id: 'exc-2',
      date: '2026-09-24',
      type: 'CALL',
      interlocutorName: 'Bob Recruteur',
      notes: 'Premier contact téléphonique RH',
      createdAt: '2026-09-24T14:00:00.000Z',
    };

    const rawArrayJson = JSON.stringify([exchange]);
    const parsed = parseApplicationNotes(rawArrayJson);
    expect(parsed.generalNotes).toBe('');
    expect(parsed.exchanges).toHaveLength(1);
    expect(parsed.exchanges[0].interlocutorName).toBe('Bob Recruteur');
  });

  it('handles corrupted JSON by gracefully falling back to plain text', () => {
    const invalidJson = '{ not a valid json: 123';
    const parsed = parseApplicationNotes(invalidJson);
    expect(parsed.generalNotes).toBe(invalidJson);
    expect(parsed.exchanges).toEqual([]);
  });
});
