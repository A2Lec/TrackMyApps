import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/analytics.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  TrendingUp,
  Target,
  CheckCircle2,
  Clock,
  Send,
  CalendarCheck,
  Building,
  Sparkles,
} from 'lucide-react';
import { statusLabels, jobTypeLabels, cn } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#94a3b8',
  SENT: '#3b82f6',
  VIEWED: '#8b5cf6',
  INTERVIEW_SCHEDULED: '#f59e0b',
  AWAITING_RESPONSE: '#6366f1',
  REJECTED: '#ef4444',
  ACCEPTED: '#10b981',
  GHOSTED: '#71717a',
};

const JOB_TYPE_COLORS: Record<string, string> = {
  STAGE: '#3b82f6',
  ALTERNANCE: '#8b5cf6',
  CDI: '#10b981',
  JOB_ETUDIANT: '#f59e0b',
};

export function AnalyticsPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => analyticsService.getDashboard(),
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['analytics', 'stats'],
    queryFn: () => analyticsService.getStats(),
  });

  const { data: timeline, isLoading: timelineLoading } = useQuery({
    queryKey: ['analytics', 'timeline', period],
    queryFn: () => analyticsService.getTimeline(period),
  });

  const isLoading = dashboardLoading || statsLoading || timelineLoading;

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  const statusData = Object.entries(dashboard?.statusOverview || dashboard?.byStatus || {}).map(([status, count]) => ({
    name: statusLabels[status as keyof typeof statusLabels] || status,
    value: count as number,
    status,
  }));

  const jobTypeData = Object.entries(stats?.byJobType || {}).map(([type, count]) => ({
    name: jobTypeLabels[type as keyof typeof jobTypeLabels] || type,
    value: count as number,
    type,
  }));

  const totalApplications = dashboard?.totalApplications || 0;
  const acceptedCount = (dashboard?.statusOverview?.ACCEPTED || dashboard?.byStatus?.ACCEPTED || 0) as number;
  const interviewCount = (dashboard?.statusOverview?.INTERVIEW_SCHEDULED || dashboard?.byStatus?.INTERVIEW_SCHEDULED || 0) as number;

  const conversionRate = totalApplications
    ? Math.round((acceptedCount / totalApplications) * 100)
    : 0;

  const interviewRate = totalApplications
    ? Math.round((interviewCount / totalApplications) * 100)
    : 0;

  const responseRate = dashboard?.responseRate || 0;

  return (
    <div className="space-y-6 w-full min-w-0 overflow-x-hidden animate-in fade-in-50 duration-200">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Statistiques & Performance</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Tableau de bord décisionnel pour optimiser vos candidatures et taux de conversion
          </p>
        </div>

        {/* Period Segmented Toggle */}
        <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border text-xs self-start sm:self-auto">
          {(
            [
              { id: '7d', label: '7 jours' },
              { id: '30d', label: '30 jours' },
              { id: '90d', label: '90 jours' },
              { id: 'all', label: 'Tout' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setPeriod(item.id)}
              className={cn(
                'px-3 py-1.5 rounded-md font-medium transition-all',
                period === item.id
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bannière valorisante pour petits volumes (TICK-402) */}
      {totalApplications < 10 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 via-primary/5 to-transparent border border-blue-500/20 flex items-start sm:items-center gap-3 animate-in fade-in duration-300">
          <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-semibold text-foreground">
              {totalApplications === 0
                ? 'Démarrez votre suivi de candidatures !'
                : 'Vos premières tendances prennent forme !'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Vous débutez votre recherche ({totalApplications}/10 candidatures). Continuez à cibler vos offres clés pour voir vos ratios et vos courbes se dessiner avec précision !
            </p>
          </div>
        </div>
      )}

      {/* 4 Sober Metric Cockpit Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full min-w-0">
        <Card className="border border-border/70 shadow-xs hover:border-border transition-all">
          <CardContent className="p-3.5 sm:p-4">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium">Total candidatures</span>
              <Send className="h-4 w-4 text-blue-500" />
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl sm:text-3xl font-bold tracking-tight">{totalApplications}</p>
              <span className="text-xs text-muted-foreground">
                {dashboard?.sentThisMonth || 0} ce mois
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 shadow-xs hover:border-border transition-all">
          <CardContent className="p-3.5 sm:p-4">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium">Entretiens obtenus</span>
              <CalendarCheck className="h-4 w-4 text-amber-500" />
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                {interviewCount}
              </p>
              <span className="text-xs font-medium text-amber-600/90 dark:text-amber-400/90">
                {interviewRate}% ratio
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 shadow-xs hover:border-border transition-all">
          <CardContent className="p-3.5 sm:p-4">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium">Offres acceptées</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                {acceptedCount}
              </p>
              <span className="text-xs font-medium text-emerald-600/90 dark:text-emerald-400/90">
                {conversionRate}% succès
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 shadow-xs hover:border-border transition-all">
          <CardContent className="p-3.5 sm:p-4">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium">Taux de réponse</span>
              <Target className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl sm:text-3xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">
                {responseRate}%
              </p>
              <span className="text-xs text-muted-foreground">
                {stats?.avgResponseTime ? `~${stats.avgResponseTime}j délai` : 'délai moyen'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 1: Timeline & Status breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full min-w-0">
        {/* Timeline Chart */}
        <Card className="lg:col-span-7 border border-border/70 shadow-xs w-full min-w-0 overflow-hidden">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-semibold">Rythme des envois</CardTitle>
            <CardDescription className="text-xs">
              Évolution du volume de candidatures sur la période sélectionnée
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-6">
            {totalApplications === 0 ? (
              <div className="h-64 sm:h-72 w-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <p className="text-xs sm:text-sm font-medium text-foreground">Courbe d'activité en cours de constitution</p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Vous débutez votre recherche. Continuez à cibler vos offres clés pour voir vos tendances se dessiner !
                </p>
              </div>
            ) : (
              <div className="h-64 sm:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeline || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: 'var(--border)' }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
                      }}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--background)',
                        borderColor: 'var(--border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      }}
                      labelFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
                      }}
                      formatter={(value: number) => [`${value} candidature${value > 1 ? 's' : ''}`, 'Volume']}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ fill: '#2563eb', r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution Pie */}
        <Card className="lg:col-span-5 border border-border/70 shadow-xs w-full min-w-0 overflow-hidden">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-semibold">Répartition par statut</CardTitle>
            <CardDescription className="text-xs">
              Positionnement actuel dans le pipe de recrutement
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-6 flex flex-col items-center justify-center">
            {statusData.length > 0 ? (
              <div className="h-64 sm:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {statusData.map((entry) => (
                        <Cell
                          key={entry.status}
                          fill={STATUS_COLORS[entry.status] || '#94a3b8'}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--background)',
                        borderColor: 'var(--border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(value: number) => [`${value} candidatures`, 'Total']}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Quick clean legend */}
                <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 mt-2">
                  {statusData.slice(0, 5).map((item) => (
                    <div key={item.status} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[item.status] || '#94a3b8' }}
                      />
                      <span>{item.name} ({item.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-muted-foreground text-xs">
                Aucune donnée de statut disponible
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Contract Types & Conversion Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full min-w-0">
        {/* Job Type Horizontal Bars */}
        <Card className="lg:col-span-6 border border-border/70 shadow-xs w-full min-w-0 overflow-hidden">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-semibold">Types de contrats</CardTitle>
            <CardDescription className="text-xs">
              Ventilation de vos recherches par typologie de poste
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-6">
            {jobTypeData.length > 0 ? (
              <div className="h-64 sm:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={jobTypeData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} axisLine={false} tickLine={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={90}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--background)',
                        borderColor: 'var(--border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(value: number) => [`${value} candidatures`, 'Total']}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {jobTypeData.map((entry) => (
                        <Cell
                          key={entry.type}
                          fill={JOB_TYPE_COLORS[entry.type] || '#3b82f6'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-16 text-center text-muted-foreground text-xs">
                Aucun contrat catégorisé
              </div>
            )}
          </CardContent>
        </Card>

        {/* Funnel & Efficiency Diagnostics */}
        <Card className="lg:col-span-6 border border-border/70 shadow-xs w-full min-w-0 overflow-hidden">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-semibold">Efficacité du Funnel</CardTitle>
            <CardDescription className="text-xs">
              Diagnostics de conversion pour chaque étape de votre recherche
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-5">
            {/* Taux d'entretien */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">Étape 1 : Accès aux entretiens</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">{interviewRate}%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(interviewRate, 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                {interviewRate >= 20 ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> Excellent ratio (moyenne du secteur : 15%)
                  </span>
                ) : totalApplications < 10 ? (
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-primary" /> Volume initial : chaque entretien supplémentaire fera grimper ce ratio
                  </span>
                ) : (
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Astuce : ciblez les compétences clés mentionnées dans chaque offre
                  </span>
                )}
              </p>
            </div>

            {/* Taux de conversion finale */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">Étape 2 : Transformation en offre</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{conversionRate}%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(conversionRate, 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                {conversionRate >= 10 ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> Très bonne performance d'acceptation
                  </span>
                ) : (
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-primary" /> Entraînez-vous avec le simulateur d'entretien IA
                  </span>
                )}
              </p>
            </div>

            {/* Taux de réponse des recruteurs */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">Réactivité des recruteurs</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">{responseRate}%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(responseRate, 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                {responseRate >= 30
                  ? 'Vos cibles d’entreprises traitent activement les candidatures reçues.'
                  : 'Astuce : activez les rappels de relance automatique après 7 jours.'}
              </p>
            </div>

            {/* Extra summary note */}
            <div className="pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Building className="h-3.5 w-3.5 text-muted-foreground" />
                Entreprises ciblées : {dashboard?.recentApplications?.length || 0} récentes
              </span>
              <span>Délai moyen : {stats?.avgResponseTime ? `${stats.avgResponseTime} jours` : 'Non calculé'}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-1" />
        </div>
        <Skeleton className="h-9 w-40" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Skeleton className="lg:col-span-7 h-80 rounded-lg" />
        <Skeleton className="lg:col-span-5 h-80 rounded-lg" />
      </div>
    </div>
  );
}
