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
import { Progress } from '@/components/ui/progress';
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
  Briefcase,
  Calendar,
  TrendingUp,
  Bell,
  Plus,
  ArrowRight,
  Clock,
  Sparkles,
  CheckCircle2,
  Target,
  Flame,
  GraduationCap,
  ChevronRight,
  CalendarClock,
} from 'lucide-react';
import {
  formatDate,
  statusLabels,
  statusColors,
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

  // Earliest upcoming interview for the Hero Focus Card
  const nextInterview = useMemo(() => {
    if (!dashboard?.upcomingInterviews || dashboard.upcomingInterviews.length === 0) return null;
    return [...dashboard.upcomingInterviews].sort((a, b) => {
      const dateA = a.interviewDate ? new Date(a.interviewDate).getTime() : Infinity;
      const dateB = b.interviewDate ? new Date(b.interviewDate).getTime() : Infinity;
      return dateA - dateB;
    })[0];
  }, [dashboard?.upcomingInterviews]);

  // Earliest pending reminder
  const nextReminder = useMemo(() => {
    if (!upcomingReminders || !Array.isArray(upcomingReminders) || upcomingReminders.length === 0) return null;
    return upcomingReminders.find((r) => !r.isCompleted) || null;
  }, [upcomingReminders]);

  if (dashboardLoading) {
    return <DashboardSkeleton />;
  }

  const byStatus = dashboard?.statusOverview || dashboard?.byStatus || {};
  const totalApplications = dashboard?.totalApplications ?? 0;
  const sentThisMonth = dashboard?.sentThisMonth ?? 0;
  const scheduledInterviews = dashboard?.scheduledInterviews ?? 0;
  const responseRate = dashboard?.responseRate ?? 0;

  // Monthly goal estimate (default 15 for students)
  const monthlyGoal = 15;
  const goalProgress = Math.min(100, Math.round((sentThisMonth / monthlyGoal) * 100));

  // Funnel calculations
  const viewedCount = byStatus['VIEWED'] || 0;
  const acceptedCount = byStatus['ACCEPTED'] || 0;

  return (
    <div className="space-y-6">
      {/* 1. Header Cockpit */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-primary/5 p-5 sm:p-7 shadow-xs">
        {/* Ambient subtle glow background */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute right-10 bottom-0 h-40 w-40 rounded-full bg-blue-500/5 blur-2xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {greeting} {user?.firstName ? `${user.firstName}` : ''} 👋
              </h1>
              <Badge
                variant="outline"
                className="gap-1.5 text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
              >
                <Flame className="h-3.5 w-3.5 text-emerald-500" />
                En recherche active
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Prêt à faire décoller votre carrière ? Suivez vos opportunités et préparez vos prochains entretiens en toute sérénité.
            </p>

            {/* School / Target badges */}
            {(user?.school || user?.fieldOfStudy) && (
              <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground flex-wrap">
                {user.school && (
                  <span className="flex items-center gap-1 bg-muted/60 px-2.5 py-1 rounded-md border border-border/60">
                    <GraduationCap className="h-3.5 w-3.5 text-primary" />
                    {user.school}
                  </span>
                )}
                {user.fieldOfStudy && (
                  <span className="flex items-center gap-1 bg-muted/60 px-2.5 py-1 rounded-md border border-border/60">
                    <Briefcase className="h-3.5 w-3.5 text-primary" />
                    {user.fieldOfStudy}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Quick CTAs */}
          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            <Button
              variant="outline"
              asChild
              className="w-full sm:w-auto text-xs h-9 font-medium hover:bg-purple-500/10 hover:border-purple-500/30 hover:text-purple-600 transition-colors"
            >
              <Link to="/interview-prep">
                <Sparkles className="mr-2 h-3.5 w-3.5 text-purple-600" />
                Simulateur IA
              </Link>
            </Button>

            <EmailVerifiedGuard>
              <Button
                onClick={() => setShowCreateDialog(true)}
                disabled={!isEmailVerified}
                className="w-full sm:w-auto text-xs h-9 font-medium shadow-xs shadow-primary/20"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Nouvelle candidature
              </Button>
            </EmailVerifiedGuard>
          </div>
        </div>
      </div>

      {/* 2. Hero Action Card "Focus du jour" */}
      {nextInterview ? (
        <Card className="border-purple-500/30 bg-gradient-to-r from-purple-500/10 via-card to-indigo-500/5 shadow-xs overflow-hidden relative">
          <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-purple-500 to-indigo-500" />
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="h-11 w-11 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center flex-shrink-0 text-purple-600 dark:text-purple-400 font-bold text-sm shadow-xs">
                  <CalendarClock className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge className="bg-purple-500 text-white hover:bg-purple-600 text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5">
                      Entretien imminent
                    </Badge>
                    <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {nextInterview.interviewDate ? formatDate(nextInterview.interviewDate, 'long') : 'Date à confirmer'}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground truncate">
                    {nextInterview.position} chez <span className="text-primary">{nextInterview.companyName}</span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Entraînez-vous avec notre IA pour maximiser vos chances de réussite
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  asChild
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-xs gap-1.5 w-full sm:w-auto"
                >
                  <Link to={`/interview-simulation?company=${encodeURIComponent(nextInterview.companyName)}&position=${encodeURIComponent(nextInterview.position)}`}>
                    <Sparkles className="h-3.5 w-3.5" />
                    Simuler cet entretien
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="text-xs">
                  <Link to={`/applications/${nextInterview.id}`}>
                    Détails
                    <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : nextReminder ? (
        <Card className="border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-card to-card shadow-xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="h-11 w-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center flex-shrink-0 text-amber-600 dark:text-amber-400 font-bold text-sm">
                  <Bell className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge variant="outline" className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] font-semibold uppercase px-2 py-0.5">
                      Rappel prioritaire
                    </Badge>
                    <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Échéance : {formatDate(nextReminder.dueDate)}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-foreground truncate">
                    {nextReminder.title}
                  </h3>
                  {nextReminder.application && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Pour {nextReminder.application.companyName} ({nextReminder.application.position})
                    </p>
                  )}
                </div>
              </div>

              <Button size="sm" asChild className="text-xs font-semibold w-full sm:w-auto">
                <Link to="/reminders">
                  Voir mes rappels
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 via-card to-card shadow-xs">
          <CardContent className="p-4 sm:p-5 flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 flex-shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-foreground">Tout est sous contrôle !</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Aucun rappel ni entretien urgent en attente. C'est le moment idéal pour prospecter de nouvelles entreprises !
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-xs text-primary hidden sm:flex">
              <Link to="/applications">
                Explorer le Kanban
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 3. SaaS KPIs Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 : Total applications & Monthly progress */}
        <Link to="/applications" className="group">
          <Card className="h-full border-border/80 hover:border-primary/50 hover:shadow-md transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Candidatures totales
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                <Briefcase className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {totalApplications}
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{sentThisMonth} envoyée(s) ce mois</span>
                  <span className="font-medium text-foreground">{goalProgress}%</span>
                </div>
                <Progress value={goalProgress} className="h-1.5" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* KPI 2 : Response rate */}
        <Link to="/analytics" className="group">
          <Card className="h-full border-border/80 hover:border-primary/50 hover:shadow-md transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Taux de réponse
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                <TrendingUp className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {responseRate}%
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] font-semibold px-1.5 py-0.2',
                    responseRate >= 20
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {responseRate >= 20 ? `+${responseRate - 20}% vs moy.` : 'Moyenne ~20%'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {byStatus['VIEWED'] || 0} vue(s) par des recruteurs
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* KPI 3 : Scheduled Interviews */}
        <Link to="/calendar" className="group">
          <Card className="h-full border-border/80 hover:border-primary/50 hover:shadow-md transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Entretiens prévus
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                <Calendar className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {scheduledInterviews}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                {byStatus['INTERVIEW_SCHEDULED'] || 0} étape(s) d'entretien
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* KPI 4 : Offers accepted */}
        <Link to="/applications" className="group">
          <Card className="h-full border-border/80 hover:border-primary/50 hover:shadow-md transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Offres décrochées
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                <Target className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                {acceptedCount}
              </div>
              <p className="text-xs text-muted-foreground">
                {byStatus['AWAITING_RESPONSE'] || 0} en attente de décision finale
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* 4. Mini Conversion Funnel */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Pipeline de conversion
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Visualisez l'avancement de vos candidatures à travers chaque étape clé
              </CardDescription>
            </div>
            <Link to="/analytics" className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
              Statistiques détaillées
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Step 1 */}
            <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/40">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>1. Envoyées</span>
                <span className="font-semibold text-blue-600">100%</span>
              </div>
              <div className="text-xl font-bold text-foreground">{totalApplications}</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Total soumis</p>
            </div>

            {/* Step 2 */}
            <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-900/40">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>2. Vues</span>
                <span className="font-semibold text-indigo-600">
                  {totalApplications > 0 ? `${Math.round((viewedCount / totalApplications) * 100)}%` : '0%'}
                </span>
              </div>
              <div className="text-xl font-bold text-foreground">{viewedCount}</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Consultées</p>
            </div>

            {/* Step 3 */}
            <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-900/40">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>3. Entretiens</span>
                <span className="font-semibold text-purple-600">
                  {totalApplications > 0 ? `${Math.round((scheduledInterviews / totalApplications) * 100)}%` : '0%'}
                </span>
              </div>
              <div className="text-xl font-bold text-foreground">{scheduledInterviews}</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Rendez-vous fixés</p>
            </div>

            {/* Step 4 */}
            <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/40">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>4. Offres</span>
                <span className="font-semibold text-emerald-600">
                  {scheduledInterviews > 0 ? `${Math.round((acceptedCount / scheduledInterviews) * 100)}%` : '0%'}
                </span>
              </div>
              <div className="text-xl font-bold text-foreground">{acceptedCount}</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Acceptées</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. Main content: Recent applications & Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent applications */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                Dernières candidatures
              </CardTitle>
              <CardDescription className="text-xs">Vos démarches les plus récentes</CardDescription>
            </div>
            <Link to="/applications">
              <Button variant="ghost" size="sm" className="h-8 text-xs font-medium">
                Voir tout
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {dashboard?.recentApplications && dashboard.recentApplications.length > 0 ? (
              dashboard.recentApplications.slice(0, 5).map((app) => (
                <Link
                  key={app.id}
                  to={`/applications/${app.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/70 hover:border-primary/50 hover:bg-muted/30 transition-all group"
                >
                  <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-xs text-primary flex-shrink-0">
                    {app.companyName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {app.position}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span className="font-medium text-foreground/80 truncate">{app.companyName}</span>
                      {app.location && (
                        <>
                          <span>•</span>
                          <span className="truncate">{app.location}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-semibold', statusColors[app.status])}>
                      {statusLabels[app.status]}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-10 text-muted-foreground border border-dashed rounded-xl p-4">
                <Briefcase className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-xs font-medium">Aucune candidature enregistrée</p>
                <Button
                  variant="link"
                  size="sm"
                  className="mt-1 text-xs"
                  onClick={() => setShowCreateDialog(true)}
                >
                  Ajouter ma première candidature
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions à faire & Rappels */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                Actions à faire
              </CardTitle>
              <CardDescription className="text-xs">Rappels et relances programmés</CardDescription>
            </div>
            <Link to="/reminders">
              <Button variant="ghost" size="sm" className="h-8 text-xs font-medium">
                Gérer
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {remindersLoading ? (
              <div className="space-y-2.5">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 rounded-xl" />
                ))}
              </div>
            ) : upcomingReminders && Array.isArray(upcomingReminders) && upcomingReminders.length > 0 ? (
              upcomingReminders.slice(0, 5).map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border/70"
                >
                  <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 flex-shrink-0 mt-0.5">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {reminder.title}
                    </p>
                    {reminder.application && (
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {reminder.application.companyName} — {reminder.application.position}
                      </p>
                    )}
                    <span className="text-[11px] text-muted-foreground/80 mt-1 block">
                      Échéance : {formatDate(reminder.dueDate)}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] font-medium flex-shrink-0',
                      reminder.isCompleted
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    )}
                  >
                    {reminder.isCompleted ? 'Fait' : 'À faire'}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-muted-foreground border border-dashed rounded-xl p-4">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-xs font-medium">Aucun rappel en attente</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Planifiez vos relances pour ne jamais oublier un suivi
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 6. Status distribution overview */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold">Répartition complète par statut</CardTitle>
          <CardDescription className="text-xs">
            Vue instantanée du volume d'opportunités par phase de recrutement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {STATUS_ORDER.map((st) => (
              <Link
                key={st}
                to={`/applications?status=${st}`}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-muted/40 hover:bg-muted border border-border/60 hover:border-primary/40 transition-all text-center group"
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-1.5 transition-transform group-hover:scale-105',
                    statusColors[st]
                  )}
                >
                  {byStatus[st] || 0}
                </div>
                <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground truncate w-full text-center">
                  {statusLabels[st]}
                </span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 7. Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvelle candidature</DialogTitle>
            <DialogDescription>
              Ajoutez une nouvelle candidature à votre suivi pour lancer son pilotage
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
    <div className="space-y-6">
      <div className="h-32 w-full rounded-2xl bg-card border border-border/80 p-6 flex flex-col justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  );
}
