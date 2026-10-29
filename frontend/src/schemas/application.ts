import { z } from 'zod';

// Every field is registered in the form with an empty-string default,
// so optional text fields are plain strings (possibly empty)
export const applicationSchema = z.object({
  companyName: z.string().min(1, 'Le nom de l\'entreprise est requis'),
  position: z.string().min(1, 'Le poste est requis'),
  jobType: z.enum(['STAGE', 'ALTERNANCE', 'CDI', 'JOB_ETUDIANT']),
  location: z.string(),
  jobUrl: z.union([z.url('URL invalide'), z.literal('')]),
  salary: z.string(),
  notes: z.string(),
  jobDescription: z.string(),
  status: z.enum(['DRAFT', 'SENT']),
});

export type ApplicationFormData = z.infer<typeof applicationSchema>;
