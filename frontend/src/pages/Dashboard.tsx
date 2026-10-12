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
import { DashboardSkeleton } from '@/components/loading/DashboardSkeleton';
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
  ExternalLink,
  Download,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  getGoogleCalendarUrl,
  getOutlookCalendarUrl,
  downloadIcsFile,
  generateIcsContent,
} from '@/lib/calendarExport';
import {
  formatDate,
  statusLabels,
  statusColors,
  jobTypeLabels,
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

  // Days until next interview calculation
  const daysUntilNextInterview = useMemo(() => {
    if (!nextInterview?.interviewDate) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const interviewD = new Date(nextInterview.interviewDate);
    interviewD.setHours(0, 0, 0, 0);
    const diffDays = Math.round((interviewD.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Aujourd'hui !";
    if (diffDays === 1) return 'Demain';
    if (diffDays > 1) return `Dans ${diffDays} jours`;
    return 'Passé';
  }, [nextInterview]);

  const { data: applicationsResponse } = useQuery({
    queryKey: ['applications'],
    queryFn: () => applicationsService.getAll({}, 1, 100),
  });

  // Pending reminders list
  const pendingReminders = useMemo(() => {
    if (!upcomingReminders || !Array.isArray(upcomingReminders)) return [];
    return upcomingReminders.filter((r) => !r.isCompleted).slice(0, 3);
  }, [upcomingReminders]);

  // Suggested follow-ups at J+7 (sent > 5 days ago without active reminder)
  const suggestedFollowUps = useMemo(() => {
    if (!applicationsResponse?.data || !Array.isArray(applicationsResponse.data)) return [];
    const now = new Date();
    return applicationsResponse.data.filter((app) => {
      if (app.status !== 'SENT') return false;
      const sentDate = new Date(app.applicationDate);
      const daysAgo = Math.floor((now.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24));
      const hasActiveReminder = app.reminders?.some((r) => !r.isCompleted);
      return daysAgo >= 5 && daysAgo <= 30 && !hasActiveReminder;
    });
  }, [applicationsResponse]);

  const byStatus = dashboard?.statusOverview || dashboard?.byStatus || {};
  const sentThisMonth = dashboard?.sentThisMonth ?? 0;
  const scheduledInterviews = dashboard?.scheduledInterviews ?? 0;
  const acceptedCount = byStatus['ACCEPTED'] || 0;

  // Active applications (in progress: Draft, Sent, Interview, Awaiting)
  const activeApplicationsCount = useMemo(() => {
    return (
      (byStatus['DRAFT'] || 0) +
      (byStatus['SENT'] || 0) +
      (byStatus['VIEWED'] || 0) +
      (byStatus['INTERVIEW_SCHEDULED'] || 0) +
      (byStatus['AWAITING_RESPONSE'] || 0)
    );
  }, [byStatus]);

  // Due follow-ups count (overdue + today + suggested J+7)
  const dueFollowUpsCount = useMemo(() => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    const overdueOrToday = (upcomingReminders || []).filter(
      (r) => !r.isCompleted && new Date(r.dueDate) <= now
    ).length;
    return overdueOrToday + suggestedFollowUps.length;
  }, [upcomingReminders, suggestedFollowUps]);

  const handleExportNextInterviewIcs = () => {
    if (!nextInterview?.interviewDate) return;
    const ics = generateIcsContent([
      {
        title: `Entretien ${nextInterview.companyName} (${nextInterview.position})`,
        startDate: nextInterview.interviewDate,
        description: `Entretien pour le poste de ${nextInterview.position} chez ${nextInterview.companyName}.\nSuivi sur TrackMyApps.`,
        location: nextInterview.location || 'Visio / À confirmer',
      },
    ]);
    downloadIcsFile(`entretien_${nextInterview.companyName.toLowerCase().replace(/\s+/g, '_')}.ics`, ics);
    toast.success('Fichier iCal (.ics) téléchargé');
  };

  if (dashboardLoading || remindersLoading) {
    return <DashboardSkeleton />;
  }

  const hasUrgentItems = Boolean(
    nextInterview || pendingReminders.length > 0 || suggestedFollowUps.length > 0
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full min-w-0 overflow-x-hidden">
      {/* 1. Header avec Plan d'action du jour et CTAs rapides */}
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
              "Plan d'action & gestion quotidienne de vos candidatures"
            )}
          </p>
        </div>

        {/* CTAs Rapides : Simulateur IA & Nouvelle candidature */}
        <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto flex-wrap">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="w-full sm:w-auto h-9 font-medium border-primary/30 text-primary hover:bg-primary/5 shadow-xs"
          >
            <Link to="/interview-prep?tab=simulation">
              <Sparkles className="mr-1.5 h-4 w-4 text-primary" />
              Simulateur IA
            </Link>
          </Button>

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

      {/* 2. Bandeau des 4 métriques opérationnelles du plan d'action */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden w-full min-w-0 animate-in fade-in-50 slide-in-from-bottom-2 duration-500 fill-mode-both">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y divide-border/60 sm:divide-y-0 sm:divide-x w-full">
          {/* Compteur 1 : Candidatures actives */}
          <Link
            to="/applications"
            className="p-3.5 sm:p-5 hover:bg-muted/40 transition-colors group relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
                Candidatures actives
              </span>
              <span className="h-2 w-2 rounded-full bg-blue-500/80 flex-shrink-0 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              {activeApplicationsCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              <span className="text-blue-600 dark:text-blue-400 font-medium">{sentThisMonth}</span> envoyée(s) ce mois
            </p>
          </Link>

          {/* Compteur 2 : Relances du jour */}
          <Link
            to="/reminders"
            className="p-3.5 sm:p-5 hover:bg-muted/40 transition-colors group relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
                Relances à effectuer
              </span>
              <span
                className={cn(
                  'h-2 w-2 rounded-full flex-shrink-0 group-hover:scale-110 transition-transform',
                  dueFollowUpsCount > 0 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500/80'
                )}
              />
            </div>
            <div
              className={cn(
                'text-2xl sm:text-3xl font-semibold tracking-tight',
                dueFollowUpsCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'
              )}
            >
              {dueFollowUpsCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {dueFollowUpsCount > 0 ? (
                <span className="text-amber-600 dark:text-amber-400 font-medium">À traiter aujourd'hui</span>
              ) : (
                'Toutes vos relances sont à jour'
              )}
            </p>
          </Link>

          {/* Compteur 3 : Prochain entretien */}
          <Link
            to={nextInterview ? '/reminders?view=calendar' : '/interview-prep?tab=simulation'}
            className="p-3.5 sm:p-5 hover:bg-muted/40 transition-colors group relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
                Prochain entretien
              </span>
              <span className="h-2 w-2 rounded-full bg-purple-500/80 flex-shrink-0 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground truncate">
              {daysUntilNextInterview || (nextInterview?.interviewDate ? formatDate(nextInterview.interviewDate, 'short') : scheduledInterviews > 0 ? `${scheduledInterviews} prévu(s)` : '0')}
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {nextInterview?.interviewDate ? (
                <span className="text-purple-600 dark:text-purple-400 font-medium">
                  {nextInterview.companyName} ({formatDate(nextInterview.interviewDate, 'short')})
                </span>
              ) : (
                'Entraînez-vous avec l’IA'
              )}
            </p>
          </Link>

          {/* Compteur 4 : Offres acceptées & Réussites */}
          <Link
            to="/applications?status=ACCEPTED"
            className="p-3.5 sm:p-5 hover:bg-muted/40 transition-colors group relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
                Offres & Réussites
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
                  <CardTitle className="text-base font-semibold truncate">Plan d'action du jour</CardTitle>
                  <CardDescription className="text-xs truncate">
                    Vos rendez-vous et relances prioritaires
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap">
                  {suggestedFollowUps.length > 0 && (
                    <Badge variant="outline" className="text-[11px] font-semibold bg-primary/10 text-primary border-primary/20">
                      <Sparkles className="h-3 w-3 mr-1" />
                      {suggestedFollowUps.length} relance{suggestedFollowUps.length > 1 ? 's' : ''} suggérée{suggestedFollowUps.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                  {hasUrgentItems && (
                    <Badge variant="secondary" className="text-[11px] font-medium bg-muted/80">
                      {(nextInterview ? 1 : 0) + pendingReminders.length} à venir
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 divide-y divide-border/40 w-full min-w-0">
              {/* Relances recommandées à J+7 */}
              {suggestedFollowUps.length > 0 && (
                <div className="pb-4 w-full min-w-0">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-primary/10 via-blue-500/5 to-transparent border border-primary/25 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        <span>
                          {suggestedFollowUps.length} relance{suggestedFollowUps.length > 1 ? 's' : ''} suggérée{suggestedFollowUps.length > 1 ? 's' : ''} cette semaine
                        </span>
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        Candidature{suggestedFollowUps.length > 1 ? 's' : ''} sans réponse depuis plus de 5 jours.
                      </p>
                    </div>
                    <Button size="sm" asChild className="h-7 text-xs font-semibold px-2.5 shadow-xs flex-shrink-0">
                      <Link to="/reminders">Relancer</Link>
                    </Button>
                  </div>
                </div>
              )}
              {/* Prochain entretien avec liseré violet subtil */}
              {nextInterview && (
                <div className="pb-4 space-y-2 w-full min-w-0 border-l-2 border-l-purple-500/70 pl-3 -ml-1">
                  <div className="flex flex-wrap items-center justify-between gap-1 text-xs font-medium text-purple-700 dark:text-purple-400 w-full min-w-0">
                    <span className="inline-flex items-center gap-1.5 flex-shrink-0">
                      <Calendar className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                      Entretien imminent • {daysUntilNextInterview}
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

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-1 text-xs w-full min-w-0">
                    <Link
                      to={`/interview-prep?tab=simulation`}
                      className="text-purple-600 dark:text-purple-400 hover:underline font-medium inline-flex items-center gap-1 truncate"
                    >
                      <Sparkles className="h-3 w-3 flex-shrink-0" />
                      <span>Simuler cet entretien</span>
                    </Link>
                    <span className="text-muted-foreground/60 hidden sm:inline">•</span>

                    {/* Synchronisation Agenda */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="text-primary hover:underline font-medium inline-flex items-center gap-1 text-xs truncate"
                        >
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          <span>Ajouter à mon agenda</span>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="text-xs">
                        <DropdownMenuItem asChild>
                          <a
                            href={getGoogleCalendarUrl({
                              title: `Entretien ${nextInterview.companyName} (${nextInterview.position})`,
                              startDate: nextInterview.interviewDate!,
                              location: nextInterview.location || 'Visio / À confirmer',
                              description: `Entretien de recrutement avec ${nextInterview.companyName} pour le poste de ${nextInterview.position}.`,
                            })}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <ExternalLink className="h-3.5 w-3.5 text-blue-500" />
                            <span>Google Agenda</span>
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a
                            href={getOutlookCalendarUrl({
                              title: `Entretien ${nextInterview.companyName} (${nextInterview.position})`,
                              startDate: nextInterview.interviewDate!,
                              location: nextInterview.location || 'Visio / À confirmer',
                              description: `Entretien de recrutement avec ${nextInterview.companyName} pour le poste de ${nextInterview.position}.`,
                            })}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <ExternalLink className="h-3.5 w-3.5 text-blue-600" />
                            <span>Outlook / Office 365</span>
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={handleExportNextInterviewIcs}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Download className="h-3.5 w-3.5 text-foreground" />
                          <span>Télécharger .ics (Apple Calendar)</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

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

      {/* 4. Modal de création d'une candidature */}
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
