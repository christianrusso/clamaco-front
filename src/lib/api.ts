// Servicio de autenticación mejorado con manejo de errores detallado

export const authService = {
  login: async (identifier: string, password: string) => {
    try {
      console.log('Intentando login con:', identifier);
      
      const response = await fetch('http://localhost:1337/api/auth/local', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier,
          password,
        }),
      });

      // Registramos información sobre la respuesta para depuración
      console.log('Respuesta del servidor:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error en respuesta de login:', errorData);
        throw new Error(errorData.error?.message || 'Error en el inicio de sesión');
      }

      const data = await response.json();
      console.log('Login exitoso, token recibido');
      return data;
    } catch (error) {
      console.error('Error en proceso de login:', error);
      throw error;
    }
  },

  getCurrentUser: async (token) => {
    try {
      console.log('Obteniendo datos del usuario actual');
      
      if (!token) {
        console.error('No se proporcionó token para getCurrentUser');
        throw new Error('Token no proporcionado');
      }
      
      const response = await fetch('http://localhost:1337/api/users/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Registramos información sobre la respuesta para depuración
      console.log('Respuesta del servidor (getCurrentUser):', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        let errorMessage = `Error HTTP ${response.status}`;
        
        try {
          const errorData = await response.json();
          console.error('Error en respuesta getCurrentUser (datos):', errorData);
          errorMessage = errorData.error?.message || errorMessage;
        } catch (e) {
          // Si no podemos parse el JSON, usamos el texto de respuesta
          const errorText = await response.text();
          console.error('Error en respuesta getCurrentUser (texto):', errorText);
        }
        
        throw new Error(`Error al obtener información del usuario: ${errorMessage}`);
      }

      const userData = await response.json();
      console.log('Datos del usuario obtenidos correctamente');
      return userData;
    } catch (error) {
      console.error('Error en getCurrentUser:', error);
      throw error;
    }
  },
};

export const consultasService = {
  createConsulta: async (consultaData) => {
    try {
      const token = localStorage.getItem('jwt');
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('http://localhost:1337/api/consultas', {
        method: 'POST',
        headers,
        body: JSON.stringify(consultaData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Error al crear la consulta');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en createConsulta:', error);
      throw error;
    }
  },
  
  enviarConsulta: async (datos) => {
    return consultasService.createConsulta({ data: datos });
  },
  
  getConsultas: async () => {
    try {
      const token = localStorage.getItem('jwt');
      if (!token) {
        throw new Error('No hay token disponible');
      }
      
      const response = await fetch('http://localhost:1337/api/consultas?populate=*', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener consultas');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error al obtener consultas:', error);
      throw error;
    }
  },
  
  getConsultasPorUsuario: async (userId) => {
    try {
      const token = localStorage.getItem('jwt');
      if (!token) {
        throw new Error('No hay token disponible');
      }
      
      const response = await fetch(`http://localhost:1337/api/consultas?populate=*&filters[user][id][$eq]=${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener consultas del usuario');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error al obtener consultas del usuario:', error);
      throw error;
    }
  },
}

