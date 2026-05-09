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
  // TU POBIERAMY ZADANIA DLA KONKRETNEGO PROJEKTU
  getTasks: (projectId: string) => api.get(`/projects/${projectId}/tasks`).then(res => res.data),
  
  // TU DODAJEMY NOWE ZADANIE DO PROJEKTU
  createTask: (projectId: string, data: any) => api.post(`/projects/${projectId}/tasks`, data).then(res => res.data),
  
  // TU ZMIENIAMY STATUS LUB TREŚĆ ZADANIA
  updateTask: (taskId: string, data: any) => api.patch(`/tasks/${taskId}`, data).then(res => res.data),
  
  // TU USUWAMY ZADANIE
  deleteTask: (taskId: string) => api.delete(`/tasks/${taskId}`).then(res => res.data),
};

export default api;
