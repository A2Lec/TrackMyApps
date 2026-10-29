import { Briefcase, Code2, Mic, Users, type LucideIcon } from 'lucide-react';
import type { InterviewSession } from '@/services/interviewSimulation.service';

export type InterviewerType = InterviewSession['interviewerType'];
export type Difficulty = InterviewSession['difficulty'];

export interface SimulationConfig {
  interviewerType: InterviewerType;
  difficulty: Difficulty;
  cvId?: string;
  lmId?: string;
}

export const INTERVIEWER_TYPES: { id: InterviewerType; label: string; desc: string; icon: LucideIcon; color: string }[] = [
  {
    id: 'HR',
    label: 'Recruteur RH',
    desc: 'Soft skills, motivation et parcours',
    icon: Users,
    color: 'text-status-sent bg-secondary border-border',
  },
  {
    id: 'MANAGER',
    label: "Manager d'équipe",
    desc: 'Expérience, méthode et intégration',
    icon: Briefcase,
    color: 'text-status-interview bg-secondary border-border',
  },
  {
    id: 'TECHNICAL',
    label: 'Lead Technique',
    desc: 'Compétences dures, architecture et code',
    icon: Code2,
    color: 'text-status-interview bg-secondary border-border',
  },
  {
    id: 'CTO',
    label: 'Directeur Technique',
    desc: 'Vision globale et choix stratégiques',
    icon: Mic,
    color: 'text-warning-strong bg-warning-soft border-warning/40',
  },
];

export const DIFFICULTY_LEVELS: { id: Difficulty; label: string; desc: string }[] = [
  { id: 'EASY', label: 'Bienveillant', desc: 'Idéal premier entraînement' },
  { id: 'MEDIUM', label: 'Standard', desc: 'Conditions réelles' },
  { id: 'HARD', label: 'Exigeant', desc: 'Questions pointues & relances' },
];

export const getInterviewer = (type: InterviewerType) =>
  INTERVIEWER_TYPES.find((t) => t.id === type) ?? INTERVIEWER_TYPES[0];

export const getDifficultyLabel = (difficulty: Difficulty) =>
  DIFFICULTY_LEVELS.find((d) => d.id === difficulty)?.label ?? 'Standard';

/** Question-bank category matching the interviewer's focus */
export function categoryForInterviewer(type: InterviewerType): string {
  if (type === 'TECHNICAL' || type === 'CTO') return 'TECHNICAL';
  if (type === 'MANAGER') return 'SITUATIONAL';
  return 'BEHAVIORAL';
}

/** "Microsoft Denise Online (Natural) - French (France)" -> "Denise" */
export const shortVoiceName = (name: string) =>
  name.replace(/Online \(Natural\) - French \(France\)|Microsoft |Google /gi, '').trim();
