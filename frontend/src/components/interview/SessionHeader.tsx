import { Award, Bot, Loader2, Maximize2, MessageSquare, Mic, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import type { InterviewFeedback } from '@/services/interviewSimulation.service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type InputMode = 'chat' | 'vocal';

interface SessionHeaderProps {
  interviewerLabel: string;
  interviewerColor: string;
  difficultyLabel: string;
  messageCount?: number;
  inputMode: InputMode;
  onInputModeChange: (mode: InputMode) => void;
  feedback: InterviewFeedback | null;
  isCompleting: boolean;
  onFeedback: () => void;
  autoPlayVoice: boolean;
  onToggleAutoPlay: () => void;
  onExpand: () => void;
  onLeave: () => void;
}

export function SessionHeader({
  interviewerLabel,
  interviewerColor,
  difficultyLabel,
  messageCount,
  inputMode,
  onInputModeChange,
  feedback,
  isCompleting,
  onFeedback,
  autoPlayVoice,
  onToggleAutoPlay,
  onExpand,
  onLeave,
}: SessionHeaderProps) {
  return (
    <CardHeader className="p-3 sm:px-5 sm:py-3 border-b border-border/40 flex-col sm:flex-row sm:items-center sm:justify-between gap-3 space-y-0">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 border', interviewerColor)}>
          <Bot className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-xs sm:text-sm font-semibold text-foreground truncate flex items-center gap-1.5">
            <span>{interviewerLabel}</span>
            <span className="text-muted-foreground/60">•</span>
            <Badge variant="outline" className="text-[10px] font-normal px-1.5 py-0 h-4">
              {difficultyLabel}
            </Badge>
          </div>
          <div className="text-[11px] text-muted-foreground truncate">
            {messageCount !== undefined ? `${messageCount} échange(s)` : 'En cours'}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
        <div className="flex items-center bg-muted/70 p-0.5 rounded-lg border text-xs">
          <button
            type="button"
            onClick={() => onInputModeChange('chat')}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all',
              inputMode === 'chat' ? 'bg-background text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
            title="Mode texte classique"
          >
            <MessageSquare className="h-3 w-3" />
            <span>Chat</span>
          </button>
          <button
            type="button"
            onClick={() => onInputModeChange('vocal')}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all',
              inputMode === 'vocal'
                ? 'bg-primary text-primary-foreground font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
            title="Mode vocal avec transcription"
          >
            <Mic className="h-3 w-3" />
            <span>Vocal</span>
          </button>
        </div>

        <Button
          variant={feedback ? 'outline' : 'default'}
          size="sm"
          className={cn(
            'h-8 text-xs font-semibold px-2.5 gap-1.5',
            feedback && 'border-warning/40 text-warning-strong bg-warning-soft hover:bg-warning-soft'
          )}
          onClick={onFeedback}
          disabled={isCompleting}
        >
          {isCompleting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Analyse...</span>
            </>
          ) : feedback ? (
            <>
              <Award className="h-3.5 w-3.5 text-warning-strong" />
              <span>Mon Bilan ({feedback.score}/100)</span>
            </>
          ) : (
            <>
              <Award className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Terminer & Bilan</span>
              <span className="sm:hidden">Bilan</span>
            </>
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', autoPlayVoice ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground')}
          onClick={onToggleAutoPlay}
          title={autoPlayVoice ? 'Lecture vocale IA active (Cliquer pour couper)' : "Activer la voix de l'IA"}
        >
          {autoPlayVoice ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={onExpand}
          title="Agrandir en plein écran"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </Button>
        <Button variant="outline" size="sm" className="h-8 text-xs font-medium" onClick={onLeave}>
          <RotateCcw className="h-3 w-3 mr-1" />
          Quitter
        </Button>
      </div>
    </CardHeader>
  );
}
