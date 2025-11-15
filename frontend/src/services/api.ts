import axios from 'axios';
import {
  HealthResponse,
  MatchStatus,
  CreateAlertRequest,
  AlertResponse,
  AlertMonitor,
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const healthAPI = {
  check: async (): Promise<HealthResponse> => {
    const response = await api.get<HealthResponse>('/health');
    return response.data;
  },
};

export const matchAPI = {
  getStatus: async (matchId: number): Promise<MatchStatus> => {
    const response = await api.get<MatchStatus>(`/api/v1/matches/${matchId}`);
    return response.data;
  },
};

export const alertAPI = {
  create: async (data: CreateAlertRequest): Promise<AlertResponse> => {
    const response = await api.post<AlertResponse>('/api/v1/alerts', data);
    return response.data;
  },
  
  list: async (): Promise<AlertMonitor[]> => {
    const response = await api.get<AlertMonitor[]>('/api/v1/alerts');
    return response.data;
  },
  
  get: async (monitorId: string): Promise<AlertMonitor> => {
    const response = await api.get<AlertMonitor>(`/api/v1/alerts/${monitorId}`);
    return response.data;
  },
  
  delete: async (monitorId: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/api/v1/alerts/${monitorId}`);
    return response.data;
  },
};

export default api;
