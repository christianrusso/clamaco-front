// Suponiendo que este es el archivo api.ts o un fragmento del mismo

// Importaciones necesarias (ajusta según tu proyecto)
import axios from 'axios';

// URL base de la API (ajusta según tu configuración)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337';

// Tipo para los datos de cambio de contraseña
type PasswordChangePayload = {
  currentPassword: string;
  password: string;
  passwordConfirmation: string;
};

// Servicio de autenticación
export const authService = {
  // Métodos existentes
  async login(identifier: string, password: string) {
    try {
      const response = await axios.post(`${API_URL}/auth/local`, {
        identifier,
        password,
      });
      return response.data;
    } catch (error) {
      console.error('Error en servicio de login:', error);
      throw error;
    }
  },

  async getCurrentUser(token: string) {
    try {
      const response = await axios.get(`${API_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener usuario actual:', error);
      throw error;
    }
  },

  // Nuevo método para cambiar la contraseña
  async changePassword(passwordData: PasswordChangePayload, token: string) {
    try {
      const response = await axios.post(
        `${API_URL}/auth/change-password`,
        {
          currentPassword: passwordData.currentPassword,
          password: passwordData.password,
          passwordConfirmation: passwordData.passwordConfirmation,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      throw error;
    }
  },

  // Otros métodos que puedas tener...
};

// Exporta otros servicios si los tienes
export const consultasService = {
  // Métodos de tu servicio de consultas...
};