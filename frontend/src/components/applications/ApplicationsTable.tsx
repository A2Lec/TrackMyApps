import { Link } from 'react-router';
import { ChevronRight, ExternalLink, MoreVertical, Trash2 } from 'lucide-react';
import type { Application } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { StatusBadge, ContractTag } from '@/components/StatusBadge';
import { formatDate } from '@/lib/utils';

interface ApplicationsTableProps {
  applications: Application[];
  onOpen: (application: Application) => void;
  onDelete: (application: Application) => void;
}

/** List view of the applications page */
export function ApplicationsTable({ applications, onOpen, onDelete }: ApplicationsTableProps) {
  return (
    <Card className="overflow-hidden border-border/80">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-sm text-left">
            <thead className="bg-muted/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-3.5 font-semibold">Entreprise</th>
                <th className="p-3.5 font-semibold">Poste</th>
                <th className="p-3.5 font-semibold">Contrat</th>
                <th className="p-3.5 font-semibold">Statut</th>
                <th className="p-3.5 font-semibold">Date</th>
                <th className="p-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {applications.length > 0 ? (
                applications.map((app) => (
                  <tr key={app.id} onClick={() => onOpen(app)} className="hover:bg-muted/40 transition-colors cursor-pointer group">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center font-semibold text-xs text-primary flex-shrink-0">
                          {app.companyName.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {app.companyName}
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5 text-muted-foreground font-medium">{app.position}</td>
                    <td className="p-3.5">
                      <ContractTag jobType={app.jobType} />
                    </td>
                    <td className="p-3.5">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="p-3.5 text-muted-foreground font-mono text-xs">{formatDate(app.applicationDate)}</td>
                    <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => onOpen(app)}>
                            <ChevronRight className="mr-2 h-4 w-4" />
                            Aperçu rapide
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/applications/${app.id}`}>
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Fiche complète
                            </Link>
                          </DropdownMenuItem>
                          {app.jobUrl && (
                            <DropdownMenuItem asChild>
                              <a href={app.jobUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Voir l'annonce
                              </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(app)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Aucune candidature ne correspond à vos filtres.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
