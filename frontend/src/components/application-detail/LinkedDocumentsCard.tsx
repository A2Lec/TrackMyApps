import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Plus, X } from 'lucide-react';
import type { Application, Document } from '@/types';
import { documentsService } from '@/services/documents.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { openDocument } from '@/lib/documents';

const NONE = 'none';

export interface DocumentLinks {
  cvUsedId?: string | null;
  lmUsedId?: string | null;
}

interface LinkedDocumentsCardProps {
  application: Application;
  onChangeLinks: (links: DocumentLinks) => void;
  isSaving: boolean;
}

/** CV and cover letter used for the application, with link/unlink actions */
export function LinkedDocumentsCard({ application, onChangeLinks, isSaving }: LinkedDocumentsCardProps) {
  const [showDialog, setShowDialog] = useState(false);

  const linked = [
    { kind: 'CV', doc: application.cvUsed, color: 'text-status-sent', unlink: { cvUsedId: null }, title: 'Détacher ce CV' },
    { kind: 'LM', doc: application.lmUsed, color: 'text-status-interview', unlink: { lmUsedId: null }, title: 'Détacher cette lettre' },
  ].filter((item): item is typeof item & { doc: Document } => Boolean(item.doc));

  return (
    <Card className="border-border/80">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          Documents liés
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={() => setShowDialog(true)} className="h-7 text-xs px-2 text-primary">
          <Plus className="h-3 w-3 mr-1" />
          Gérer
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {linked.length > 0 ? (
          <div className="space-y-2">
            {linked.map(({ kind, doc, color, unlink, title }) => (
              <div key={kind} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 border border-border/60 text-xs">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className={`h-7 w-7 rounded-lg bg-secondary ${color} flex items-center justify-center flex-shrink-0 font-semibold text-[10px]`}>
                    {kind}
                  </div>
                  <button
                    type="button"
                    onClick={() => openDocument(doc.id)}
                    className="font-semibold text-foreground truncate text-left hover:text-primary hover:underline"
                  >
                    {doc.name}
                  </button>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={() => onChangeLinks(unlink)}
                  title={title}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div
            onClick={() => setShowDialog(true)}
            className="p-5 border border-dashed border-border rounded-lg text-center cursor-pointer hover:bg-muted/40 transition-colors"
          >
            <p className="text-xs text-muted-foreground font-medium">Aucun document attaché.</p>
            <span className="text-xs text-primary font-semibold mt-1 inline-block">+ Attacher un CV ou une lettre</span>
          </div>
        )}
      </CardContent>

      {showDialog && (
        <LinkDocumentsDialog
          application={application}
          onClose={() => setShowDialog(false)}
          onSave={(links) => {
            onChangeLinks(links);
            setShowDialog(false);
          }}
          isSaving={isSaving}
        />
      )}
    </Card>
  );
}

function LinkDocumentsDialog({
  application,
  onClose,
  onSave,
  isSaving,
}: {
  application: Application;
  onClose: () => void;
  onSave: (links: DocumentLinks) => void;
  isSaving: boolean;
}) {
  const [cvId, setCvId] = useState(application.cvUsedId ?? NONE);
  const [lmId, setLmId] = useState(application.lmUsedId ?? NONE);

  const { data: cvs = [] } = useQuery({ queryKey: ['documents', 'CV'], queryFn: () => documentsService.getAll('CV') });
  const { data: letters = [] } = useQuery({
    queryKey: ['documents', 'LETTRE_MOTIVATION'],
    queryFn: () => documentsService.getAll('LETTRE_MOTIVATION'),
  });

  const picker = (label: string, value: string, onChange: (value: string) => void, docs: Document[], placeholder: string, noneLabel: string) => (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="text-xs">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>{noneLabel}</SelectItem>
          {docs.map((doc) => (
            <SelectItem key={doc.id} value={doc.id} className="text-xs">
              {doc.name} {doc.version && `(v${doc.version})`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Documents associés</DialogTitle>
          <DialogDescription>Sélectionnez le CV et la lettre de motivation utilisés pour cette candidature.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-3">
          {picker('Curriculum Vitae (CV)', cvId, setCvId, cvs, 'Choisir un CV', 'Aucun')}
          {picker('Lettre de motivation', lmId, setLmId, letters, 'Choisir une lettre', 'Aucune')}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={() => onSave({ cvUsedId: cvId === NONE ? null : cvId, lmUsedId: lmId === NONE ? null : lmId })}
            disabled={isSaving}
          >
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
