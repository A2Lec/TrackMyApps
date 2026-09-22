import prisma from '../config/database.js';

// Define type locally since we're using SQLite (no Prisma enums)
type ApplicationStatus = 'DRAFT' | 'SENT' | 'VIEWED' | 'INTERVIEW_SCHEDULED' | 'AWAITING_RESPONSE' | 'REJECTED' | 'ACCEPTED' | 'GHOSTED';

export const analyticsService = {
  async getDashboardStats(userId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    const [
      totalApplications,
      thisMonthApplications,
      scheduledInterviews,
      pendingReminders,
      byStatus,
      recentApplications,
      upcomingInterviews,
    ] = await Promise.all([
      // Total applications
      prisma.application.count({ where: { userId } }),

      // This month applications
      prisma.application.count({
        where: {
          userId,
          applicationDate: { gte: startOfMonth },
        },
      }),

      // Scheduled interviews
      prisma.application.count({
        where: {
          userId,
          status: 'INTERVIEW_SCHEDULED',
        },
      }),

      // Pending reminders
      prisma.reminder.count({
        where: {
          userId,
          isCompleted: false,
          dueDate: { lte: now },
        },
      }),

      // By status
      prisma.application.groupBy({
        by: ['status'],
        where: { userId },
        _count: true,
      }),

      // Recent applications
      prisma.application.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          companyName: true,
          position: true,
          status: true,
          applicationDate: true,
        },
      }),

      // Upcoming interviews
      prisma.application.findMany({
        where: {
          userId,
          status: 'INTERVIEW_SCHEDULED',
          interviewDate: { gte: now },
        },
        orderBy: { interviewDate: 'asc' },
        take: 5,
        select: {
          id: true,
          companyName: true,
          position: true,
          interviewDate: true,
        },
      }),
    ]);

    // Calculate response rate
    const statusCounts = byStatus.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {} as Record<string, number>);

    const responded = (statusCounts['INTERVIEW_SCHEDULED'] || 0) +
      (statusCounts['REJECTED'] || 0) +
      (statusCounts['ACCEPTED'] || 0) +
      (statusCounts['VIEWED'] || 0);
    const sent = totalApplications - (statusCounts['DRAFT'] || 0);
    const responseRate = sent > 0 ? Math.round((responded / sent) * 100) : 0;

    return {
      totalApplications,
      sentThisMonth: thisMonthApplications,
      scheduledInterviews,
      pendingReminders,
      responseRate,
      byStatus: statusCounts,
      recentApplications,
      upcomingInterviews,
    };
  },

  async getDetailedAnalytics(userId: string) {
    const now = new Date();
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(now.getMonth() - 6);

    const getMonthlyApplications = async () => {
      try {
        return await prisma.$queryRaw<Array<{ month: Date; count: number }>>`
          SELECT 
            DATE_TRUNC('month', "applicationDate") as month,
            COUNT(*)::int as count
          FROM applications
          WHERE "userId" = ${userId}
            AND "applicationDate" >= ${sixMonthsAgo}
          GROUP BY DATE_TRUNC('month', "applicationDate")
          ORDER BY month ASC
        `;
      } catch {
        const apps = await prisma.application.findMany({
          where: {
            userId,
            applicationDate: { gte: sixMonthsAgo },
          },
          select: { applicationDate: true },
        });
        const monthMap = new Map<string, number>();
        for (const app of apps) {
          const d = new Date(app.applicationDate);
          const key = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
          monthMap.set(key, (monthMap.get(key) || 0) + 1);
        }
        return Array.from(monthMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([m, count]) => ({ month: new Date(m), count }));
      }
    };

    const [
      applicationsByMonth,
      byJobType,
      byStatus,
      topCompanies,
      allApplications,
    ] = await Promise.all([
      getMonthlyApplications(),

      // By job type
      prisma.application.groupBy({
        by: ['jobType'],
        where: { userId },
        _count: true,
      }),

      // By status
      prisma.application.groupBy({
        by: ['status'],
        where: { userId },
        _count: true,
      }),

      // Top companies applied to
      prisma.application.groupBy({
        by: ['companyName'],
        where: { userId },
        _count: true,
        orderBy: { _count: { companyName: 'desc' } },
        take: 5,
      }),

      // All applications for conversion funnel
      prisma.application.findMany({
        where: { userId },
        select: { status: true },
      }),
    ]);

    // Calculate conversion funnel
    const total = allApplications.length;
    const sent = allApplications.filter(a => a.status !== 'DRAFT').length;
    const responded = allApplications.filter(a =>
      ['INTERVIEW_SCHEDULED', 'REJECTED', 'ACCEPTED', 'VIEWED'].includes(a.status)
    ).length;
    const interviewed = allApplications.filter(a =>
      ['INTERVIEW_SCHEDULED', 'ACCEPTED'].includes(a.status)
    ).length;
    const accepted = allApplications.filter(a => a.status === 'ACCEPTED').length;

    const conversionFunnel = {
      total,
      sent,
      responded,
      interviewed,
      accepted,
      responseRate: sent > 0 ? Math.round((responded / sent) * 100) : 0,
      interviewRate: responded > 0 ? Math.round((interviewed / responded) * 100) : 0,
      acceptanceRate: interviewed > 0 ? Math.round((accepted / interviewed) * 100) : 0,
    };

    return {
      applicationsByMonth,
      byJobType: byJobType.reduce((acc, item) => {
        acc[item.jobType] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byStatus: byStatus.map(item => ({
        status: item.status,
        count: item._count,
      })),
      topCompanies: topCompanies.map(item => ({
        companyName: item.companyName,
        count: item._count,
      })),
      conversionFunnel,
    };
  },

  async exportData(userId: string) {
    const applications = await prisma.application.findMany({
      where: { userId },
      include: {
        company: true,
        events: true,
      },
      orderBy: { applicationDate: 'desc' },
    });

    return applications;
  },

  async getTimeline(userId: string, period: string) {
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case 'all':
        startDate = new Date(0);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    const applications = await prisma.application.findMany({
      where: {
        userId,
        applicationDate: {
          gte: startDate,
        },
      },
      select: {
        applicationDate: true,
      },
      orderBy: {
        applicationDate: 'asc',
      },
    });

    const grouped = applications.reduce((acc, app) => {
      const date = app.applicationDate.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([date, count]) => ({
      date,
      count,
    }));
  },
};
