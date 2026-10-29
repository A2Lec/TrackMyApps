import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { applicationsService } from '@/services/applications.service';
import { remindersService } from '@/services/reminders.service';
import { applyOptimisticStatusMove } from '@/lib/kanban';
import { getErrorMessage } from '@/lib/errors';
import { formatDate } from '@/lib/utils';
import type { Application, ApplicationStatus, KanbanColumns } from '@/types';

const KANBAN_KEY = ['applications', 'kanban'];
const FOLLOW_UP_DELAY_DAYS = 7;

/** Offer a follow-up reminder one week after an application is sent */
function proposeFollowUp(application: Application, onCreated: () => void) {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + FOLLOW_UP_DELAY_DAYS);
  dueDate.setHours(9, 0, 0, 0);

  toast(`Planifier une relance pour ${application.companyName} ?`, {
    description: `Relance recommandée le ${formatDate(dueDate)} (J+7)`,
    duration: 8000,
    action: {
      label: 'Planifier à J+7',
      onClick: () => {
        remindersService
          .create({
            applicationId: application.id,
            title: `Relancer ${application.companyName}`,
            description: `Relance suite à candidature pour le poste de ${application.position}`,
            type: 'FOLLOW_UP',
            dueDate: dueDate.toISOString(),
          })
          .then(() => {
            onCreated();
            toast.success(`Rappel de relance planifié pour ${application.companyName} !`);
          })
          .catch(() => toast.error('Erreur lors de la création du rappel'));
      },
    },
  });
}

/**
 * Change an application's status with an optimistic Kanban update (rolled back
 * on error), then suggest a follow-up when it moves to "Envoyée"
 */
export function useUpdateApplicationStatus(onUpdated?: (application: Application) => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) => applicationsService.updateStatus(id, status),
    onMutate: async ({ id, status }) => {
      // Outgoing refetches would overwrite the optimistic move
      await queryClient.cancelQueries({ queryKey: KANBAN_KEY });
      const previousKanban = queryClient.getQueryData<KanbanColumns>(KANBAN_KEY);
      if (previousKanban) {
        queryClient.setQueryData(KANBAN_KEY, applyOptimisticStatusMove(previousKanban, id, status));
      }
      return { previousKanban };
    },
    onError: (err, _vars, context) => {
      if (context?.previousKanban) {
        queryClient.setQueryData(KANBAN_KEY, context.previousKanban);
      }
      toast.error(getErrorMessage(err, 'Erreur lors du changement de statut'));
    },
    onSuccess: (updated) => {
      onUpdated?.(updated);
      toast.success('Statut mis à jour');
      if (updated.status === 'SENT') {
        proposeFollowUp(updated, () => {
          queryClient.invalidateQueries({ queryKey: ['reminders'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
