import api from './api';

export interface InterviewFeedback {
  score: number;
  strengths: string[];
  improvements: string[];
  idealAnswer?: {
    question: string;
    improvedAnswer: string;
  };
  summary: string;
}

export interface InterviewSession {
  id: string;
  title: string;
  interviewerType: 'HR' | 'MANAGER' | 'TECHNICAL' | 'CTO';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  status: 'IN_PROGRESS' | 'COMPLETED';
  messages: InterviewMessage[];
  createdAt: string;
  updatedAt: string;
  application?: {
    id: string;
    companyName: string;
    position: string;
    status: string;
  };
  _count?: {
    messages: number;
  };
}

export interface InterviewMessage {
  id: string;
  role: 'user' | 'model' | 'feedback';
  content: string;
  createdAt: string;
}

export interface StartSessionData {
  applicationId?: string;
  isFreePractice?: boolean;
  targetRole?: string;
  contractType?: string;
  jobDescription?: string;
  interviewerType: string;
  difficulty: string;
  cvId?: string;
  lmId?: string;
}

export const interviewSimulationService = {
  async startSession(data: StartSessionData): Promise<{ sessionId: string; message: string }> {
    const response = await api.post('/interview-simulation/start', data);
    return response.data;
  },

  async sendMessage(sessionId: string, message: string): Promise<{ message: string }> {
    const response = await api.post(`/interview-simulation/${sessionId}/message`, { message });
    return response.data;
  },

  async completeSession(sessionId: string): Promise<InterviewFeedback> {
    const response = await api.post(`/interview-simulation/${sessionId}/complete`);
    return response.data;
  },

  async getSession(sessionId: string): Promise<InterviewSession> {
    const response = await api.get(`/interview-simulation/${sessionId}`);
    return response.data;
  },

  async getAllSessions(): Promise<InterviewSession[]> {
    const response = await api.get('/interview-simulation/sessions');
    return response.data;
  },

  async getSessionsByApplication(applicationId: string): Promise<InterviewSession[]> {
    const response = await api.get(`/interview-simulation/application/${applicationId}`);
    return response.data;
  },

  async deleteSession(sessionId: string): Promise<void> {
    await api.delete(`/interview-simulation/${sessionId}`);
  },
};
