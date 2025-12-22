import prisma from '../config/database.js';
import { createError } from '../middlewares/errorHandler.middleware.js';

interface CreateCompanyData {
  userId: string;
  name: string;
  industry?: string;
  size?: string;
  location?: string;
  website?: string;
  description?: string;
  notes?: string;
}

interface CreateReviewData {
  companyId: string;
  rating: number;
  comment?: string;
  position: string;
  salary?: string;
  wasHired: boolean;
  interviewExperience?: string;
}

export const companyService = {
  async getAll(userId: string, search?: string) {
    const where: any = { userId };
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { industry: { contains: search } },
      ];
    }

    const companies = await prisma.company.findMany({
      where,
      include: {
        _count: {
          select: {
            applications: true,
            reviews: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return companies.map(company => {
      const avgRating = company.reviews.length > 0
        ? company.reviews.reduce((acc, r) => acc + r.rating, 0) / company.reviews.length
        : null;

      return {
        ...company,
        averageRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
        applicationCount: company._count.applications,
        reviewCount: company._count.reviews,
      };
    });
  },

  async getById(id: string) {
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        reviews: {
          include: {
            user: {
              select: {
                firstName: true,
                school: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    if (!company) {
      throw createError('Entreprise non trouvée', 404);
    }

    const avgRating = company.reviews.length > 0
      ? company.reviews.reduce((acc, r) => acc + r.rating, 0) / company.reviews.length
      : null;

    return {
      ...company,
      averageRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
      applicationCount: company._count.applications,
    };
  },

  async search(query: string) {
    const companies = await prisma.company.findMany({
      where: {
        name: { contains: query },
      },
      select: {
        id: true,
        name: true,
        industry: true,
      },
      take: 10,
    });

    return companies;
  },

  async create(data: CreateCompanyData) {
    const existing = await prisma.company.findFirst({
      where: { name: data.name, userId: data.userId },
    });

    if (existing) {
      throw createError('Cette entreprise existe déjà', 400);
    }

    const company = await prisma.company.create({
      data: {
        userId: data.userId,
        name: data.name,
        industry: data.industry,
        size: data.size,
        location: data.location,
        website: data.website,
        description: data.description,
        notes: data.notes,
      },
    });

    return company;
  },

  async addReview(userId: string, data: CreateReviewData) {
    const company = await prisma.company.findUnique({
      where: { id: data.companyId },
    });

    if (!company) {
      throw createError('Entreprise non trouvée', 404);
    }

    // Check if user already reviewed this company
    const existingReview = await prisma.companyReview.findFirst({
      where: { companyId: data.companyId, userId },
    });

    if (existingReview) {
      throw createError('Vous avez déjà laissé un avis pour cette entreprise', 400);
    }

    const review = await prisma.companyReview.create({
      data: {
        ...data,
        userId,
      },
    });

    return review;
  },

  async getReviews(companyId: string) {
    const reviews = await prisma.companyReview.findMany({
      where: { companyId },
      include: {
        user: {
          select: {
            firstName: true,
            school: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reviews;
  },
};
