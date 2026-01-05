import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs/promises';

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  userId?: string;
}

/**
 * Export all user data (GDPR Article 15)
 * Format: JSON or CSV (query param)
 */
export async function exportUserData(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const format = (req.query.format as string) || 'json';

    // Fetch all user data
    const [user, applications, documents, reminders, companies] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          createdAt: true,
          updatedAt: true,
          emailVerified: true,
        },
      }),
      prisma.application.findMany({
        where: { userId },
        include: {
          company: {
            select: {
              name: true,
              website: true,
              location: true,
            },
          },
        },
      }),
      prisma.document.findMany({
        where: { userId },
      }),
      prisma.reminder.findMany({
        where: { userId },
        include: {
          application: {
            select: {
              position: true,
              companyName: true,
            },
          },
        },
      }),
      prisma.company.findMany({
        where: { userId },
      }),
    ]);

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const exportData = {
      user,
      applications: applications.map(app => ({
        ...app,
        companyName: app.company?.name,
        company: undefined,
      })),
      documents,
      reminders: reminders.map(rem => ({
        ...rem,
        applicationTitle: rem.application?.position,
        companyName: rem.application?.companyName,
        application: undefined,
      })),
      companies,
      exportedAt: new Date().toISOString(),
    };

    if (format === 'json') {
      // JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="trackmyapps-data-${userId}.json"`);
      return res.json(exportData);
    } else if (format === 'csv') {
      // CSV format (simplified - one CSV per entity)
      const csvData: string[] = [];
      
      // User CSV
      csvData.push('=== USER ===');
      csvData.push('id,email,firstName,lastName,emailVerified,createdAt');
      csvData.push(`${user.id},${user.email},${user.firstName || ''},${user.lastName || ''},${user.emailVerified},${user.createdAt}`);
      csvData.push('');
      
      // Applications CSV
      csvData.push('=== APPLICATIONS ===');
      csvData.push('id,position,company,status,location,salary,createdAt,notes');
      applications.forEach(app => {
        csvData.push(`${app.id},"${app.position}","${app.company?.name || app.companyName}",${app.status},"${app.location || ''}","${app.salary || ''}",${app.createdAt},"${(app.notes || '').replace(/"/g, '""')}"`);
      });
      csvData.push('');
      
      // Documents CSV
      csvData.push('=== DOCUMENTS ===');
      csvData.push('id,name,type,fileName,createdAt');
      documents.forEach(doc => {
        csvData.push(`${doc.id},"${doc.name}",${doc.type},"${doc.fileName}",${doc.createdAt}`);
      });
      csvData.push('');
      
      // Reminders CSV
      csvData.push('=== REMINDERS ===');
      csvData.push('id,title,description,dueDate,isCompleted,type');
      reminders.forEach(rem => {
        csvData.push(`${rem.id},"${rem.title}","${rem.description || ''}",${rem.dueDate},${rem.isCompleted},${rem.type}`);
      });
      csvData.push('');
      
      // Companies CSV
      csvData.push('=== COMPANIES ===');
      csvData.push('id,name,website,location,industry,notes');
      companies.forEach(comp => {
        csvData.push(`${comp.id},"${comp.name}","${comp.website || ''}","${comp.location || ''}","${comp.industry || ''}","${(comp.notes || '').replace(/"/g, '""')}"`);
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="trackmyapps-data-${userId}.csv"`);
      return res.send('\ufeff' + csvData.join('\n')); // UTF-8 BOM for Excel
    } else {
      return res.status(400).json({ error: 'Format non supporté. Utilisez ?format=json ou ?format=csv' });
    }
  } catch (error) {
    console.error('Export error:', error);
    return res.status(500).json({ error: 'Erreur lors de l\'export des données' });
  }
}

/**
 * Delete user account and all associated data (GDPR Article 17 - Right to be forgotten)
 */
export async function deleteUserAccount(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;

    // Get all documents to delete files
    const documents = await prisma.document.findMany({
      where: { userId },
      select: { fileUrl: true },
    });

    // Delete all user data in transaction
    await prisma.$transaction(async (tx) => {
      // Delete in correct order (respecting foreign keys)
      await tx.reminder.deleteMany({ where: { userId } });
      await tx.interviewSession.deleteMany({ where: { userId } });
      await tx.document.deleteMany({ where: { userId } });
      await tx.application.deleteMany({ where: { userId } });
      await tx.company.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    });

    // Delete uploaded files
    for (const doc of documents) {
      try {
        const filePath = path.join(process.cwd(), doc.fileUrl);
        await fs.unlink(filePath);
      } catch (error) {
        console.error(`Failed to delete file ${doc.fileUrl}:`, error);
        // Continue even if file deletion fails
      }
    }

    return res.json({ 
      message: 'Compte supprimé avec succès',
      deletedData: {
        documents: documents.length,
      }
    });
  } catch (error) {
    console.error('Account deletion error:', error);
    return res.status(500).json({ error: 'Erreur lors de la suppression du compte' });
  }
}
