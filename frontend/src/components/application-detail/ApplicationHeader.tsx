import { Building2, Calendar, DollarSign, Edit, ExternalLink, MapPin, Save, Trash2 } from 'lucide-react';
import type { Application, ApplicationStatus } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusDot, ContractTag } from '@/components/StatusBadge';
import { STATUS_ORDER, cn, formatDate, isSafeUrl, statusLabels } from '@/lib/utils';

interface ApplicationHeaderProps {
  application: Application;
  isEditing: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
  onStatusChange: (status: ApplicationStatus) => void;
  isChangingStatus: boolean;
}

/** Position, company, key facts, edit/delete actions and the status selector */
export function ApplicationHeader({
  application,
  isEditing,
  isSaving,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
  onStatusChange,
  isChangingStatus,
}: ApplicationHeaderProps) {
  return (
    <Card className="border-border/80 bg-card/90 backdrop-blur-md overflow-hidden">
      <CardContent className="p-4 sm:p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-lg bg-primary-soft flex items-center justify-center font-mono font-semibold text-lg text-primary flex-shrink-0">
              {application.companyName.slice(0, 2).toUpperCase()}
            </div>

            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">{application.position}</h1>
                <ContractTag jobType={application.jobType} />
              </div>

              <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground flex-wrap pt-0.5">
                <span className="font-semibold text-foreground flex items-center gap-1">
                  <Building2 className="h-4 w-4 text-primary" />
                  {application.companyName}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {application.location || 'Localisation non précisée'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Postulé le {formatDate(application.applicationDate, 'long')}
                </span>
                {application.salary && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-medium text-foreground/90">
                      <DollarSign className="h-3.5 w-3.5" />
                      {application.salary}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start flex-wrap">
            {isSafeUrl(application.jobUrl) && (
              <Button variant="outline" size="sm" asChild className="h-8 text-xs">
                <a href={application.jobUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  Annonce
                </a>
              </Button>
            )}

            {isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={onCancelEdit} className="h-8 text-xs">
                  Annuler
                </Button>
                <Button size="sm" onClick={onSave} disabled={isSaving} className="h-8 text-xs">
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  Enregistrer
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={onEdit} className="h-8 text-xs">
                <Edit className="h-3.5 w-3.5 mr-1.5" />
                Modifier
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
              aria-label="Supprimer la candidature"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="pt-2 border-t border-border/60">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
            Statut d'avancement
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {STATUS_ORDER.map((status) => (
              <button
                key={status}
                onClick={() => onStatusChange(status)}
                disabled={isChangingStatus}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0',
                  application.status === status
                    ? 'border-primary bg-primary-soft text-foreground font-semibold'
                    : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <StatusDot status={status} />
                <span>{statusLabels[status]}</span>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
