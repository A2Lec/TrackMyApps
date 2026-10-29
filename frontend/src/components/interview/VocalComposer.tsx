import { Loader2, Mic, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { shortVoiceName } from './constants';

const SPEECH_RATES = [
  { rate: 1.0, label: '1x' },
  { rate: 1.15, label: '1.15x' },
  { rate: 1.3, label: '1.3x' },
];

interface VocalComposerProps {
  transcript: string;
  interimTranscript: string;
  isSending: boolean;
  isListening: boolean;
  onStart: () => void;
  onStopAndSend: () => void;
  onCancel: () => void;
  speechRate: number;
  onSpeechRateChange: (rate: number) => void;
  voices: SpeechSynthesisVoice[];
  activeVoice: SpeechSynthesisVoice | null;
  selectedVoiceURI: string | null;
  onVoiceChange: (voiceURI: string) => void;
}

/** Spoken answer: push to talk, live transcription, sent when the microphone stops */
export function VocalComposer({
  transcript,
  interimTranscript,
  isSending,
  isListening,
  onStart,
  onStopAndSend,
  onCancel,
  speechRate,
  onSpeechRateChange,
  voices,
  activeVoice,
  selectedVoiceURI,
  onVoiceChange,
}: VocalComposerProps) {
  if (isSending) {
    return (
      <div className="py-5 px-4 bg-muted/40 border border-border/60 rounded-lg flex items-center justify-center gap-3 text-center animate-in fade-in duration-150">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-xs sm:text-sm font-medium text-foreground">
          Le recruteur analyse votre réponse et prépare sa réplique...
        </span>
      </div>
    );
  }

  if (isListening) {
    return (
      <div className="space-y-3 animate-in fade-in duration-200">
        <div className="bg-destructive/10 border-2 border-destructive/40 rounded-lg p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-destructive font-semibold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-destructive animate-ping" />
              Microphone actif — parlez distinctement
            </span>
            <div className="flex items-end gap-0.5 h-4">
              <span className="w-1 h-2 bg-destructive rounded-[2px] animate-pulse [animation-delay:0ms]" />
              <span className="w-1 h-3.5 bg-destructive rounded-full animate-pulse [animation-delay:150ms]" />
              <span className="w-1 h-4 bg-destructive rounded-full animate-pulse [animation-delay:300ms]" />
              <span className="w-1 h-3 bg-destructive rounded-full animate-pulse [animation-delay:450ms]" />
              <span className="w-1 h-2 bg-destructive rounded-[2px] animate-pulse [animation-delay:200ms]" />
            </div>
          </div>

          <div className="text-xs sm:text-sm text-foreground min-h-[48px] max-h-[120px] overflow-y-auto leading-relaxed">
            {transcript.trim() ? (
              <span className="font-medium">{transcript}</span>
            ) : (
              <span className="text-muted-foreground italic">Écoute active en cours... vos paroles apparaîtront ici.</span>
            )}
            {interimTranscript && <span className="text-muted-foreground/70 italic ml-1">{interimTranscript}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onStopAndSend}
            className="flex-1 py-3.5 px-4 rounded-lg bg-destructive hover:bg-destructive text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <Send className="h-4 w-4" />
            <span>Terminer & Envoyer ma réponse</span>
          </button>

          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="h-12 px-3 text-xs text-muted-foreground hover:text-foreground rounded-lg"
            title="Annuler sans envoyer"
          >
            <X className="h-4 w-4 mr-1" />
            Annuler
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <button
        type="button"
        onClick={onStart}
        className="w-full py-4 px-5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 transition-all flex items-center justify-center gap-3.5 group active:scale-[0.99]"
      >
        <div className="h-10 w-10 rounded-full bg-primary-foreground/15 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
          <Mic className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="text-left min-w-0">
          <div className="text-xs sm:text-sm font-semibold truncate">Appuyer pour répondre à l'oral</div>
          <div className="text-[11px] text-primary-foreground/80 truncate">L'arrêt du micro enverra directement votre message</div>
        </div>
      </button>

      <div className="flex flex-wrap items-center justify-between gap-2 px-1 pt-0.5 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground/80">Vitesse de lecture :</span>
          <div className="flex items-center bg-muted/80 p-0.5 rounded-lg border text-[11px]">
            {SPEECH_RATES.map(({ rate, label }) => (
              <button
                key={rate}
                type="button"
                onClick={() => onSpeechRateChange(rate)}
                className={cn(
                  'px-2 py-0.5 rounded-md font-medium transition-colors',
                  speechRate === rate ? 'bg-background text-foreground font-semibold' : 'hover:text-foreground'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {voices.length > 1 ? (
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-foreground/80">Voix :</span>
            <Select value={selectedVoiceURI || activeVoice?.voiceURI || ''} onValueChange={onVoiceChange}>
              <SelectTrigger className="h-7 text-[11px] border-border/60 max-w-[160px] sm:max-w-[190px]">
                <SelectValue placeholder="Voix du recruteur" />
              </SelectTrigger>
              <SelectContent>
                {voices.map((voice) => (
                  <SelectItem key={voice.voiceURI} value={voice.voiceURI} className="text-xs">
                    {shortVoiceName(voice.name)}
                    {/natural|neural|online|google/i.test(voice.name) && ' ✨'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          activeVoice && (
            <span className="truncate max-w-[210px] text-[11px] text-muted-foreground flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-[2px] bg-success" />
              <span className="truncate font-medium">{shortVoiceName(activeVoice.name) || 'Voix française'}</span>
            </span>
          )
        )}
      </div>
    </div>
  );
}
