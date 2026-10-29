import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Star } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface QuestionDraft {
  question: string;
  answer: string;
  category: string;
}

interface SaveQuestionDialogProps {
  /** Pre-filled question; the dialog is open while it is set */
  initialDraft: QuestionDraft | null;
  onClose: () => void;
}

/** Save a recruiter question (and the candidate's answer) to the question bank */
export function SaveQuestionDialog({ initialDraft, onClose }: SaveQuestionDialogProps) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<QuestionDraft | null>(initialDraft);
  const [shownDraft, setShownDraft] = useState(initialDraft);

  // A new question was picked: start editing from it
  if (initialDraft !== shownDraft) {
    setShownDraft(initialDraft);
    setDraft(initialDraft);
  }

  const saveMutation = useMutation({
    mutationFn: (data: QuestionDraft) => api.post('/interview-prep', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interview-prep'] });
      onClose();
      toast.success('Question sauvegardée dans votre banque avec succès !');
    },
    onError: () => {
      toast.error("Erreur lors de l'enregistrement de la question");
    },
  });

  return (
    <Dialog open={initialDraft !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Star className="h-4 w-4 text-warning-strong fill-warning" />
            Ajouter à ma banque de questions
          </DialogTitle>
          <DialogDescription className="text-xs">
            Cette question et votre réponse seront enregistrées dans votre module de préparation pour révision future.
          </DialogDescription>
        </DialogHeader>

        {draft && (
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Catégorie</Label>
              <Select value={draft.category} onValueChange={(category) => setDraft({ ...draft, category })}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BEHAVIORAL">Comportemental / Fit humain</SelectItem>
                  <SelectItem value="TECHNICAL">Technique / Compétences</SelectItem>
                  <SelectItem value="SITUATIONAL">Mise en situation</SelectItem>
                  <SelectItem value="SALARY">Négociation & Salaire</SelectItem>
                  <SelectItem value="OTHER">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Question du recruteur</Label>
              <Textarea
                value={draft.question}
                onChange={(e) => setDraft({ ...draft, question: e.target.value })}
                rows={3}
                className="text-xs resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Votre réponse (optionnelle)</Label>
              <Textarea
                value={draft.answer}
                onChange={(e) => setDraft({ ...draft, answer: e.target.value })}
                placeholder="Notes ou éléments clés de votre réponse..."
                rows={4}
                className="text-xs resize-none"
              />
            </div>
          </div>
        )}

        <DialogFooter className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Annuler
          </Button>
          <Button
            size="sm"
            disabled={saveMutation.isPending || !draft?.question.trim()}
            onClick={() => draft && saveMutation.mutate(draft)}
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Enregistrement...
              </>
            ) : (
              'Sauvegarder dans la banque'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
