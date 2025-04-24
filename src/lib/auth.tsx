'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from './api';

type User = {
  id: number;
  username: string;
  email: string;
};

type Cliente = {
  id: number;
  documentId: string;
  nombre?: string;
  email?: string;
};

type AuthContextType = {
  user: User | null;
  cliente: Cliente | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('jwt') : null;
      
      if (token) {
        try {
          const userData = await authService.getCurrentUser(token);
          setUser(userData);
          
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
  }, []);

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
      
      router.push('/obras');
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
      
      // 3. Redirección directa usando window.location para una redirección completa
      // (esto provocará una recarga completa de la página, reiniciando todo el estado)
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, cliente, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}