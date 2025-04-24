'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { consultasService } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { UserIcon, IdentificationIcon, PencilIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

export default function ContactPage() {
  const { user, cliente, loading } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: '',
    asunto: '',
    mensaje: '',
    tipoConsulta: 'general',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({
    success: false,
    error: false,
    message: '',
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (cliente) {
      setFormData((prev) => ({
        ...prev,
        email: user.email || user?.username || ''
      }));
    }
  }, [user, loading, router, cliente]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.asunto || !formData.mensaje) {
      setSubmitStatus({
        success: false,
        error: true,
        message: 'Por favor complete todos los campos requeridos.',
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ success: false, error: false, message: '' });

    try {
      // Preparamos los datos para enviar a Strapi
      const consultaData = {
        data: {
          asunto: formData.asunto,
          mensaje: formData.mensaje,
          tipoConsulta: formData.tipoConsulta,
          // Conectamos con el usuario y cliente
          email: user.email,
        },
      };

      console.log('Enviando consulta:', consultaData);
      
      // Utilizamos el método createConsulta del servicio
      const response = await consultasService.createConsulta(consultaData);
      console.log('Respuesta del servidor:', response);
      
      setSubmitStatus({
        success: true,
        error: false,
        message: 'Consulta enviada correctamente. Pronto nos comunicaremos.',
      });

      // Limpiamos el formulario manteniendo el nombre
      setFormData({
        email: cliente?.email || user?.username || '',
        asunto: '',
        mensaje: '',
        tipoConsulta: 'general',
      });
    } catch (error) {
      console.error('Error al enviar consulta:', error);
      
      setSubmitStatus({
        success: false,
        error: true,
        message: `Error al enviar la consulta: ${error.message || 'Intente nuevamente.'}`,
      });
    } finally {
      setIsSubmitting(false);
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
            <h1 className="text-2xl font-bold mb-6 text-[#3D341E]">Contacto</h1>

            <div className="bg-white rounded-xl border border-[#e2d3c3] shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-[#D9862A] text-white">
                <h2 className="text-xl font-semibold">Contáctanos</h2>
                <p className="text-sm">Completá el formulario y te responderemos pronto.</p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {submitStatus.success && (
                  <div className="bg-green-50 border-l-4 border-green-400 p-4 text-green-700 rounded">
                    {submitStatus.message}
                  </div>
                )}
                {submitStatus.error && (
                  <div className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700 rounded">
                    {submitStatus.message}
                  </div>
                )}

                <InputWithIcon
                  icon={<UserIcon className="h-5 w-5 text-[#3D341E]" />}
                  value={formData.email}
                  name="email"
                  label="Email"
                  onChange={handleChange}
                />

                

                <InputWithIcon
                  icon={<EnvelopeIcon className="h-5 w-5 text-[#3D341E]" />}
                  value={formData.asunto}
                  name="asunto"
                  label="Asunto"
                  onChange={handleChange}
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-[#3D341E] mb-1">Mensaje</label>
                  <textarea
                    name="mensaje"
                    value={formData.mensaje}
                    onChange={handleChange}
                    rows="5"
                    className="w-full px-4 py-2 border border-[#d6c3b1] rounded-md focus:ring focus:ring-[#D9862A] focus:border-[#D9862A]"
                    required
                    disabled={isSubmitting}
                  ></textarea>
                </div>

                <div className="pt-4 text-center">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#3D341E] text-white px-6 py-2 rounded-md hover:bg-[#2f2816] transition"
                  >
                    {isSubmitting ? 'Enviando...' : 'Enviar Consulta'}
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

// COMPONENTES AUXILIARES
function InputWithIcon({ icon, label, name, value, onChange, required = false, disabled = false }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#3D341E] mb-1">{label}</label>
      <div className="flex items-center border border-[#d6c3b1] rounded-md px-3 py-2 bg-white">
        <div className="mr-2">{icon}</div>
        <input
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className="w-full focus:outline-none text-[#3D341E] bg-transparent"
        />
      </div>
    </div>
  );
}

