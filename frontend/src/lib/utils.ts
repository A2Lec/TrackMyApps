import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, format: 'short' | 'long' = 'short'): string {
  const d = new Date(date)
  if (format === 'short') {
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRelativeDate(date: string | Date): string {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return "Aujourd'hui"
  if (days === 1) return "Hier"
  if (days < 7) return `Il y a ${days} jours`
  if (days < 30) return `Il y a ${Math.floor(days / 7)} semaines`
  return formatDate(date)
}

export const statusLabels: Record<string, string> = {
  DRAFT: 'Brouillon',
  SENT: 'Envoyée',
  VIEWED: 'Vue',
  INTERVIEW_SCHEDULED: 'Entretien',
  AWAITING_RESPONSE: 'En attente',
  REJECTED: 'Refusée',
  ACCEPTED: 'Acceptée',
  GHOSTED: 'Ghosted',
}

export const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SENT: 'bg-blue-100 text-blue-700',
  VIEWED: 'bg-purple-100 text-purple-700',
  INTERVIEW_SCHEDULED: 'bg-green-100 text-green-700',
  AWAITING_RESPONSE: 'bg-yellow-100 text-yellow-700',
  REJECTED: 'bg-red-100 text-red-700',
  ACCEPTED: 'bg-emerald-100 text-emerald-700',
  GHOSTED: 'bg-gray-200 text-gray-600',
}

export const jobTypeLabels: Record<string, string> = {
  STAGE: 'Stage',
  ALTERNANCE: 'Alternance',
  CDI: 'CDI',
  JOB_ETUDIANT: 'Job étudiant',
}

export const jobTypeColors: Record<string, string> = {
  STAGE: 'bg-indigo-100 text-indigo-700',
  ALTERNANCE: 'bg-cyan-100 text-cyan-700',
  CDI: 'bg-orange-100 text-orange-700',
  JOB_ETUDIANT: 'bg-pink-100 text-pink-700',
}
