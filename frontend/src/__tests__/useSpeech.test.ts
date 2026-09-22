import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSpeechRecognition, useSpeechSynthesis } from '@/hooks/useSpeech';

describe('Hook: useSpeechRecognition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with default states when speech recognition is not in environment', () => {
    const { result } = renderHook(() => useSpeechRecognition());

    expect(result.current.isListening).toBe(false);
    expect(result.current.transcript).toBe('');
    expect(result.current.interimTranscript).toBe('');
  });

  it('handles resetTranscript properly', () => {
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.resetTranscript();
    });

    expect(result.current.transcript).toBe('');
    expect(result.current.interimTranscript).toBe('');
  });
});

describe('Hook: useSpeechSynthesis', () => {
  it('initializes speech synthesis state safely', () => {
    const { result } = renderHook(() => useSpeechSynthesis());

    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.isPaused).toBe(false);
  });
});
