'use client';

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { LockClosedIcon, ShieldCheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface FormularioPassword {
  passwordActual: string;
  passwordNuevo: string;
  confirmarPassword: string;
}

interface EstadoEnvio {
  exito: boolean;
  error: boolean;
  mensaje: string;
}

export default function CambiarPasswordPage() {
  const { user, loading, updatePassword } = useAuth();
  const router = useRouter();

  const [formulario, setFormulario] = useState<FormularioPassword>({
    passwordActual: '',
    passwordNuevo: '',
    confirmarPassword: '',
  });

  const [enviando, setEnviando] = useState<boolean>(false);
  const [estadoEnvio, setEstadoEnvio] = useState<EstadoEnvio>({
    exito: false,
    error: false,
    mensaje: '',
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const manejarCambio = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormulario({
      ...formulario,
      [name]: value,
    });
  };

  const manejarEnvio = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validación
    if (!formulario.passwordActual || !formulario.passwordNuevo || !formulario.confirmarPassword) {
      setEstadoEnvio({
        exito: false,
        error: true,
        mensaje: 'Por favor complete todos los campos requeridos.',
      });
      return;
    }

    if (formulario.passwordNuevo !== formulario.confirmarPassword) {
      setEstadoEnvio({
        exito: false,
        error: true,
        mensaje: 'Las contraseñas nuevas no coinciden.',
      });
      return;
    }

    if (formulario.passwordNuevo.length < 8) {
      setEstadoEnvio({
        exito: false,
        error: true,
        mensaje: 'La nueva contraseña debe tener al menos 8 caracteres.',
      });
      return;
    }

    setEnviando(true);
    setEstadoEnvio({ exito: false, error: false, mensaje: '' });

    try {
      // Preparamos los datos para enviar a Strapi
      const datosPassword = {
        currentPassword: formulario.passwordActual,
        newPassword: formulario.passwordNuevo,
        confirmPassword: formulario.confirmarPassword,
      };

      console.log('Enviando solicitud de cambio de contraseña');
      
      // Llamamos al método de cambio de contraseña desde el contexto de auth
      await updatePassword(datosPassword);
      
      setEstadoEnvio({
        exito: true,
        error: false,
        mensaje: 'Contraseña actualizada correctamente.',
      });

      // Limpiamos el formulario
      setFormulario({
        passwordActual: '',
        passwordNuevo: '',
        confirmarPassword: '',
      });
    } catch (error: any) {
      console.error('Error al cambiar la contraseña:', error);
      
      setEstadoEnvio({
        exito: false,
        error: true,
        mensaje: `Error al cambiar la contraseña: ${error.message || 'Intente nuevamente.'}`,
      });
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdf8f1] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D9862A]"></div>
      </div>
    );
  }
  
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#fdf8f1]">
      <Navbar />
      <div className="flex flex-col md:flex-row">
        <main className="flex-1 p-6">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-[#3D341E]">Cambiar Contraseña</h1>

            <div className="bg-white rounded-xl border border-[#e2d3c3] shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-[#D9862A] text-white">
                <h2 className="text-xl font-semibold">Cambio de Contraseña</h2>
                <p className="text-sm">Complete el formulario para actualizar su contraseña.</p>
              </div>

              <form onSubmit={manejarEnvio} className="p-6 space-y-4">
                {estadoEnvio.exito && (
                  <div className="bg-green-50 border-l-4 border-green-400 p-4 text-green-700 rounded">
                    {estadoEnvio.mensaje}
                  </div>
                )}
                {estadoEnvio.error && (
                  <div className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700 rounded">
                    {estadoEnvio.mensaje}
                  </div>
                )}

                <InputConIcono
                  icono={<LockClosedIcon className="h-5 w-5 text-[#3D341E]" />}
                  valor={formulario.passwordActual}
                  nombre="passwordActual"
                  tipo="password"
                  etiqueta="Contraseña Actual"
                  onChange={manejarCambio}
                  requerido={true}
                  deshabilitado={enviando}
                />

                <InputConIcono
                  icono={<ShieldCheckIcon className="h-5 w-5 text-[#3D341E]" />}
                  valor={formulario.passwordNuevo}
                  nombre="passwordNuevo"
                  tipo="password"
                  etiqueta="Nueva Contraseña"
                  onChange={manejarCambio}
                  requerido={true}
                  deshabilitado={enviando}
                />

                <InputConIcono
                  icono={<ArrowPathIcon className="h-5 w-5 text-[#3D341E]" />}
                  valor={formulario.confirmarPassword}
                  nombre="confirmarPassword"
                  tipo="password"
                  etiqueta="Confirmar Nueva Contraseña"
                  onChange={manejarCambio}
                  requerido={true}
                  deshabilitado={enviando}
                />

                <div className="pt-4 text-center">
                  <button
                    type="submit"
                    disabled={enviando}
                    className="bg-[#3D341E] text-white px-6 py-2 rounded-md hover:bg-[#2f2816] transition"
                  >
                    {enviando ? 'Actualizando...' : 'Actualizar Contraseña'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// COMPONENTE AUXILIAR
interface PropiedadesInput {
  icono: React.ReactNode;
  etiqueta: string;
  nombre: string;
  tipo?: string;
  valor: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  requerido?: boolean;
  deshabilitado?: boolean;
}

function InputConIcono({ 
  icono, 
  etiqueta, 
  nombre, 
  tipo = "text", 
  valor, 
  onChange, 
  requerido = false, 
  deshabilitado = false 
}: PropiedadesInput) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#3D341E] mb-1">{etiqueta}</label>
      <div className="flex items-center border border-[#d6c3b1] rounded-md px-3 py-2 bg-white">
        <div className="mr-2">{icono}</div>
        <input
          type={tipo}
          name={nombre}
          value={valor}
          onChange={onChange}
          required={requerido}
          disabled={deshabilitado}
          className="w-full focus:outline-none text-[#3D341E] bg-transparent"
        />
      </div>
    </div>
  );
}