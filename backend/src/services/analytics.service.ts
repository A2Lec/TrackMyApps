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
      (statusCounts['ACCEPTED'] || 0);
    const sent = totalApplications - (statusCounts['DRAFT'] || 0);
    const responseRate = sent > 0 ? Math.round((responded / sent) * 100) : 0;

    return {
      stats: {
        totalApplications,
        thisMonthApplications,
        scheduledInterviews,
        pendingReminders,
        responseRate,
      },
      byStatus: statusCounts,
      recentApplications,
      upcomingInterviews,
    };
  },

  async getDetailedAnalytics(userId: string) {
    const now = new Date();
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(now.getMonth() - 6);

    const [
      applicationsByMonth,
      byJobType,
      byStatus,
      topCompanies,
      allApplications,
    ] = await Promise.all([
      // Applications by month (last 6 months)
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "applicationDate") as month,
          COUNT(*)::int as count
        FROM applications
        WHERE "userId" = ${userId}
          AND "applicationDate" >= ${sixMonthsAgo}
        GROUP BY DATE_TRUNC('month', "applicationDate")
        ORDER BY month ASC
      ` as Promise<{ month: Date; count: number }[]>,

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
      byJobType: byJobType.map(item => ({
        jobType: item.jobType,
        count: item._count,
      })),
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
};
