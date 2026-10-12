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
    if (!userId) {
      return [];
    }

    const where: any = { userId };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { industry: { contains: search, mode: 'insensitive' } },
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

  async getById(userId: string, id: string) {
    const company = await prisma.company.findFirst({
      where: { id, userId },
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

  async search(userId: string, query: string) {
    const companies = await prisma.company.findMany({
      where: {
        userId,
        name: { contains: query, mode: 'insensitive' },
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
      where: { name: { equals: data.name, mode: 'insensitive' }, userId: data.userId },
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
    const company = await prisma.company.findFirst({
      where: { id: data.companyId, userId },
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

    // Only persist columns that exist on CompanyReview (extra form fields are not stored)
    const review = await prisma.companyReview.create({
      data: {
        companyId: data.companyId,
        rating: Number(data.rating),
        comment: data.comment,
        userId,
      },
    });

    return review;
  },

  async getReviews(userId: string, companyId: string) {
    const company = await prisma.company.findFirst({
      where: { id: companyId, userId },
      select: { id: true },
    });
    if (!company) {
      throw createError('Entreprise non trouvée', 404);
    }

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

  async delete(userId: string, id: string, deleteApplications: boolean = false) {
    const company = await prisma.company.findFirst({
      where: { id, userId },
    });

    if (!company) {
      throw createError('Entreprise non trouvée', 404);
    }

    if (deleteApplications) {
      // Delete associated applications
      await prisma.application.deleteMany({
        where: { companyId: id, userId },
      });
    } else {
      // Unlink applications
      await prisma.application.updateMany({
        where: { companyId: id },
        data: { companyId: null },
      });
    }

    await prisma.company.delete({
      where: { id },
    });
  },
};
