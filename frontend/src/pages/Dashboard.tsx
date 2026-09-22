import { useState, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { analyticsService } from '@/services/analytics.service';
import { remindersService } from '@/services/reminders.service';
import { applicationsService } from '@/services/applications.service';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmailVerifiedGuard, useEmailVerified } from '@/components/EmailVerifiedGuard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Briefcase,
  Sparkles,
} from 'lucide-react';
import {
  formatDate,
  statusLabels,
  statusColors,
  statusDotColors,
  jobTypeLabels,
  STATUS_ORDER,
  cn,
} from '@/lib/utils';
import { ApplicationForm } from '@/components/ApplicationForm';

export function DashboardPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isEmailVerified = useEmailVerified();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const submitRef = useRef<(() => void) | null>(null);

  // Queries
  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: analyticsService.getDashboard,
  });

  const { data: upcomingReminders, isLoading: remindersLoading } = useQuery({
    queryKey: ['upcomingReminders'],
    queryFn: () => remindersService.getUpcoming(7),
  });

  // Creation Mutation
  const createMutation = useMutation({
    mutationFn: applicationsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setShowCreateDialog(false);
      toast.success('Candidature créée avec succès');
    },
    onError: (error: any) => {
      toast.error('Erreur: ' + (error.response?.data?.message || error.message || 'Erreur inconnue'));
    },
  });

  // Dynamic greeting based on current time
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }, []);

  // Earliest upcoming interview
  const nextInterview = useMemo(() => {
    if (!dashboard?.upcomingInterviews || dashboard.upcomingInterviews.length === 0) return null;
    return [...dashboard.upcomingInterviews].sort((a, b) => {
      const dateA = a.interviewDate ? new Date(a.interviewDate).getTime() : Infinity;
      const dateB = b.interviewDate ? new Date(b.interviewDate).getTime() : Infinity;
      return dateA - dateB;
    })[0];
  }, [dashboard?.upcomingInterviews]);

  // Pending reminders list
  const pendingReminders = useMemo(() => {
    if (!upcomingReminders || !Array.isArray(upcomingReminders)) return [];
    return upcomingReminders.filter((r) => !r.isCompleted).slice(0, 3);
  }, [upcomingReminders]);

  if (dashboardLoading || remindersLoading) {
    return <DashboardSkeleton />;
  }

  const byStatus = dashboard?.statusOverview || dashboard?.byStatus || {};
  const totalApplications = dashboard?.totalApplications ?? 0;
  const sentThisMonth = dashboard?.sentThisMonth ?? 0;
  const scheduledInterviews = dashboard?.scheduledInterviews ?? 0;
  const responseRate = dashboard?.responseRate ?? 0;
  const viewedCount = byStatus['VIEWED'] || 0;
  const acceptedCount = byStatus['ACCEPTED'] || 0;

  const hasUrgentItems = Boolean(nextInterview || pendingReminders.length > 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden">
      {/* 1. Header sobre & fonctionnel avec micro-animation d'arrivée */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/40 w-full min-w-0 animate-in fade-in-50 duration-300 fill-mode-both">
        <div className="space-y-1 min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground truncate">
            {greeting} {user?.firstName ? `${user.firstName}` : ''}
          </h1>
          <p className="text-sm text-muted-foreground truncate">
            {user?.school || user?.fieldOfStudy ? (
              <span className="inline-flex items-center gap-1.5 flex-wrap">
                {user.school && <span>{user.school}</span>}
                {user.school && user.fieldOfStudy && (
                  <span className="text-muted-foreground/60">•</span>
                )}
                {user.fieldOfStudy && <span>{user.fieldOfStudy}</span>}
              </span>
            ) : (
              'Suivi et gestion de vos candidatures'
            )}
          </p>
        </div>

        <div className="flex-shrink-0 w-full sm:w-auto">
          <EmailVerifiedGuard>
            <Button
              onClick={() => setShowCreateDialog(true)}
              disabled={!isEmailVerified}
              size="sm"
              className="w-full sm:w-auto h-9 font-medium shadow-xs"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Nouvelle candidature
            </Button>
          </EmailVerifiedGuard>
        </div>
      </div>

      {/* 2. Bandeau horizontal unifié des métriques essentielles avec subtiles touches de couleur */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden w-full min-w-0 animate-in fade-in-50 slide-in-from-bottom-2 duration-500 fill-mode-both">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y divide-border/60 sm:divide-y-0 sm:divide-x w-full">
          {/* Candidatures (accent bleu doux) */}
          <Link
            to="/applications"
            className="p-3.5 sm:p-5 hover:bg-muted/40 transition-colors group relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
                Candidatures
              </span>
              <span className="h-2 w-2 rounded-full bg-blue-500/80 flex-shrink-0 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              {totalApplications}
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              <span className="text-blue-600 dark:text-blue-400 font-medium">{sentThisMonth}</span> envoyée(s) ce mois
            </p>
          </Link>

          {/* Entretiens (accent violet doux) */}
          <Link
            to="/calendar"
            className="p-3.5 sm:p-5 hover:bg-muted/40 transition-colors group relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
                Entretiens prévus
              </span>
              <span className="h-2 w-2 rounded-full bg-purple-500/80 flex-shrink-0 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              {scheduledInterviews}
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {nextInterview?.interviewDate ? (
                <span className="text-purple-600 dark:text-purple-400 font-medium">
                  Prochain : {formatDate(nextInterview.interviewDate, 'short')}
                </span>
              ) : (
                'Aucun entretien prévu'
              )}
            </p>
          </Link>

          {/* Taux de réponse (accent indigo doux) */}
          <Link
            to="/analytics"
            className="p-3.5 sm:p-5 hover:bg-muted/40 transition-colors group relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
                Taux de réponse
              </span>
              <span className="h-2 w-2 rounded-full bg-indigo-500/80 flex-shrink-0 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              {responseRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {viewedCount} vue(s) • <span className="text-muted-foreground/80">Moyenne ~20%</span>
            </p>
          </Link>

          {/* Offres (accent émeraude doux) */}
          <Link
            to="/applications?status=ACCEPTED"
            className="p-3.5 sm:p-5 hover:bg-muted/40 transition-colors group relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
                Offres acceptées
              </span>
              <span className="h-2 w-2 rounded-full bg-emerald-500/80 flex-shrink-0 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400">
              {acceptedCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {byStatus['AWAITING_RESPONSE'] || 0} en attente de décision
            </p>
          </Link>
        </div>
      </div>

      {/* 3. Double colonne équilibrée : Échéances & Candidatures récentes (avec protection anti-débordement stricte) */}
      <div className="grid gap-6 lg:grid-cols-12 items-start w-full min-w-0">
        {/* Colonne Gauche : Échéances & Priorités (5 cols sur desktop) */}
        <div className="lg:col-span-5 space-y-4 w-full min-w-0 animate-in fade-in-50 slide-in-from-bottom-2 duration-500 delay-100 fill-mode-both">
          <Card className="border-border/80 shadow-xs w-full min-w-0 overflow-hidden">
            <CardHeader className="p-4 sm:p-5 border-b border-border/40 w-full min-w-0">
              <div className="flex items-center justify-between gap-2 w-full min-w-0">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base font-semibold truncate">Échéances & Priorités</CardTitle>
                  <CardDescription className="text-xs truncate">
                    Vos prochains rendez-vous et relances
                  </CardDescription>
                </div>
                {hasUrgentItems && (
                  <Badge variant="secondary" className="text-[11px] font-medium flex-shrink-0 bg-muted/80">
                    {(nextInterview ? 1 : 0) + pendingReminders.length} à venir
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 divide-y divide-border/40 w-full min-w-0">
              {/* Prochain entretien avec liseré violet subtil */}
              {nextInterview && (
                <div className="pb-4 space-y-2 w-full min-w-0 border-l-2 border-l-purple-500/70 pl-3 -ml-1">
                  <div className="flex flex-wrap items-center justify-between gap-1 text-xs font-medium text-purple-700 dark:text-purple-400 w-full min-w-0">
                    <span className="inline-flex items-center gap-1.5 flex-shrink-0">
                      <Calendar className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                      Entretien imminent
                    </span>
                    <span className="text-muted-foreground font-normal text-[11px] truncate">
                      {nextInterview.interviewDate
                        ? formatDate(nextInterview.interviewDate, 'long')
                        : 'Date à confirmer'}
                    </span>
                  </div>

                  <div className="text-sm font-semibold text-foreground truncate w-full">
                    {nextInterview.position} chez{' '}
                    <span className="text-primary font-bold">{nextInterview.companyName}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs w-full min-w-0">
                    <Link
                      to={`/interview-prep`}
                      className="text-purple-600 dark:text-purple-400 hover:underline font-medium inline-flex items-center gap-1 truncate"
                    >
                      <Sparkles className="h-3 w-3 flex-shrink-0" />
                      <span>Simuler cet entretien</span>
                    </Link>
                    <span className="text-muted-foreground/60 hidden sm:inline">•</span>
                    <Link
                      to={`/applications/${nextInterview.id}`}
                      className="text-muted-foreground hover:text-foreground text-[11px] truncate"
                    >
                      Détails de l'offre
                    </Link>
                  </div>
                </div>
              )}

              {/* Rappels urgents avec puces ambre subtiles */}
              {pendingReminders.length > 0 && (
                <div className={cn('space-y-3 w-full min-w-0', nextInterview ? 'pt-4' : '')}>
                  {pendingReminders.map((reminder) => (
                    <div key={reminder.id} className="space-y-1 w-full min-w-0">
                      <div className="flex items-center justify-between gap-2 text-xs w-full min-w-0">
                        <span className="font-medium text-foreground flex items-center gap-1.5 min-w-0 truncate">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                          <span className="truncate">{reminder.title}</span>
                        </span>
                        <span className="text-muted-foreground text-[11px] flex-shrink-0">
                          {formatDate(reminder.dueDate, 'short')}
                        </span>
                      </div>
                      {reminder.application && (
                        <p className="text-xs text-muted-foreground pl-3 truncate">
                          Pour {reminder.application.companyName} ({reminder.application.position})
                        </p>
                      )}
                    </div>
                  ))}
                  <div className="pt-1">
                    <Link
                      to="/reminders"
                      className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-medium group"
                    >
                      <span>Consulter tous les rappels</span>
                      <ArrowRight className="h-3 w-3 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              )}

              {/* État apaisé si rien à signaler */}
              {!hasUrgentItems && (
                <div className="py-8 text-center space-y-2 w-full min-w-0">
                  <div className="h-9 w-9 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto text-emerald-600">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Tout est sous contrôle !</p>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    Aucun entretien urgent ni relance en attente. Vos démarches sont parfaitement à jour.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Colonne Droite : Candidatures récentes (7 cols sur desktop, zéro overflow sur mobile) */}
        <div className="lg:col-span-7 space-y-4 w-full min-w-0 animate-in fade-in-50 slide-in-from-bottom-2 duration-500 delay-150 fill-mode-both">
          <Card className="border-border/80 shadow-xs w-full min-w-0 overflow-hidden">
            <CardHeader className="p-4 sm:p-5 border-b border-border/40 w-full min-w-0">
              <div className="flex items-center justify-between gap-2 w-full min-w-0">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base font-semibold truncate">Dernières candidatures</CardTitle>
                  <CardDescription className="text-xs truncate">
                    Vos opportunités les plus récentes
                  </CardDescription>
                </div>
                <Link
                  to="/applications"
                  className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-0.5 flex-shrink-0"
                >
                  <span>Voir le Kanban</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0 w-full min-w-0 overflow-hidden">
              {dashboard?.recentApplications && dashboard.recentApplications.length > 0 ? (
                <div className="divide-y divide-border/40 w-full min-w-0">
                  {dashboard.recentApplications.slice(0, 5).map((app) => (
                    <Link
                      key={app.id}
                      to={`/applications/${app.id}`}
                      className="flex items-center justify-between p-3.5 sm:px-5 sm:py-3.5 hover:bg-muted/40 transition-colors group w-full min-w-0 overflow-hidden"
                    >
                      {/* Monogramme discret et texte avec flex-1 et min-w-0 */}
                      <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                        <div className="h-8 w-8 rounded-lg bg-muted/80 border border-border/60 flex items-center justify-center font-bold text-xs text-foreground/80 flex-shrink-0 group-hover:border-primary/40 group-hover:text-primary transition-colors">
                          {app.companyName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
                            {app.companyName}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5 truncate">
                            <span className="truncate">{app.position}</span>
                            {app.jobType && (
                              <>
                                <span className="text-muted-foreground/60 flex-shrink-0">•</span>
                                <span className="flex-shrink-0">{jobTypeLabels[app.jobType] || app.jobType}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Badge et chevron compacts flex-shrink-0 */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge
                          variant="secondary"
                          className={cn(
                            'text-[10px] sm:text-[11px] font-medium border-0 px-2 py-0.5 whitespace-nowrap',
                            statusColors[app.status]
                          )}
                        >
                          {statusLabels[app.status]}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-foreground transition-colors flex-shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center space-y-2 p-4 w-full min-w-0">
                  <div className="h-9 w-9 rounded-full bg-muted/80 flex items-center justify-center mx-auto text-muted-foreground/60">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Aucune candidature enregistrée</p>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    Commencez par ajouter votre première opportunité pour démarrer le suivi.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 4. Répartition discrète par statut avec pastilles de couleur coordonnées */}
      <div className="rounded-xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs w-full min-w-0 overflow-hidden animate-in fade-in-50 slide-in-from-bottom-2 duration-500 delay-200 fill-mode-both">
        <div className="flex items-center justify-between gap-2 mb-3 w-full min-w-0">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
            Répartition globale
          </h2>
          <Link
            to="/applications"
            className="text-xs text-primary hover:underline font-medium flex-shrink-0"
          >
            Ouvrir la vue complète →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 w-full min-w-0">
          {STATUS_ORDER.map((st) => (
            <Link
              key={st}
              to={`/applications?status=${st}`}
              className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-muted/30 hover:bg-muted/70 border border-border/40 transition-colors text-center w-full min-w-0 overflow-hidden group"
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', statusDotColors[st])} />
                <span className="text-sm font-semibold text-foreground">
                  {byStatus[st] || 0}
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors truncate w-full">
                {statusLabels[st]}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* 5. Modal de création d'une candidature */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvelle candidature</DialogTitle>
            <DialogDescription>
              Renseignez les détails du poste pour l'intégrer à votre cockpit de suivi.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <ApplicationForm
              onSubmit={(data) => createMutation.mutate(data)}
              isSubmitting={createMutation.isPending}
              submitRef={submitRef}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => submitRef.current?.()}
              disabled={createMutation.isPending}
            >
              Créer la candidature
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/40">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>

      <div className="h-28 w-full rounded-xl border border-border bg-card p-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 h-full">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-full rounded-lg" />
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <Skeleton className="h-80 rounded-xl lg:col-span-5" />
        <Skeleton className="h-80 rounded-xl lg:col-span-7" />
      </div>
    </div>
  );
}
