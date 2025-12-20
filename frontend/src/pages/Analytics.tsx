import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/analytics.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Legend,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Target,
  CheckCircle,
  Clock,
  Send,
  MessageSquare,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { statusLabels, jobTypeLabels, cn } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#94a3b8',
  SENT: '#3b82f6',
  VIEWED: '#8b5cf6',
  INTERVIEW_SCHEDULED: '#f59e0b',
  AWAITING_RESPONSE: '#6366f1',
  REJECTED: '#ef4444',
  ACCEPTED: '#22c55e',
  GHOSTED: '#71717a',
};

const JOB_TYPE_COLORS: Record<string, string> = {
  STAGE: '#3b82f6',
  ALTERNANCE: '#8b5cf6',
  CDI: '#22c55e',
  JOB_ETUDIANT: '#f59e0b',
};

export function AnalyticsPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: analyticsService.getDashboard,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['analytics', 'stats'],
    queryFn: analyticsService.getStats,
  });

  const { data: timeline, isLoading: timelineLoading } = useQuery({
    queryKey: ['analytics', 'timeline', period],
    queryFn: () => analyticsService.getTimeline(period),
  });

  const isLoading = dashboardLoading || statsLoading || timelineLoading;

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  const statusData = Object.entries(dashboard?.statusOverview || {}).map(([status, count]) => ({
    name: statusLabels[status as keyof typeof statusLabels] || status,
    value: count,
    status,
  }));

  const jobTypeData = Object.entries(stats?.byJobType || {}).map(([type, count]) => ({
    name: jobTypeLabels[type as keyof typeof jobTypeLabels] || type,
    value: count,
    type,
  }));

  const conversionRate = dashboard?.totalApplications
    ? Math.round((dashboard.statusOverview.ACCEPTED || 0) / dashboard.totalApplications * 100)
    : 0;

  const interviewRate = dashboard?.totalApplications
    ? Math.round((dashboard.statusOverview.INTERVIEW_SCHEDULED || 0) / dashboard.totalApplications * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Statistiques</h1>
          <p className="text-muted-foreground">
            Analysez vos performances et suivez votre progression
          </p>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 derniers jours</SelectItem>
            <SelectItem value="30d">30 derniers jours</SelectItem>
            <SelectItem value="90d">90 derniers jours</SelectItem>
            <SelectItem value="all">Tout</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Send className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total candidatures</p>
                <p className="text-2xl font-bold">{dashboard?.totalApplications || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <MessageSquare className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Entretiens</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold">
                    {dashboard?.statusOverview.INTERVIEW_SCHEDULED || 0}
                  </p>
                  <span className="text-sm text-muted-foreground">({interviewRate}%)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Acceptées</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold">
                    {dashboard?.statusOverview.ACCEPTED || 0}
                  </p>
                  <span className="text-sm text-muted-foreground">({conversionRate}%)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Target className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taux de réponse</p>
                <p className="text-2xl font-bold">{dashboard?.responseRate || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Timeline Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution des candidatures</CardTitle>
            <CardDescription>
              Nombre de candidatures envoyées sur la période
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeline || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
                    }}
                  />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip
                    labelFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
                    }}
                    formatter={(value: number) => [value, 'Candidatures']}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par statut</CardTitle>
            <CardDescription>
              Distribution de vos candidatures par statut actuel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) =>
                      percent > 0.05 ? `${name} (${(percent * 100).toFixed(0)}%)` : ''
                    }
                    labelLine={false}
                  >
                    {statusData.map((entry) => (
                      <Cell
                        key={entry.status}
                        fill={STATUS_COLORS[entry.status] || '#94a3b8'}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [value, 'Candidatures']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Job Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par type</CardTitle>
            <CardDescription>
              Distribution de vos candidatures par type de contrat
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={jobTypeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    width={100}
                  />
                  <Tooltip formatter={(value: number) => [value, 'Candidatures']} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {jobTypeData.map((entry) => (
                      <Cell
                        key={entry.type}
                        fill={JOB_TYPE_COLORS[entry.type] || '#94a3b8'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Indicateurs de performance</CardTitle>
            <CardDescription>
              Métriques clés pour évaluer vos candidatures
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Taux d'entretien</span>
                <span className="font-medium">{interviewRate}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all"
                  style={{ width: `${Math.min(interviewRate, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {interviewRate >= 20 ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> Excellent ! Au-dessus de la moyenne
                  </span>
                ) : (
                  <span className="text-yellow-600 flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" /> Pensez à personnaliser vos candidatures
                  </span>
                )}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Taux de conversion</span>
                <span className="font-medium">{conversionRate}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${Math.min(conversionRate, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {conversionRate >= 10 ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> Très bon taux de conversion !
                  </span>
                ) : (
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Continuez vos efforts
                  </span>
                )}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Taux de réponse</span>
                <span className="font-medium">{dashboard?.responseRate || 0}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${Math.min(dashboard?.responseRate || 0, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {(dashboard?.responseRate || 0) >= 30 ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> Bon taux de réponse
                  </span>
                ) : (
                  <span className="text-yellow-600 flex items-center gap-1">
                    <XCircle className="h-3 w-3" /> Les entreprises mettent du temps à répondre
                  </span>
                )}
              </p>
            </div>

            <div className="pt-4 border-t">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {dashboard?.sentThisMonth || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Envoyées ce mois</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {stats?.avgResponseTime || '-'}
                  </p>
                  <p className="text-xs text-muted-foreground">Jours de réponse moy.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Légende des statuts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {Object.entries(STATUS_COLORS).map(([status, color]) => (
              <div key={status} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm">{statusLabels[status as keyof typeof statusLabels]}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}
