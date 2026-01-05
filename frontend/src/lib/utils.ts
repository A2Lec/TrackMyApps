import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { ApplicationStatus, JobType } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format date to French format
 */
export function formatDate(date: string | Date, format: 'short' | 'long' = 'short'): string {
  const d = new Date(date);
  if (format === 'long') {
    return d.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  }
  return d.toLocaleDateString('fr-FR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });
}

/**
 * Format date and time to French format
 */
export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Status labels for applications
 */
export const statusLabels: Record<ApplicationStatus, string> = {
  DRAFT: 'Brouillon',
  SENT: 'Envoyée',
  VIEWED: 'Vue',
  INTERVIEW_SCHEDULED: 'Entretien prévu',
  AWAITING_RESPONSE: 'En attente',
  REJECTED: 'Rejetée',
  ACCEPTED: 'Acceptée',
  GHOSTED: 'Ghostée',
};

/**
 * Status colors for applications
 */
export const statusColors: Record<ApplicationStatus, string> = {
  DRAFT: 'bg-gray-500/10 text-gray-700 border-gray-200',
  SENT: 'bg-blue-500/10 text-blue-700 border-blue-200',
  VIEWED: 'bg-cyan-500/10 text-cyan-700 border-cyan-200',
  INTERVIEW_SCHEDULED: 'bg-purple-500/10 text-purple-700 border-purple-200',
  AWAITING_RESPONSE: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
  REJECTED: 'bg-red-500/10 text-red-700 border-red-200',
  ACCEPTED: 'bg-green-500/10 text-green-700 border-green-200',
  GHOSTED: 'bg-orange-500/10 text-orange-700 border-orange-200',
};

/**
 * Job type labels
 */
export const jobTypeLabels: Record<JobType, string> = {
  CDI: 'CDI',
  CDD: 'CDD',
  FREELANCE: 'Freelance',
  STAGE: 'Stage',
  ALTERNANCE: 'Alternance',
  INTERIM: 'Intérim',
};

/**
 * Job type colors
 */
export const jobTypeColors: Record<JobType, string> = {
  CDI: 'bg-green-500/10 text-green-700 border-green-200',
  CDD: 'bg-blue-500/10 text-blue-700 border-blue-200',
  FREELANCE: 'bg-purple-500/10 text-purple-700 border-purple-200',
  STAGE: 'bg-orange-500/10 text-orange-700 border-orange-200',
  ALTERNANCE: 'bg-cyan-500/10 text-cyan-700 border-cyan-200',
  INTERIM: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
};
