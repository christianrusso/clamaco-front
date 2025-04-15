import axios from 'axios';

const API_URL = 'http://localhost:1337/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Añadir token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authService = {
  login: async (identifier: string, password: string) => {
    const response = await api.post('/auth/local', {
      identifier,
      password,
    });
    return response.data;
  },
  getClienteInfo: async () => {
    const response = await api.get('/clientes/me');
    return response.data;
  },
};

export const obrasService = {
  getObras: async () => {
    const response = await api.get('/obras');
    return response.data;
  },
  getObra: async (id: string) => {
    const response = await api.get(`/obras/${id}`);
    return response.data;
  },
  // Método mejorado con populate para obtener relaciones
  getObrasDetalladas: async () => {
    const response = await api.get('/obras?populate=*');
    return response.data;
  },
};

export const departamentosService = {
  // Método original
  getDepartamentos: async () => {
    const response = await api.get('/departamentos');
    return response.data;
  },
  getDepartamento: async (id: string) => {
    const response = await api.get(`/departamentos/${id}`);
    return response.data;
  },
  // Método mejorado con populate para obtener relaciones
  getDepartamentosDetallados: async () => {
    const response = await api.get('/departamentos?populate=*');
    return response.data;
  },
  // Método específico para obtener departamentos por cliente y obra
  getDepartamentosPorClienteYObra: async (clienteId: number, obraId: number) => {
    const response = await api.get(`/departamentos?filters[cliente][id]=${clienteId}&filters[obra][id]=${obraId}&populate=*`);
    return response.data;
  },
  // Obtener un departamento específico por documentId
  getDepartamentoByDocumentId: async (documentId: string) => {
    const response = await api.get(`/departamentos?filters[documentId]=${documentId}&populate=*`);
    return response.data;
  },
};

export const consultasService = {
  getConsultas: async () => {
    const response = await api.get('/consultas');
    return response.data;
  },
  createConsulta: async (data: any) => {
    const response = await api.post('/consultas', { data });
    return response.data;
  },
};

export default api;
