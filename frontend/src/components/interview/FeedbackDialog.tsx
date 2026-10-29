import { AlertTriangle, Award, Check, CheckCircle2, Copy, Mic, Star, Target } from 'lucide-react';
import { toast } from 'sonner';
import type { InterviewFeedback } from '@/services/interviewSimulation.service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feedback: InterviewFeedback | null;
}

function scoreTone(score: number) {
  if (score >= 75) return { text: 'text-success', badge: 'bg-success/10 text-success', label: 'Très convaincant' };
  if (score >= 50) return { text: 'text-warning-strong', badge: 'bg-warning-soft text-warning-strong', label: 'Prometteur' };
  return { text: 'text-destructive', badge: 'bg-destructive/10 text-destructive', label: 'À perfectionner' };
}

function feedbackToText(feedback: InterviewFeedback): string {
  const ideal = feedback.idealAnswer
    ? `\n\nQuestion analysée: ${feedback.idealAnswer.question}\nReformulation STAR:\n${feedback.idealAnswer.improvedAnswer}`
    : '';
  return [
    `Bilan Entretien IA - Score: ${feedback.score}/100`,
    `Synthèse:\n${feedback.summary}`,
    `Points forts:\n${feedback.strengths?.map((s) => `- ${s}`).join('\n')}`,
    `Axes d'amélioration:\n${feedback.improvements?.map((i) => `- ${i}`).join('\n')}${ideal}`,
  ].join('\n\n');
}

/** Score and debrief generated when the user ends a simulation */
export function FeedbackDialog({ open, onOpenChange, feedback }: FeedbackDialogProps) {
  const tone = feedback ? scoreTone(feedback.score) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-5 border-b border-border/40 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-warning-soft text-warning-strong flex items-center justify-center">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">Bilan de votre simulation</DialogTitle>
                <DialogDescription className="text-xs">Analyse détaillée de vos réponses par notre coach IA</DialogDescription>
              </div>
            </div>
            {feedback && tone && (
              <div className="text-right">
                <div className={cn('text-2xl font-semibold font-mono tracking-tight', tone.text)}>
                  {feedback.score}
                  <span className="text-xs font-normal text-muted-foreground">/100</span>
                </div>
                <Badge variant="outline" className={cn('text-[10px] font-medium border-0', tone.badge)}>
                  {tone.label}
                </Badge>
              </div>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-5">
          {feedback ? (
            <div className="space-y-5">
              <div className="p-3.5 rounded-lg bg-muted/40 border border-border/60 text-xs sm:text-sm leading-relaxed text-foreground">
                <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Mic className="h-3.5 w-3.5 text-primary" /> Synthèse générale
                </p>
                {feedback.summary}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg border border-success/40 bg-success/10 p-4 space-y-2.5">
                  <div className="text-xs font-semibold text-success flex items-center gap-1.5 uppercase tracking-wide">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    Points forts observés
                  </div>
                  <ul className="space-y-2">
                    {feedback.strengths?.map((item, idx) => (
                      <li key={idx} className="text-xs text-foreground flex items-start gap-2 leading-relaxed">
                        <Check className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg border border-warning/40 bg-warning-soft p-4 space-y-2.5">
                  <div className="text-xs font-semibold text-warning-strong flex items-center gap-1.5 uppercase tracking-wide">
                    <Target className="h-4 w-4 text-warning-strong" />
                    Axes d'amélioration
                  </div>
                  <ul className="space-y-2">
                    {feedback.improvements?.map((item, idx) => (
                      <li key={idx} className="text-xs text-foreground flex items-start gap-2 leading-relaxed">
                        <AlertTriangle className="h-3.5 w-3.5 text-warning-strong shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {feedback.idealAnswer && (
                <div className="rounded-lg border border-border/80 bg-card p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                      <Star className="h-4 w-4 text-primary" />
                      Exemple de reformulation idéale (Méthode STAR)
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      Situation • Tâche • Action • Résultat
                    </Badge>
                  </div>
                  {feedback.idealAnswer.question && (
                    <div className="text-xs font-medium text-foreground bg-primary/5 border border-primary/20 p-2.5 rounded-lg">
                      <span className="font-semibold text-primary">Question analysée : </span>
                      {feedback.idealAnswer.question}
                    </div>
                  )}
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap bg-muted/30 p-3 rounded-lg border border-border/40">
                    {feedback.idealAnswer.improvedAnswer}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-xs">Aucun débriefing disponible pour cette session.</div>
          )}
        </ScrollArea>

        <DialogFooter className="p-4 border-t border-border/40 shrink-0 flex items-center justify-between sm:justify-between">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => {
              if (!feedback) return;
              navigator.clipboard.writeText(feedbackToText(feedback));
              toast.success('Rapport copié dans le presse-papier !');
            }}
          >
            <Copy className="h-3.5 w-3.5 mr-1.5" />
            Copier le rapport
          </Button>
          <Button size="sm" className="text-xs" onClick={() => onOpenChange(false)}>
            Fermer le bilan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
