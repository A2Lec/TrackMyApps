import prisma from '../config/database.js';
import { createError } from '../middlewares/errorHandler.middleware.js';

// Define types locally since we're using SQLite (no Prisma enums)
type ApplicationStatus = 'DRAFT' | 'SENT' | 'VIEWED' | 'INTERVIEW_SCHEDULED' | 'AWAITING_RESPONSE' | 'REJECTED' | 'ACCEPTED' | 'GHOSTED';
type JobType = 'STAGE' | 'ALTERNANCE' | 'CDI' | 'JOB_ETUDIANT';
type EventType = 'STATUS_CHANGE' | 'NOTE' | 'RELANCE' | 'INTERVIEW' | 'DOCUMENT_ADDED';

interface CreateApplicationData {
  companyName: string;
  companyId?: string;
  position: string;
  jobType: string;
  location: string;
  status?: string;
  applicationDate?: Date;
  jobUrl?: string;
  salary?: string;
  notes?: string;
  jobDescription?: string;
  jobDescriptionFileUrl?: string;
  cvUsedId?: string;
  lmUsedId?: string;
  interviewDate?: Date;
}

interface UpdateApplicationData extends Partial<CreateApplicationData> {
  lastRelanceDate?: Date;
  decisionDate?: Date;
}

interface ApplicationFilters {
  status?: ApplicationStatus;
  jobType?: JobType;
  search?: string;
}

