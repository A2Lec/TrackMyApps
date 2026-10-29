import { toast } from 'sonner';
import { documentsService } from '@/services/documents.service';

export function openDocument(id: string) {
  documentsService.open(id).catch(() => toast.error("Impossible d'ouvrir le document"));
}
