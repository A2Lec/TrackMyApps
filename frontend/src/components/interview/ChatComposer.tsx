import { useEffect, useRef } from 'react';
import { Loader2, Mic, MicOff, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface ChatComposerProps {
  message: string;
  onMessageChange: (message: string) => void;
  onSend: () => void;
  isSending: boolean;
  isListening: boolean;
  onToggleDictation: () => void;
}

/** Text answer, with optional dictation into the text box */
export function ChatComposer({
  message,
  onMessageChange,
  onSend,
  isSending,
  isListening,
  onToggleDictation,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const trimmed = message.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;

  // Grow with the content, up to 180px
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 180) + 'px';
  }, [message]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSend();
      }}
      className="space-y-2"
    >
      <div className="flex items-end gap-2">
        <div className="relative flex-1">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            placeholder={isListening ? 'Parlez maintenant, transcription en direct...' : 'Rédigez votre réponse comme en réel...'}
            disabled={isSending}
            rows={1}
            className={cn(
              'min-h-[44px] max-h-[160px] resize-none text-xs sm:text-sm py-2.5 pr-10 rounded-lg border-border/80 focus-visible:ring-primary/30 transition-all',
              isListening && 'border-primary ring-2 ring-primary/20 bg-primary/5'
            )}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onToggleDictation}
            disabled={isSending}
            className={cn(
              'absolute right-1.5 bottom-1.5 h-8 w-8 rounded-lg transition-all',
              isListening
                ? 'bg-destructive text-white hover:bg-destructive animate-pulse'
                : 'text-muted-foreground hover:text-foreground'
            )}
            title={isListening ? 'Arrêter la dictée' : 'Dicter vocalement'}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
        </div>

        <Button type="submit" size="icon" disabled={isSending || !trimmed} className="h-11 w-11 rounded-lg flex-shrink-0">
          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
        <span className="hidden sm:inline">
          {isListening ? (
            <span className="text-destructive font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-[2px] bg-destructive animate-ping" />
              Enregistrement vocal en cours...
            </span>
          ) : (
            <>
              Appuyez sur <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono border">Entrée</kbd> pour répondre
            </>
          )}
        </span>
        <span className="sm:hidden">{isListening ? 'Écoute en cours...' : 'Entrée pour envoyer'}</span>
        {wordCount > 0 && <span>{wordCount} mot(s)</span>}
      </div>
    </form>
  );
}
