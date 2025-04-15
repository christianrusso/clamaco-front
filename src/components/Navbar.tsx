'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
  const { user, cliente } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    // Eliminar token y redirigir a login
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <div className="bg-[#E88B29] shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Image 
            src="/images/logo.png"
            alt="Logo Clamaco"
            width={40}
            height={40}
            className="mr-3"
          />
          <h1 className="text-white text-xl font-bold">Portal de Clientes</h1>
        </div>
        
        {user && (
          <div className="flex items-center text-white">
            <span className="mr-4">Bienvenido, {cliente?.nombre}</span>
            <button 
              className="bg-white text-[#E88B29] px-4 py-1 rounded-md hover:bg-gray-100 transition-colors"
              onClick={handleLogout}
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </div>
  );
}