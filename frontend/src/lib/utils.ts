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
  DRAFT: 'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-100',
  SENT: 'bg-blue-200 text-blue-700 dark:bg-blue-600 dark:text-blue-100',
  VIEWED: 'bg-purple-200 text-purple-700 dark:bg-purple-600 dark:text-purple-100',
  INTERVIEW_SCHEDULED: 'bg-green-200 text-green-700 dark:bg-green-600 dark:text-green-100',
  AWAITING_RESPONSE: 'bg-amber-200 text-amber-700 dark:bg-amber-500 dark:text-amber-100',
  REJECTED: 'bg-red-200 text-red-700 dark:bg-red-500 dark:text-red-100',
  ACCEPTED: 'bg-emerald-200 text-emerald-700 dark:bg-emerald-500 dark:text-emerald-100',
  GHOSTED: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-500 dark:text-zinc-100',
}

export const jobTypeLabels: Record<string, string> = {
  STAGE: 'Stage',
  ALTERNANCE: 'Alternance',
  CDI: 'CDI',
  JOB_ETUDIANT: 'Job étudiant',
}

export const jobTypeColors: Record<string, string> = {
  STAGE: 'bg-indigo-200 text-indigo-700 dark:bg-indigo-600 dark:text-indigo-100',
  ALTERNANCE: 'bg-cyan-200 text-cyan-700 dark:bg-cyan-600 dark:text-cyan-100',
  CDI: 'bg-orange-200 text-orange-700 dark:bg-orange-500 dark:text-orange-100',
  JOB_ETUDIANT: 'bg-pink-200 text-pink-700 dark:bg-pink-600 dark:text-pink-100',
}