export const applicationService = {
  async getAll(userId: string, filters: ApplicationFilters = {}) {
    const where: any = { userId };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.jobType) {
      where.jobType = filters.jobType;
    }

    if (filters.search) {
      where.OR = [
        { companyName: { contains: filters.search, mode: 'insensitive' } },
        { position: { contains: filters.search, mode: 'insensitive' } },
        { location: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const applications = await prisma.application.findMany({
      where,
      include: {
        company: true,
        cvUsed: true,
        lmUsed: true,
        events: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        reminders: {
          where: { isCompleted: false },
          orderBy: { dueDate: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return applications;
  },

  async getById(userId: string, id: string) {
    const application = await prisma.application.findFirst({
      where: { id, userId },
      include: {
        company: true,
        cvUsed: true,
        lmUsed: true,
        events: {
          orderBy: { createdAt: 'desc' },
        },
        reminders: {
          orderBy: { dueDate: 'asc' },
        },
      },
    });

    if (!application) {
      throw createError('Candidature non trouvée', 404);
    }

    return application;
  },

  async create(userId: string, data: CreateApplicationData) {
    // Try to find existing company if companyName provided
    let companyId = data.companyId;
    if (!companyId && data.companyName) {
      const normalizedCompanyName = data.companyName.trim();
      
      const existingCompany = await prisma.company.findFirst({
        where: { 
          name: { equals: normalizedCompanyName, mode: 'insensitive' },
          userId 
        },
      });
      
      if (existingCompany) {
        companyId = existingCompany.id;
      } else {
        // Create new company automatically
        let website: string | undefined;
        if (data.jobUrl) {
          try {
            const url = new URL(data.jobUrl);
            // Only use origin if it's http/https to avoid weird protocols
            if (url.protocol === 'http:' || url.protocol === 'https:') {
              const hostname = url.hostname.toLowerCase().replace(/^www\./, '');
              
              // List of common job boards to exclude
              const jobBoards = [
                'linkedin.com',
                'indeed.com', 'indeed.fr',
                'welcometothejungle.com', 'wttj.co',
                'glassdoor.com', 'glassdoor.fr',
                'hellowork.com',
                'monster.com', 'monster.fr',
                'apec.fr',
                'pole-emploi.fr', 'francetravail.fr',
                'jobteaser.com',
                'malt.fr', 'malt.com',
                'freelance.com',
                'workable.com',
                'lever.co',
                'greenhouse.io',
                'ashbyhq.com'
              ];

              // Check if hostname ends with any of the job board domains
              const isJobBoard = jobBoards.some(board => hostname === board || hostname.endsWith('.' + board));

              if (!isJobBoard) {
                website = url.origin;
              }
            }
          } catch (e) {
            // Invalid URL, ignore
          }
        }

        // If no website found from URL (or it was a job board), try to find it via Clearbit Autocomplete API
        if (!website) {
          try {
            const response = await fetch(`https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(normalizedCompanyName)}`);
            if (response.ok) {
              const suggestions = await response.json() as any[];
              // Check if we got results and if the first result name is similar enough to the requested name
              if (suggestions && suggestions.length > 0) {
                // Simple check: if the suggestion name contains the search name or vice versa
                const suggestion = suggestions[0];
                if (suggestion.domain) {
                  website = `https://${suggestion.domain}`;
                }
              }
            }
          } catch (error) {
            console.error('Error fetching company website from Clearbit:', error);
            // Continue without website if API fails
          }
        }

        const newCompany = await prisma.company.create({
          data: {
            name: normalizedCompanyName,
            userId,
            location: data.location, // Use application location for the company
            website,
          }
        });
        companyId = newCompany.id;
      }
    }

    const application = await prisma.application.create({
      data: {
        userId,
        companyId,
        companyName: data.companyName,
        position: data.position,
        jobType: data.jobType,
        location: data.location,
        status: data.status || 'SENT',
        applicationDate: data.applicationDate || new Date(),
        jobUrl: data.jobUrl,
        salary: data.salary,
        notes: data.notes,
        cvUsedId: data.cvUsedId,
        lmUsedId: data.lmUsedId,
        interviewDate: data.interviewDate,
      },
      include: {
        company: true,
        cvUsed: true,
        lmUsed: true,
      },
    });

    // Create event for creation
    await prisma.applicationEvent.create({
      data: {
        applicationId: application.id,
        type: 'CREATED',
      },
    });

    // If status is SENT, create sent event
    if (application.status === 'SENT') {
      await prisma.applicationEvent.create({
        data: {
          applicationId: application.id,
          type: 'SENT',
        },
      });
    }

    return application;
  },

  async update(userId: string, id: string, data: UpdateApplicationData) {
    const existing = await prisma.application.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw createError('Candidature non trouvée', 404);
    }

    // Check if status changed
    const statusChanged = data.status && data.status !== existing.status;

    const application = await prisma.application.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        company: true,
        cvUsed: true,
        lmUsed: true,
        events: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Create event for status change
    if (statusChanged && data.status) {
      const typeMap: Record<string, string> = {
        'DRAFT': 'STATUS_CHANGED',
        'SENT': 'SENT',
        'VIEWED': 'VIEWED',
        'INTERVIEW_SCHEDULED': 'INTERVIEW_SCHEDULED',
        'AWAITING_RESPONSE': 'STATUS_CHANGED',
        'REJECTED': 'REJECTED',
        'ACCEPTED': 'ACCEPTED',
        'GHOSTED': 'STATUS_CHANGED',
      };

      await prisma.applicationEvent.create({
        data: {
          applicationId: application.id,
          type: typeMap[data.status] || 'STATUS_CHANGED',
          description: `Statut changé: ${existing.status} → ${data.status}`,
        },
      });
    }

    return application;
  },

  async updateStatus(userId: string, id: string, status: ApplicationStatus) {
    return this.update(userId, id, { status });
  },

  async delete(userId: string, id: string, deleteCompany: boolean = false) {
    const application = await prisma.application.findFirst({
      where: { id, userId },
    });

    if (!application) {
      throw createError('Candidature non trouvée', 404);
    }

    const companyId = application.companyId;

    await prisma.application.delete({
      where: { id },
    });

    // If deleteCompany is requested, check if it's safe to delete
    if (companyId && deleteCompany) {
      const otherApplications = await prisma.application.count({
        where: { companyId },
      });

      if (otherApplications === 0) {
        await prisma.company.delete({
          where: { id: companyId },
        });
      }
    }

    return { message: 'Candidature supprimée avec succès' };
  },

  async getStats(userId: string) {
    const [
      total,
      thisMonth,
      byStatus,
      byJobType,
      interviews,
    ] = await Promise.all([
      prisma.application.count({ where: { userId } }),
      prisma.application.count({
        where: {
          userId,
          applicationDate: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      prisma.application.groupBy({
        by: ['status'],
        where: { userId },
        _count: true,
      }),
      prisma.application.groupBy({
        by: ['jobType'],
        where: { userId },
        _count: true,
      }),
      prisma.application.count({
        where: {
          userId,
          status: 'INTERVIEW_SCHEDULED',
        },
      }),
    ]);

    const statusCounts = byStatus.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {} as Record<string, number>);

    const jobTypeCounts = byJobType.reduce((acc, item) => {
      acc[item.jobType] = item._count;
      return acc;
    }, {} as Record<string, number>);

    // Calculate response rate
    const responded = (statusCounts['INTERVIEW_SCHEDULED'] || 0) +
      (statusCounts['REJECTED'] || 0) +
      (statusCounts['ACCEPTED'] || 0) +
      (statusCounts['VIEWED'] || 0);
    const sent = total - (statusCounts['DRAFT'] || 0);
    const responseRate = sent > 0 ? Math.round((responded / sent) * 100) : 0;

    return {
      total,
      thisMonth,
      interviews,
      responseRate,
      byStatus: statusCounts,
      byJobType: jobTypeCounts,
    };
  },

  async getByStatus(userId: string) {
    const applications = await prisma.application.findMany({
      where: { userId },
      include: {
        company: true,
        reminders: {
          where: { isCompleted: false },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Group by status for Kanban
    const grouped = {
      DRAFT: applications.filter(a => a.status === 'DRAFT'),
      SENT: applications.filter(a => a.status === 'SENT'),
      VIEWED: applications.filter(a => a.status === 'VIEWED'),
      INTERVIEW_SCHEDULED: applications.filter(a => a.status === 'INTERVIEW_SCHEDULED'),
      AWAITING_RESPONSE: applications.filter(a => a.status === 'AWAITING_RESPONSE'),
      REJECTED: applications.filter(a => a.status === 'REJECTED'),
      ACCEPTED: applications.filter(a => a.status === 'ACCEPTED'),
      GHOSTED: applications.filter(a => a.status === 'GHOSTED'),
    };

    return grouped;
  },
};
