export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  school?: string;
  graduationYear?: number;
  field?: string;
  avatarUrl?: string;
  emailNotifications: boolean;
  relanceFrequency: number;
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  id: string;
  userId: string;
  companyId?: string;
  companyName: string;
  position: string;
  jobType: JobType;
  location: string;
  status: ApplicationStatus;
  applicationDate: string;
  jobUrl?: string;
  salary?: string;
  notes?: string;
  cvUsedId?: string;
  lmUsedId?: string;
  cvUsed?: Document;
  lmUsed?: Document;
  lastRelanceDate?: string;
  interviewDate?: string;
  decisionDate?: string;
  createdAt: string;
  updatedAt: string;
  company?: Company;
  events?: ApplicationEvent[];
  reminders?: Reminder[];
}

export type JobType = 'STAGE' | 'ALTERNANCE' | 'CDI' | 'JOB_ETUDIANT';

export type ApplicationStatus = 
  | 'DRAFT'
  | 'SENT'
  | 'VIEWED'
  | 'INTERVIEW_SCHEDULED'
  | 'AWAITING_RESPONSE'
  | 'REJECTED'
  | 'ACCEPTED'
  | 'GHOSTED';

export interface ApplicationEvent {
  id: string;
  applicationId: string;
  eventType: EventType;
  eventDate: string;
  notes?: string;
  createdAt: string;
}

export type EventType = 
  | 'CREATED'
  | 'SENT'
  | 'VIEWED'
  | 'RELANCE_SENT'
  | 'INTERVIEW_SCHEDULED'
  | 'INTERVIEW_DONE'
  | 'REJECTED'
  | 'ACCEPTED'
  | 'STATUS_CHANGED';

export interface Document {
  id: string;
  userId: string;
  type: DocumentType;
  name: string;
  version?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  isMain: boolean;
  createdAt: string;
  updatedAt: string;
  usageCount?: number;
}

export type DocumentType = 'CV' | 'LETTRE_MOTIVATION' | 'COVER_LETTER' | 'PORTFOLIO' | 'OTHER';

export interface Company {
  id: string;
  name: string;
  sector?: string;
  size?: string;
  websiteUrl?: string;
  averageResponseTime?: number;
  cultureTags: string[];
  hiringProcess?: string;
  createdAt: string;
  updatedAt: string;
  averageRating?: number;
  applicationCount?: number;
  reviewCount?: number;
}

export interface CompanyReview {
  id: string;
  companyId: string;
  userId: string;
  rating: number;
  comment?: string;
  position: string;
  salary?: string;
  wasHired: boolean;
  interviewExperience?: string;
  createdAt: string;
  user?: {
    firstName: string;
    school?: string;
  };
}

export interface Reminder {
  id: string;
  userId: string;
  applicationId?: string;
  title: string;
  description?: string;
  type: string;
  dueDate: string;
  isCompleted: boolean;
  createdAt: string;
  application?: {
    id: string;
    companyName: string;
    position: string;
    status: ApplicationStatus;
  };
}

export type ReminderType = 
  | 'RELANCE'
  | 'INTERVIEW_PREP'
  | 'THANK_YOU_EMAIL'
  | 'FOLLOW_UP'
  | 'DEADLINE'
  | 'INTERVIEW'
  | 'CUSTOM'
  | 'OTHER';

export interface InterviewPrep {
  id: string;
  userId: string;
  question: string;
  answer?: string;
  category: string;
  notes?: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  stats: {
    totalApplications: number;
    thisMonthApplications: number;
    scheduledInterviews: number;
    pendingReminders: number;
    responseRate: number;
  };
  byStatus: Record<string, number>;
  recentApplications: Application[];
  upcomingInterviews: Application[];
}

export interface AnalyticsData {
  applicationsByMonth: { month: string; count: number }[];
  byJobType: { jobType: JobType; count: number }[];
  byStatus: { status: ApplicationStatus; count: number }[];
  topCompanies: { companyName: string; count: number }[];
  conversionFunnel: {
    total: number;
    sent: number;
    responded: number;
    interviewed: number;
    accepted: number;
    responseRate: number;
    interviewRate: number;
    acceptanceRate: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface KanbanColumns {
  DRAFT: Application[];
  SENT: Application[];
  VIEWED: Application[];
  INTERVIEW_SCHEDULED: Application[];
  AWAITING_RESPONSE: Application[];
  REJECTED: Application[];
  ACCEPTED: Application[];
  GHOSTED: Application[];
}
