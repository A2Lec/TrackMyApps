import { useRef } from 'react';
import type { Application } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ApplicationForm } from '@/components/ApplicationForm';
import type { ApplicationFormData } from '@/schemas/application';

interface CreateApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialStatus: 'DRAFT' | 'SENT';
  onSubmit: (data: ApplicationFormData) => void;
  isSubmitting: boolean;
}

export function CreateApplicationDialog({ open, onOpenChange, initialStatus, onSubmit, isSubmitting }: CreateApplicationDialogProps) {
  // The submit button lives in the dialog footer, outside the form
  const submitRef = useRef<(() => void) | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle candidature</DialogTitle>
          <DialogDescription>Ajoutez une candidature à suivre dans votre tableau de bord</DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <ApplicationForm
            defaultValues={{ status: initialStatus }}
            onSubmit={onSubmit}
            submitRef={submitRef}
          />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={() => submitRef.current?.()} disabled={isSubmitting}>
            Créer la candidature
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteApplicationDialogProps {
  application: Application | null;
  onCancel: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteApplicationDialog({ application, onCancel, onConfirm, isDeleting }: DeleteApplicationDialogProps) {
  return (
    <Dialog open={!!application} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer la candidature</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer votre candidature chez <strong>{application?.companyName}</strong>
            {application?.position ? ` (poste : ${application.position})` : ''} ? Cette action est irréversible.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel} disabled={isDeleting}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
