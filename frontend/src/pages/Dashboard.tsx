import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { analyticsService } from '@/services/analytics.service';
import { remindersService } from '@/services/reminders.service';
import { applicationsService } from '@/services/applications.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
  Send, 
  Calendar, 
  TrendingUp, 
  Bell, 
  Plus,
  ArrowRight,
  Building2,
  Clock
} from 'lucide-react';
import { formatDate, statusLabels, statusColors, cn } from '@/lib/utils';
import type { ApplicationStatus } from '@/types';
import { ApplicationForm } from '@/components/ApplicationForm';

export function DashboardPage() {
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const submitRef = useRef<(() => void) | null>(null);

  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: analyticsService.getDashboard,
  });

  const { data: upcomingReminders, isLoading: remindersLoading } = useQuery({
    queryKey: ['upcomingReminders'],
    queryFn: () => remindersService.getUpcoming(7),
  });

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

  if (dashboardLoading) {
    return <DashboardSkeleton />;
  }

  const byStatus = dashboard?.statusOverview || dashboard?.byStatus || {};
  const totalApplications = dashboard?.totalApplications ?? 0;
  const sentThisMonth = dashboard?.sentThisMonth ?? 0;
  const scheduledInterviews = dashboard?.scheduledInterviews ?? 0;
  const responseRate = dashboard?.responseRate ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Vue d'ensemble de vos candidatures
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle candidature
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link to="/applications">
          <Card className="cursor-pointer transition-all hover:bg-accent/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total candidatures
              </CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalApplications}</div>
              <p className="text-xs text-muted-foreground">
                {byStatus['DRAFT'] || 0} brouillons
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/applications">
          <Card className="cursor-pointer transition-all hover:bg-accent/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Candidatures ce mois
              </CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sentThisMonth}</div>
              <p className="text-xs text-muted-foreground">
                {byStatus['SENT'] || 0} envoyées au total
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/calendar">
          <Card className="cursor-pointer transition-all hover:bg-accent/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Entretiens prévus
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scheduledInterviews}</div>
              <p className="text-xs text-muted-foreground">
                {byStatus['ACCEPTED'] || 0} offre(s) acceptée(s)
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/analytics">
          <Card className="cursor-pointer transition-all hover:bg-accent/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Taux de réponse
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{responseRate}%</div>
              <p className="text-xs text-muted-foreground">
                Moyenne nationale ~20%
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent applications */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Dernières candidatures
            </CardTitle>
            <Link to="/applications">
              <Button variant="ghost" size="sm">
                Voir tout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {dashboard?.recentApplications && dashboard.recentApplications.length > 0 ? (
              <div className="space-y-3">
                {dashboard.recentApplications.map((app) => (
                  <Link
                    key={app.id}
                    to={`/applications/${app.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {app.position}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {app.companyName}
                      </p>
                    </div>
                    <div className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      statusColors[app.status]
                    )}>
                      {statusLabels[app.status]}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Aucune candidature</p>
                <Button 
                  variant="link" 
                  className="mt-2" 
                  onClick={() => setShowCreateDialog(true)}
                >
                  Commencer maintenant
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming reminders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Actions à faire
            </CardTitle>
            <Link to="/reminders">
              <Button variant="ghost" size="sm">
                Voir tout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {remindersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : upcomingReminders && Array.isArray(upcomingReminders) && upcomingReminders.length > 0 ? (
              <div className="space-y-3">
                {upcomingReminders.slice(0, 5).map((reminder) => (
                  <div
                    key={reminder.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {reminder.title}
                      </p>
                      {reminder.application && (
                        <p className="text-xs text-muted-foreground">
                          {reminder.application.companyName} - {reminder.application.position}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(reminder.dueDate)}
                      </p>
                    </div>
                    <div className={cn(
                      'px-2 py-1 rounded text-xs font-medium',
                      reminder.isCompleted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    )}>
                      {reminder.isCompleted ? 'Fait' : 'À faire'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Aucune action en attente</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming interviews */}
      {dashboard?.upcomingInterviews && dashboard.upcomingInterviews.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Prochains entretiens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {dashboard.upcomingInterviews.map((interview) => (
                <Link
                  key={interview.id}
                  to={`/applications/${interview.id}`}
                  className="p-4 rounded-lg border hover:border-primary transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">{interview.companyName}</p>
                      <p className="text-sm text-muted-foreground">{interview.position}</p>
                    </div>
                  </div>
                  <p className="text-sm text-primary font-medium">
                    {interview.interviewDate && formatDate(interview.interviewDate, 'long')}
                  </p>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status overview */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition par statut</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
            {Object.entries(statusLabels).map(([status, label]) => (
              <div key={status} className="text-center">
                <div className={cn(
                  'inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full mb-2',
                  statusColors[status as ApplicationStatus]
                )}>
                  <span className="text-base sm:text-lg font-bold">{byStatus[status] || 0}</span>
                </div>
                <p className="text-xs text-muted-foreground break-words">{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvelle candidature</DialogTitle>
            <DialogDescription>
              Ajoutez une nouvelle candidature à votre suivi
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <ApplicationForm
              onSubmit={(data) => createMutation.mutate(data)}
              isSubmitting={createMutation.isPending}
              submitRef={submitRef}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => submitRef.current?.()}
              disabled={createMutation.isPending}
            >
              Créer candidature
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
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}
