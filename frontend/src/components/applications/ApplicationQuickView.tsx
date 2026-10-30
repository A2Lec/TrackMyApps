import { useNavigate } from 'react-router';
import { Calendar, ChevronRight, DollarSign, ExternalLink, FileText, MapPin, Trash2 } from 'lucide-react';
import type { Application, ApplicationStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { StatusBadge, StatusDot, ContractTag } from '@/components/StatusBadge';
import { cn, formatDate, isSafeUrl } from '@/lib/utils';
import { ALL_STATUSES, STATUS_LABELS } from '@/constants/labels';

interface ApplicationQuickViewProps {
  application: Application | null;
  onClose: () => void;
  onStatusChange: (status: ApplicationStatus) => void;
  onDelete: () => void;
}

/** Side drawer with the key facts of an application and a status switcher */
export function ApplicationQuickView({ application, onClose, onStatusChange, onDelete }: ApplicationQuickViewProps) {
  const navigate = useNavigate();

  return (
    <Sheet open={!!application} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="flex flex-col h-full p-6">
        {application && (
          <div className="flex flex-col h-full space-y-6">
            <SheetHeader className="text-left space-y-2 pb-4 border-b border-border/70">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center font-semibold text-sm text-primary flex-shrink-0">
                  {application.companyName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <SheetTitle className="text-xl font-semibold truncate">{application.position}</SheetTitle>
                  <SheetDescription className="text-sm font-medium text-foreground/80 truncate">
                    {application.companyName}
                  </SheetDescription>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <StatusBadge status={application.status} variant="chip" />
                <ContractTag jobType={application.jobType} />
              </div>
            </SheetHeader>

            <div className="space-y-2 bg-muted/40 p-3 rounded-lg border border-border/70">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Changer le statut
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {ALL_STATUSES.map((status) => (
                  <button
                    key={status}
                    onClick={() => onStatusChange(status)}
                    className={cn(
                      'flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors text-left',
                      application.status === status
                        ? 'border-primary bg-primary-soft text-foreground font-semibold'
                        : 'border-transparent hover:bg-accent text-muted-foreground'
                    )}
                  >
                    <StatusDot status={status} />
                    <span className="truncate">{STATUS_LABELS[status]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-border/70 bg-card/50">
                  <span className="text-muted-foreground block mb-1 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> Date candidature
                  </span>
                  <span className="font-semibold text-foreground">{formatDate(application.applicationDate, 'long')}</span>
                </div>

                <div className="p-3 rounded-lg border border-border/70 bg-card/50">
                  <span className="text-muted-foreground block mb-1 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> Localisation
                  </span>
                  <span className="font-semibold text-foreground truncate block">{application.location || 'Non précisée'}</span>
                </div>

                {application.salary && (
                  <div className="p-3 rounded-lg border border-border/70 bg-card/50 col-span-2">
                    <span className="text-muted-foreground block mb-1 flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5" /> Rémunération
                    </span>
                    <span className="font-semibold text-foreground">{application.salary}</span>
                  </div>
                )}
              </div>

              {isSafeUrl(application.jobUrl) && (
                <div className="p-3 rounded-lg border border-border/70 bg-card/50">
                  <span className="text-xs text-muted-foreground block mb-1">Annonce en ligne</span>
                  <a
                    href={application.jobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary font-medium hover:underline flex items-center gap-1 truncate"
                  >
                    <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                    {application.jobUrl}
                  </a>
                </div>
              )}

              {application.notes && (
                <div className="p-3 rounded-lg border border-border/70 bg-card/50">
                  <span className="text-xs font-semibold text-muted-foreground block mb-1">Notes personnelles</span>
                  <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">{application.notes}</p>
                </div>
              )}

              {(application.cvUsed || application.lmUsed) && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground block">Documents utilisés</span>
                  {application.cvUsed && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-xs">
                      <FileText className="h-3.5 w-3.5 text-primary" />
                      <span className="font-medium truncate">{application.cvUsed.name}</span>
                      <Badge variant="outline" className="ml-auto text-[10px]">CV</Badge>
                    </div>
                  )}
                  {application.lmUsed && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-xs">
                      <FileText className="h-3.5 w-3.5 text-status-interview" />
                      <span className="font-medium truncate">{application.lmUsed.name}</span>
                      <Badge variant="outline" className="ml-auto text-[10px]">LM</Badge>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-border/70 flex items-center justify-between gap-3">
              <Button variant="destructive" size="sm" onClick={onDelete} className="text-xs">
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Supprimer
              </Button>

              <Button size="sm" onClick={() => navigate(`/applications/${application.id}`)} className="text-xs font-medium">
                Fiche complète 360°
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
