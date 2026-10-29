import { FileText } from 'lucide-react';
import type { Application, JobType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { JOB_TYPE_LABELS } from '@/constants/labels';

export type ApplicationDraft = Pick<
  Application,
  'companyName' | 'position' | 'jobType' | 'location' | 'jobUrl' | 'salary' | 'jobDescription'
> & { notes: string };

interface ApplicationDetailsCardProps {
  application: Application;
  /** Personal notes, without the exchange journal stored alongside them */
  generalNotes: string;
  exchangeCount: number;
  onShowJournal: () => void;
  /** Values being edited; read-only view when null */
  draft: ApplicationDraft | null;
  onDraftChange: (draft: ApplicationDraft) => void;
}

const JOB_TYPES: JobType[] = ['STAGE', 'ALTERNANCE', 'CDI', 'JOB_ETUDIANT'];

export function ApplicationDetailsCard({
  application,
  generalNotes,
  exchangeCount,
  onShowJournal,
  draft,
  onDraftChange,
}: ApplicationDetailsCardProps) {
  const field = (key: keyof ApplicationDraft) => ({
    value: (draft?.[key] as string | undefined) ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      draft && onDraftChange({ ...draft, [key]: e.target.value }),
  });

  return (
    <Card className="border-border/80">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          Informations du poste
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {draft ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Entreprise</Label>
                <Input {...field('companyName')} />
              </div>
              <div className="space-y-1.5">
                <Label>Poste</Label>
                <Input {...field('position')} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Type de contrat</Label>
                <Select value={draft.jobType} onValueChange={(jobType) => onDraftChange({ ...draft, jobType: jobType as JobType })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {JOB_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Localisation</Label>
                <Input {...field('location')} />
              </div>
              <div className="space-y-1.5">
                <Label>Salaire</Label>
                <Input {...field('salary')} placeholder="ex: 1200€/mois" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Lien de l'offre</Label>
              <Input {...field('jobUrl')} placeholder="https://..." />
            </div>

            <div className="space-y-1.5">
              <Label>Notes personnelles & mémo</Label>
              <Textarea {...field('notes')} placeholder="Points importants, contacts recruteur, questions..." rows={3} />
            </div>

            <div className="space-y-1.5">
              <Label>Texte de l'offre</Label>
              <Textarea {...field('jobDescription')} placeholder="Collez ici l'annonce de l'offre..." rows={6} />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-muted/40 border border-border/70">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Notes personnelles & mémo
                </span>
                {exchangeCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={onShowJournal} className="h-6 text-[11px] text-primary px-1.5 hover:underline">
                    Voir le journal des échanges ({exchangeCount}) →
                  </Button>
                )}
              </div>
              {generalNotes ? (
                <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{generalNotes}</p>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  Aucune note pour le moment. Cliquez sur "Modifier" pour en ajouter.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Description de l'offre
              </span>
              {application.jobDescription ? (
                <div className="p-4 rounded-lg bg-card border border-border/80 max-h-96 overflow-y-auto">
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{application.jobDescription}</p>
                </div>
              ) : (
                <div className="p-6 text-center border border-dashed border-border rounded-lg text-muted-foreground text-xs">
                  Aucune description collée pour cette offre.
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
