import { Link } from 'react-router';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Building2, Calendar, ChevronRight, ExternalLink, MapPin, MoreVertical, Trash2 } from 'lucide-react';
import type { Application } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { StatusBadge, ContractTag } from '@/components/StatusBadge';
import { cn, formatDate } from '@/lib/utils';

// Sub-statuses merged into a Kanban column stay visible on the card
const SUB_STATUSES_SHOWN = ['VIEWED', 'AWAITING_RESPONSE', 'GHOSTED'];

interface ApplicationCardProps {
  application: Application;
  /** Placeholder left in the column while the card is dragged */
  isGhost?: boolean;
  /** Copy following the pointer while dragging */
  isOverlay?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
}

export function ApplicationCard({ application, isGhost, isOverlay, onClick, onDelete }: ApplicationCardProps) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        'cursor-grab active:cursor-grabbing bg-card/95 hover:border-primary/50 hover:-translate-y-0.5 transition-all duration-150 border-border/80 rounded-lg group relative overflow-hidden select-none w-full',
        isGhost && 'opacity-25 border-dashed border-primary/40 bg-muted/20',
        isOverlay && 'w-72 sm:w-80 shadow-drag rotate-[3deg] motion-reduce:rotate-0 border-primary bg-card z-50 cursor-grabbing pointer-events-none'
      )}
    >
      <CardContent className="p-3.5 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors truncate">
              {application.position}
            </h4>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
              <Building2 className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/80" />
              <span className="font-medium text-foreground/90 truncate">{application.companyName}</span>
            </div>
          </div>

          {onDelete && (
            // Keep menu clicks from opening the card or starting a drag
            <div onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 -mr-1 text-muted-foreground hover:text-foreground">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={onClick}>
                    <ChevronRight className="mr-2 h-4 w-4" />
                    Aperçu rapide
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={`/applications/${application.id}`}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Fiche complète
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          <ContractTag jobType={application.jobType} />
          {SUB_STATUSES_SHOWN.includes(application.status) && <StatusBadge status={application.status} className="text-xs" />}
          {application.location && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate max-w-[120px]">{application.location}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span className="font-mono">{formatDate(application.applicationDate)}</span>
          </div>
          {application.salary && (
            <span className="font-medium text-foreground/80 truncate max-w-[110px]">{application.salary}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface SortableApplicationCardProps {
  application: Application;
  onClick: () => void;
  onDelete: () => void;
}

/** Draggable card of the Kanban board */
export function SortableApplicationCard({ application, onClick, onDelete }: SortableApplicationCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: application.id,
    data: { type: 'Card', status: application.status, application },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: isDragging ? undefined : CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
    >
      <ApplicationCard application={application} isGhost={isDragging} onClick={onClick} onDelete={onDelete} />
    </div>
  );
}
