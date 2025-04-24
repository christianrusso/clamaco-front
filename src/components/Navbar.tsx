// src/components/Navbar.tsx o .jsx

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="bg-[#E88B29] w-full shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-white">
                Clamaco
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {user && (
                <>
                  <Link 
                    href="/obras" 
                    className="border-transparent text-white hover:border-white hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Mis Obras
                  </Link>
                  <Link 
                    href="/contacto" 
                    className="border-transparent text-white hover:border-white hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Contacto
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-white">¡Hola, {user.username}!</span>
                <button
                  onClick={handleLogout}
                  className="border border-white rounded-md px-3 py-1 text-sm text-white hover:bg-[#d97d24] transition-colors"
                >
                  Cerrar Sesión
                </button>
              </div>
            ) : (
              <div className="space-x-4">
                <Link 
                  href="/login" 
                  className="text-white hover:text-gray-100 font-medium"
                >
                  Iniciar Sesión
                </Link>
              </div>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-gray-100 hover:bg-[#d97d24] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              aria-expanded="false"
            >
              <span className="sr-only">Abrir menú principal</span>
              {/* Icono de menú */}
              <svg 
                className={`${mobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`} 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              {/* Icono X para cerrar */}
              <svg 
                className={`${mobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`} 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Menú móvil */}
      <div className={`${mobileMenuOpen ? 'block' : 'hidden'} sm:hidden bg-[#E88B29]`}>
        <div className="pt-2 pb-3 space-y-1">
          {user && (
            <>
              <Link 
                href="/obras" 
                className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-white hover:bg-[#d97d24] hover:border-white"
              >
                Mis Obras
              </Link>
              <Link 
                href="/contacto" 
                className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-white hover:bg-[#d97d24] hover:border-white"
              >
                Contacto
              </Link>
            </>
          )}
        </div>
        <div className="pt-4 pb-3 border-t border-[#d97d24]">
          {user ? (
            <div className="space-y-1">
              <div className="px-4 py-2">
                <p className="text-sm font-medium text-white">¡Hola, {user.username}!</p>
              </div>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-base font-medium text-white hover:bg-[#d97d24] transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          ) : (
            <div className="px-4 py-2">
              <Link 
                href="/login" 
                className="block text-base font-medium text-white hover:text-gray-100"
              >
                Iniciar Sesión
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;