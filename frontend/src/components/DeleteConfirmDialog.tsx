import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  itemName?: string;
  onConfirm: () => void;
  isPending?: boolean;
  showCompanyOption?: boolean;
  onConfirmWithCompany?: (deleteCompany: boolean) => void;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  itemName,
  onConfirm,
  isPending = false,
  showCompanyOption = false,
  onConfirmWithCompany,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
            {itemName && (
              <>
                {' pour '}
                <strong>{itemName}</strong>
              </>
            )}
            {' ? Cette action est irréversible.'}
          </DialogDescription>
        </DialogHeader>
        
        {showCompanyOption && onConfirmWithCompany ? (
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Cette candidature est liée à l'entreprise <strong>{itemName}</strong>.
              Souhaitez-vous également supprimer l'entreprise si elle n'a plus d'autres candidatures ?
            </p>
            <div className="flex flex-col gap-2">
              <Button 
                variant="destructive" 
                onClick={() => onConfirmWithCompany(true)}
                disabled={isPending}
              >
                Supprimer la candidature et l'entreprise
              </Button>
              <Button 
                variant="outline" 
                onClick={() => onConfirmWithCompany(false)}
                disabled={isPending}
              >
                Supprimer uniquement la candidature
              </Button>
            </div>
          </div>
        ) : (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={onConfirm}
              disabled={isPending}
            >
              Supprimer
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface UseDeleteConfirmReturn<T> {
  itemToDelete: T | null;
  showDeleteDialog: (item: T) => void;
  hideDeleteDialog: () => void;
  DeleteDialog: React.ComponentType<Omit<DeleteConfirmDialogProps, 'open' | 'onOpenChange'>>;
}

export function useDeleteConfirm<T>(): UseDeleteConfirmReturn<T> {
  const [itemToDelete, setItemToDelete] = useState<T | null>(null);

  const showDeleteDialog = (item: T) => setItemToDelete(item);
  const hideDeleteDialog = () => setItemToDelete(null);

  const DeleteDialog = (props: Omit<DeleteConfirmDialogProps, 'open' | 'onOpenChange'>) => (
    <DeleteConfirmDialog
      open={!!itemToDelete}
      onOpenChange={hideDeleteDialog}
      {...props}
    />
  );

  return {
    itemToDelete,
    showDeleteDialog,
    hideDeleteDialog,
    DeleteDialog,
  };
}
