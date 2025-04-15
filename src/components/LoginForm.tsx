'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/lib/auth';
import Image from 'next/image';
import Link from 'next/link';

type LoginFormData = {
  email: string;
  password: string;
};

export default function LoginForm() {
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginFormData>();
  
  // Cargar usuario recordado al iniciar
  useEffect(() => {
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
      setValue('email', rememberedUser);
      setRememberMe(true);
    }
  }, [setValue]);
  
  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError('');
    
    try {
      await login(data.email, data.password);
      
      // Si rememberMe está activado, guardar credenciales
      if (rememberMe) {
        localStorage.setItem('rememberedUser', data.email);
      } else {
        localStorage.removeItem('rememberedUser');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRememberMe = () => {
    setRememberMe(!rememberMe);
  };
  
  return (
    <div className="min-h-screen bg-[#E88B29] flex flex-col items-center justify-center w-full">
      <div className="w-full max-w-full px-4 sm:px-6 md:max-w-4xl lg:max-w-5xl xl:max-w-6xl">
        {/* Logo y contenido superior */}
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-2">
            <Image 
              src="/images/logo.png"
              alt="Logo Clamaco"
              width={120}
              height={120}
              className="mb-2"
            />
          </div>
          <h1 className="text-4xl font-bold text-white">Clamaco®</h1>
          
          
        </div>
        
        {/* Formulario de login */}
        <div className="w-full mx-auto max-w-lg">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded mb-5">
                <p>{error}</p>
              </div>
            )}
            
            <div>
              <input
                type="text"
                placeholder="Usuario"
                className="w-full px-4 py-3 rounded-md bg-white border-0 focus:outline-none focus:ring-2 focus:ring-[#333333]"
                disabled={isLoading}
                {...register('email', { required: 'El email es requerido' })}
              />
              {errors.email && (
                <p className="mt-1 text-white text-sm">{errors.email.message}</p>
              )}
            </div>
            
            <div>
              <input
                type="password"
                placeholder="Contraseña"
                className="w-full px-4 py-3 rounded-md bg-white border-0 focus:outline-none focus:ring-2 focus:ring-[#333333]"
                disabled={isLoading}
                {...register('password', { required: 'La contraseña es requerida' })}
              />
              {errors.password && (
                <p className="mt-1 text-white text-sm">{errors.password.message}</p>
              )}
            </div>
            
            
            
            <div className="pt-3">
              <button
                type="submit"
                className="w-full px-4 py-3 text-white font-medium bg-[#333333] rounded-md hover:bg-[#444444] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#333333] transition duration-200"
                disabled={isLoading}
              >
                {isLoading ? 'Ingresando...' : 'Ingresar'}
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
}