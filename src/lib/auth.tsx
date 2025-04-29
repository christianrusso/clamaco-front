'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authService } from './api';

type User = {
  id: number;
  username: string;
  email: string;
  mustChangePassword?: boolean;
};

type Cliente = {
  id: number;
  documentId: string;
  nombre?: string;
  email?: string;
};

// Tipo para los datos de cambio de contraseña
type PasswordChangeData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type AuthContextType = {
  user: User | null;
  cliente: Cliente | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
  updatePassword: (passwordData: PasswordChangeData) => Promise<void>;
  setMustChangePassword: (value: boolean) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Aseguramos que esta exportación sea nombrada y no por defecto
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('jwt') : null;
      
      if (token) {
        try {
          console.log('Verificando autenticación...');
          const userData = await authService.getCurrentUser(token);
          console.log('Datos del usuario obtenidos:', userData);
          setUser(userData);
          
          // Verificar si el usuario debe cambiar su contraseña y NO estamos en la página de cambio de contraseña
          if (userData.mustChangePassword === true && pathname !== '/cambiar-password') {
            console.log('Usuario debe cambiar contraseña y no está en la página correcta');
            router.push('/cambiar-password?obligatorio=true');
            // No retornamos aquí, permitimos que continue para actualizar el estado
          }
          
          // Asumiendo que el cliente está asociado al usuario o viene en la respuesta
          if (userData.cliente) {
            setCliente(userData.cliente);
          } else if (userData.id) {
            // Si no viene el cliente, usamos temporalmente los datos del usuario
            setCliente({
              id: userData.id,
              documentId: `user-${userData.id}`,
              nombre: userData.username,
              email: userData.email
            });
          }
        } catch (error) {
          console.error('Error al verificar autenticación:', error);
          if (typeof window !== 'undefined') localStorage.removeItem('jwt');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [pathname, router]);

  const login = async (identifier: string, password: string) => {
    setLoading(true);
    try {
      const response = await authService.login(identifier, password);
      if (typeof window !== 'undefined') localStorage.setItem('jwt', response.jwt);
      
      // Guardamos los datos del usuario
      setUser(response.user);
      
      // Si la respuesta contiene datos del cliente, los guardamos
      if (response.user.cliente) {
        setCliente(response.user.cliente);
      } else if (response.user.id) {
        // Si no viene el cliente, usamos temporalmente los datos del usuario
        setCliente({
          id: response.user.id,
          documentId: `user-${response.user.id}`,
          nombre: response.user.username,
          email: response.user.email
        });
      }
      
      // Verificar si el usuario debe cambiar su contraseña
      if (response.user.mustChangePassword === true) {
        console.log('Usuario debe cambiar contraseña después de login');
        router.push('/cambiar-password?obligatorio=true');
      } else {
        console.log('Redirigiendo a obras después de login');
        router.push('/obras');
      }
    } catch (error) {
      console.error('Error de login:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // 1. Primero limpiamos los estados en memoria
    setUser(null);
    setCliente(null);
    setLoading(false);
    
    // 2. Luego eliminamos el token del localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('jwt');
      router.push('/login');
    }
  };

  // Función para actualizar el flag mustChangePassword
  const setMustChangePassword = (value: boolean) => {
    if (user) {
      setUser({
        ...user,
        mustChangePassword: value
      });
    }
  };

  // Función para cambiar la contraseña
  const updatePassword = async (passwordData: PasswordChangeData) => {
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    try {
      // Obtener el token del localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem('jwt') : null;
      
      if (!token) {
        throw new Error('No se encontró el token de autenticación');
      }

      // Usar el servicio de autenticación para cambiar la contraseña
      const response = await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        password: passwordData.newPassword,
        passwordConfirmation: passwordData.confirmPassword,
        updateMustChangePassword: user.mustChangePassword
      }, token);
      
      // Si la operación fue exitosa y el usuario tenía el flag activo, lo actualizamos
      if (user.mustChangePassword) {
        setMustChangePassword(false);
      }

      return response;
    } catch (error) {
      console.error('Error al cambiar la contraseña:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      cliente, 
      loading, 
      login, 
      logout, 
      updatePassword,
      setMustChangePassword
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Aseguramos que esta exportación sea nombrada y no por defecto
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}

// No hay exportación por defecto en este archivo