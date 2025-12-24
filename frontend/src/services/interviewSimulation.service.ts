import api from './api';

export interface InterviewSession {
  id: string;
  title: string;
  interviewerType: 'HR' | 'MANAGER' | 'TECHNICAL' | 'CTO';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  status: 'IN_PROGRESS' | 'COMPLETED';
  messages: InterviewMessage[];
}

export interface InterviewMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  createdAt: string;
}

interface StartSessionData {
  applicationId: string;
  interviewerType: string;
  difficulty: string;
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

  async getSession(sessionId: string): Promise<InterviewSession> {
      const response = await api.get(`/interview-simulation/${sessionId}`);
      return response.data;
  }
};
