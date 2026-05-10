import axios from 'axios';
import { supabase } from '../supabaseClient';

// TU USTALAMY ADRES NASZEGO SERWERA BACKENDOWEGO
const API_URL = 'http://localhost:5000/api';

// TU TWORZYMY INSTANCJĘ AXIOSA, KTÓRA BĘDZIE NASZYM "KURIEREM" DO API
const api = axios.create({
  baseURL: API_URL,
});

// TU USTALAMY "INTERCEPTOR" – TO AUTOMATYCZNA FUNKCJA, KTÓRA PRZED KAŻDYM WYSŁANIEM
// DANYCH DOKLEJA TOKEN ZALOGOWANEGO UŻYTKOWNIKA DO NAGŁÓWKA.
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// --- SERWIS PROJEKTÓW ---
// TU GRUPUJEMY WSZYSTKIE FUNKCJE DOTYCZĄCE PROJEKTÓW, ŻEBY KOMPONENTY BYŁY "CZYSTE"
export const projectService = {
  // TU POBIERAMY LISTĘ PROJEKTÓW Z BACKENDU
  getProjects: () => api.get('/projects').then(res => res.data),
  
  // TU POBIERAMY SZCZEGÓŁY JEDNEGO PROJEKTU PO JEGO ID
  getProject: (id: string) => api.get(`/projects/${id}`).then(res => res.data),
  
  // TU WYSYŁAMY DANE NOWEGO PROJEKTU DO SERWERA
  createProject: (data: { name: string; description: string }) => api.post('/projects', data).then(res => res.data),
  
  // TU AKTUALIZUJEMY PROJEKT
  updateProject: (id: string, data: any) => api.patch(`/projects/${id}`, data).then(res => res.data),
  
  // TU USUWAMY PROJEKT
  deleteProject: (id: string) => api.delete(`/projects/${id}`).then(res => res.data),
};

// --- SERWIS ZADAŃ ---
export const taskService = {
  getTasks: (projectId: string) => api.get(`/projects/${projectId}/tasks`).then(res => res.data),
  createTask: (projectId: string, data: any) => api.post(`/projects/${projectId}/tasks`, data).then(res => res.data),
  updateTask: (taskId: string, data: any) => api.patch(`/tasks/${taskId}`, data).then(res => res.data),
  deleteTask: (taskId: string) => api.delete(`/tasks/${taskId}`).then(res => res.data),
};

// --- SERWIS ZESPOŁÓW (ETAP 4) ---
export const teamService = {
  getTeams: () => api.get('/teams').then(res => res.data),
  createTeam: (data: { name: string }) => api.post('/teams', data).then(res => res.data),
  inviteMember: (teamId: string, email: string) => api.post(`/teams/${teamId}/invite`, { email }).then(res => res.data),
  getMembers: (teamId: string) => api.get(`/teams/${teamId}/members`).then(res => res.data),
};

export const uploadService = {
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};

export const userService = {
  getUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  }
};

export const activityService = {
  getHistory: async () => {
    const response = await api.get('/activity');
    return response.data;
  }
};

export default api;
