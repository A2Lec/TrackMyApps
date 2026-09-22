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
  Clock,
  CheckCircle2,
  ChevronRight,
  Briefcase,
  Sparkles,
} from 'lucide-react';
import {
  formatDate,
  statusLabels,
  statusColors,
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header sobre & fonctionnel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/40">
        <div className="space-y-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground truncate">
            {greeting} {user?.firstName ? `${user.firstName}` : ''}
          </h1>
          <p className="text-sm text-muted-foreground truncate">
            {user?.school || user?.fieldOfStudy ? (
              <span className="inline-flex items-center gap-1.5">
                {user.school && <span>{user.school}</span>}
                {user.school && user.fieldOfStudy && <span>•</span>}
                {user.fieldOfStudy && <span>{user.fieldOfStudy}</span>}
              </span>
            ) : (
              'Suivi et gestion de vos candidatures'
            )}
          </p>
        </div>

        <div className="flex-shrink-0">
          <EmailVerifiedGuard>
            <Button
              onClick={() => setShowCreateDialog(true)}
              disabled={!isEmailVerified}
              size="sm"
              className="w-full sm:w-auto h-9 font-medium"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Nouvelle candidature
            </Button>
          </EmailVerifiedGuard>
        </div>
      </div>

      {/* 2. Bandeau horizontal unifié des métriques essentielles */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y divide-border/60 sm:divide-y-0 sm:divide-x">
          {/* Candidatures */}
          <Link
            to="/applications"
            className="p-4 sm:p-5 hover:bg-muted/40 transition-colors group"
          >
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Candidatures
            </div>
            <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              {totalApplications}
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {sentThisMonth} envoyée(s) ce mois
            </p>
          </Link>

          {/* Entretiens */}
          <Link
            to="/calendar"
            className="p-4 sm:p-5 hover:bg-muted/40 transition-colors group"
          >
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Entretiens prévus
            </div>
            <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              {scheduledInterviews}
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {nextInterview?.interviewDate
                ? `Prochain : ${formatDate(nextInterview.interviewDate, 'short')}`
                : 'Aucun entretien prévu'}
            </p>
          </Link>

          {/* Taux de réponse */}
          <Link
            to="/analytics"
            className="p-4 sm:p-5 hover:bg-muted/40 transition-colors group"
          >
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Taux de réponse
            </div>
            <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              {responseRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {viewedCount} vue(s) • Moyenne ~20%
            </p>
          </Link>

          {/* Offres */}
          <Link
            to="/applications?status=ACCEPTED"
            className="p-4 sm:p-5 hover:bg-muted/40 transition-colors group"
          >
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Offres acceptées
            </div>
            <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              {acceptedCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {byStatus['AWAITING_RESPONSE'] || 0} en attente de décision
            </p>
          </Link>
        </div>
      </div>

      {/* 3. Double colonne équilibrée : Échéances & Candidatures récentes */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Colonne Gauche : Échéances & Priorités (5 cols sur desktop) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Échéances & Priorités</CardTitle>
                  <CardDescription className="text-xs">
                    Vos prochains rendez-vous et relances
                  </CardDescription>
                </div>
                {hasUrgentItems && (
                  <Badge variant="secondary" className="text-[11px] font-medium">
                    {(nextInterview ? 1 : 0) + pendingReminders.length} à venir
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-4 divide-y divide-border/40">
              {/* Prochain entretien */}
              {nextInterview && (
                <div className="pb-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-purple-700 dark:text-purple-400">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Entretien imminent</span>
                    <span className="text-muted-foreground font-normal ml-auto">
                      {nextInterview.interviewDate
                        ? formatDate(nextInterview.interviewDate, 'long')
                        : 'Date à confirmer'}
                    </span>
                  </div>

                  <div className="text-sm font-semibold text-foreground">
                    {nextInterview.position} chez{' '}
                    <span className="text-primary">{nextInterview.companyName}</span>
                  </div>

                  <div className="flex items-center gap-3 pt-1 text-xs">
                    <Link
                      to={`/interview-prep`}
                      className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                    >
                      <Sparkles className="h-3 w-3" />
                      Simuler cet entretien
                    </Link>
                    <span className="text-muted-foreground">•</span>
                    <Link
                      to={`/applications/${nextInterview.id}`}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Détails de l'offre
                    </Link>
                  </div>
                </div>
              )}

              {/* Rappels urgents */}
              {pendingReminders.length > 0 && (
                <div className={cn('space-y-3', nextInterview ? 'pt-4' : '')}>
                  {pendingReminders.map((reminder) => (
                    <div key={reminder.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {reminder.title}
                        </span>
                        <span className="text-muted-foreground text-[11px]">
                          {formatDate(reminder.dueDate, 'short')}
                        </span>
                      </div>
                      {reminder.application && (
                        <p className="text-xs text-muted-foreground pl-4.5">
                          Pour {reminder.application.companyName} ({reminder.application.position})
                        </p>
                      )}
                    </div>
                  ))}
                  <div className="pt-1">
                    <Link
                      to="/reminders"
                      className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-medium"
                    >
                      Consulter tous les rappels
                      <ArrowRight className="h-3 w-3 ml-0.5" />
                    </Link>
                  </div>
                </div>
              )}

              {/* État apaisé si rien à signaler */}
              {!hasUrgentItems && (
                <div className="py-8 text-center space-y-2">
                  <CheckCircle2 className="h-7 w-7 text-muted-foreground/50 mx-auto" />
                  <p className="text-sm font-medium text-foreground">Tout est sous contrôle !</p>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    Aucun entretien urgent ni relance en attente. Vos démarches sont parfaitement à jour.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Colonne Droite : Candidatures récentes (7 cols sur desktop) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Dernières candidatures</CardTitle>
                  <CardDescription className="text-xs">
                    Vos opportunités les plus récentes
                  </CardDescription>
                </div>
                <Link
                  to="/applications"
                  className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
                >
                  Voir le Kanban
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {dashboard?.recentApplications && dashboard.recentApplications.length > 0 ? (
                <div className="divide-y divide-border/40">
                  {dashboard.recentApplications.slice(0, 5).map((app) => (
                    <Link
                      key={app.id}
                      to={`/applications/${app.id}`}
                      className="flex items-center justify-between p-3.5 sm:px-5 sm:py-3.5 hover:bg-muted/40 transition-colors group"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
                          {app.companyName}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5 truncate">
                          <span>{app.position}</span>
                          {app.jobType && (
                            <>
                              <span>•</span>
                              <span>{jobTypeLabels[app.jobType] || app.jobType}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 flex-shrink-0">
                        <Badge
                          variant="secondary"
                          className={cn(
                            'text-[11px] font-medium border-0',
                            statusColors[app.status]
                          )}
                        >
                          {statusLabels[app.status]}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-foreground transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center space-y-2 p-4">
                  <Briefcase className="h-7 w-7 text-muted-foreground/50 mx-auto" />
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

      {/* 4. Répartition discrète par statut */}
      <div className="rounded-xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Répartition globale
          </h2>
          <Link to="/applications" className="text-xs text-primary hover:underline font-medium">
            Ouvrir la vue complète →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {STATUS_ORDER.map((st) => (
            <Link
              key={st}
              to={`/applications?status=${st}`}
              className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-muted/30 hover:bg-muted/70 border border-border/40 transition-colors text-center"
            >
              <span className="text-base font-semibold text-foreground">
                {byStatus[st] || 0}
              </span>
              <span className="text-[11px] text-muted-foreground truncate w-full mt-0.5">
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
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/40">
        <div className="space-y-2">
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
