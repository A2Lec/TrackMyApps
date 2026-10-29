import { Bot, Copy, Square, Star, User, Volume2 } from 'lucide-react';
import type { InterviewMessage } from '@/services/interviewSimulation.service';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: InterviewMessage;
  interviewerLabel: string;
  /** Larger text, no actions: used in the full-screen view */
  expanded?: boolean;
  isSpeaking?: boolean;
  onCopy?: () => void;
  onPlayAudio?: () => void;
  onSaveQuestion?: () => void;
}

export function MessageBubble({
  message,
  interviewerLabel,
  expanded = false,
  isSpeaking = false,
  onCopy,
  onPlayAudio,
  onSaveQuestion,
}: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const showActions = !expanded;

  return (
    <div className={cn('flex items-start gap-2.5 w-full group', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="h-7 w-7 rounded-full bg-muted border border-border/60 flex items-center justify-center flex-shrink-0 text-foreground/80 mt-0.5">
          <Bot className="h-3.5 w-3.5" />
        </div>
      )}

      <div
        className={cn(
          'relative',
          expanded ? 'max-w-[80%]' : 'max-w-[85%] sm:max-w-[78%]',
          isUser ? 'text-right' : 'text-left'
        )}
      >
        <div
          className={cn(
            'leading-relaxed whitespace-pre-wrap rounded-lg transition-all',
            expanded ? 'p-4 text-sm' : 'p-3.5 text-xs sm:text-sm',
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-xs'
              : isSpeaking
                ? 'bg-primary/10 border-2 border-primary text-foreground rounded-tl-xs'
                : 'bg-muted/70 text-foreground border border-border/40 rounded-tl-xs'
          )}
        >
          {message.content}
        </div>

        {showActions && (
          <div
            className={cn(
              'flex items-center gap-2 text-[10px] text-muted-foreground mt-1 px-1',
              isUser ? 'justify-end' : 'justify-start'
            )}
          >
            <span>{isUser ? 'Vous' : interviewerLabel}</span>

            <button
              type="button"
              onClick={onCopy}
              className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground inline-flex items-center gap-0.5"
              title="Copier le texte"
            >
              <Copy className="h-2.5 w-2.5" />
            </button>

            {!isUser && (
              <button
                type="button"
                onClick={onPlayAudio}
                className={cn(
                  'inline-flex items-center gap-0.5 transition-colors',
                  isSpeaking ? 'text-primary font-semibold' : 'opacity-70 group-hover:opacity-100 hover:text-foreground'
                )}
                title={isSpeaking ? 'Arrêter la lecture' : 'Écouter cette question'}
              >
                {isSpeaking ? (
                  <>
                    <Square className="h-2.5 w-2.5 fill-current text-primary" />
                    <span className="text-[9px]">Stop</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="h-2.5 w-2.5" />
                    <span className="text-[9px]">Écouter</span>
                  </>
                )}
              </button>
            )}

            {!isUser && (
              <button
                type="button"
                onClick={onSaveQuestion}
                className="opacity-70 group-hover:opacity-100 hover:text-warning-strong inline-flex items-center gap-1 transition-colors text-[9px] text-muted-foreground ml-1"
                title="Sauvegarder cette question dans ma banque"
              >
                <Star className="h-2.5 w-2.5 text-warning-strong fill-warning" />
                <span>Sauvegarder</span>
              </button>
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-primary-foreground mt-0.5 text-xs font-semibold">
          <User className="h-3.5 w-3.5" />
        </div>
      )}
    </div>
  );
}
