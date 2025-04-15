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
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  departamentos: any[];
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
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
        try {
          const clienteData = await authService.getClienteInfo();
          setCliente(clienteData.data);
          // Simulamos datos del usuario ya que no tenemos un endpoint específico
          setUser({ id: 1, username: 'usuario', email: clienteData.data.email });
        } catch (error) {
          console.error('Error al verificar autenticación:', error);
          if (typeof window !== 'undefined') localStorage.removeItem('token');
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
      if (typeof window !== 'undefined') localStorage.setItem('token', response.jwt);
      setUser(response.user);
      
      if (response.cliente) {
        setCliente(response.cliente);
      } else {
        const clienteData = await authService.getClienteInfo();
        setCliente(clienteData.data);
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
    if (typeof window !== 'undefined') localStorage.removeItem('token');
    setUser(null);
    setCliente(null);
    router.push('/login');
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