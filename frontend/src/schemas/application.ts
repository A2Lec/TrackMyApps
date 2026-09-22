import { z } from 'zod';

export const applicationSchema = z.object({
  companyName: z.string().min(1, 'Le nom de l\'entreprise est requis'),
  position: z.string().min(1, 'Le poste est requis'),
  jobType: z.enum(['STAGE', 'ALTERNANCE', 'CDI', 'JOB_ETUDIANT']),
  location: z.string().optional().default(''),
  jobUrl: z.string().url('URL invalide').or(z.literal('')).optional().default(''),
  salary: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  jobDescription: z.string().optional().default(''),
  status: z.enum(['DRAFT', 'SENT']),
});

export type ApplicationFormData = z.infer<typeof applicationSchema>;
