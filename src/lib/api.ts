// Importaciones necesarias
import axios from 'axios';

// Define la URL base de la API
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337';

// Tipo para los datos de cambio de contraseña
type PasswordChangePayload = {
  currentPassword: string;
  password: string;
  passwordConfirmation: string;
  updateMustChangePassword?: boolean;
};

// Servicio de autenticación - exportado como objeto nombrado
export const authService = {
  // Login de usuario
  async login(identifier: string, password: string) {
    try {
      console.log(`Enviando solicitud de login a ${API_URL}/auth/local`);
      
      const response = await axios.post(`${API_URL}/auth/local`, {
        identifier,
        password,
      });
      
      console.log('Respuesta de login recibida:', response.status);
      return response.data;
    } catch (error) {
      console.error('Error en servicio de login:', error);
      throw error;
    }
  },

  // Obtener usuario actual
  async getCurrentUser(token: string) {
    try {
      console.log(`Obteniendo usuario actual desde ${API_URL}/users/me`);
      
      const response = await axios.get(`${API_URL}/users/me?populate=*`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log('Datos de usuario obtenidos correctamente');
      return response.data;
    } catch (error) {
      console.error('Error al obtener usuario actual:', error);
      throw error;
    }
  },

  // Cambiar contraseña
  async changePassword(passwordData: PasswordChangePayload, token: string) {
    try {
      console.log(`Enviando solicitud de cambio de contraseña a ${API_URL}/auth/change-password`);
      
      const payload = {
        currentPassword: passwordData.currentPassword,
        password: passwordData.password,
        passwordConfirmation: passwordData.passwordConfirmation
      };
      
      // Si se debe actualizar el flag mustChangePassword, lo añadimos al payload
      if (passwordData.updateMustChangePassword !== undefined) {
        Object.assign(payload, { 
          updateMustChangePassword: true 
        });
      }
      
      const response = await axios.post(
        `${API_URL}/auth/change-password`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      console.log('Respuesta de cambio de contraseña:', response.status);
      return response.data;
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      throw error;
    }
  },

  // Otros métodos que puedas tener...
};

// Exporta otros servicios como objetos nombrados
export const consultasService = {
  // Método para crear una consulta
  async createConsulta(consultaData) {
    try {
      console.log(`Enviando consulta a ${API_URL}/api/consultas`);
      
      const token = localStorage.getItem('jwt');
      if (!token) {
        throw new Error('No se encontró el token de autenticación');
      }
      
      const response = await axios.post(
        `${API_URL}/api/consultas`, 
        consultaData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      console.log('Consulta creada correctamente');
      return response.data;
    } catch (error) {
      console.error('Error al crear consulta:', error);
      throw error;
    }
  },
  
  // Otros métodos para consultas...
};