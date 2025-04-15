'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { consultasService } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

import UserIcon from '@heroicons/react/24/outline/UserIcon';
import IdentificationIcon from '@heroicons/react/24/outline/IdentificationIcon';
import PencilIcon from '@heroicons/react/24/outline/PencilIcon';
import EnvelopeIcon from '@heroicons/react/24/outline/EnvelopeIcon';



export default function ContactPage() {
  const { user, cliente, loading } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    nombre: '',
    dni: '',
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
        nombre: cliente.nombre || '',
        dni: cliente.dni || '',
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
      const consultaData = {
        data: {
          asunto: formData.asunto,
          mensaje: formData.mensaje,
          tipo: formData.tipoConsulta,
          cliente: cliente.id,
          estado: 'pendiente',
        },
      };

      await consultasService.createConsulta(consultaData);
      setSubmitStatus({
        success: true,
        error: false,
        message: 'Consulta enviada correctamente. Pronto nos comunicaremos.',
      });

      setFormData({
        nombre: cliente?.nombre || '',
        dni: cliente?.dni || '',
        asunto: '',
        mensaje: '',
        tipoConsulta: 'general',
      });
    } catch (error) {
      setSubmitStatus({
        success: false,
        error: true,
        message: 'Error al enviar la consulta. Intente nuevamente.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return null;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#fdf8f1]">
      <Navbar />
      <div className="flex">
        <Sidebar />
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
                  value={formData.nombre}
                  name="nombre"
                  label="Nombre"
                  onChange={handleChange}
                  disabled
                />

                <InputWithIcon
                  icon={<IdentificationIcon className="h-5 w-5 text-[#3D341E]" />}
                  value={formData.dni}
                  name="dni"
                  label="DNI"
                  onChange={handleChange}
                  disabled
                />

                <SelectWithIcon
                
                  icon={<PencilIcon className="h-5 w-5 text-[#3D341E]" />}
                  name="tipoConsulta"
                  value={formData.tipoConsulta}
                  onChange={handleChange}
                  options={[
                    { value: 'general', label: 'Consulta General' },
                    { value: 'obra', label: 'Consulta sobre Obra' },
                    { value: 'departamento', label: 'Consulta sobre Departamento' },
                    { value: 'facturacion', label: 'Facturación' },
                    { value: 'postventa', label: 'Post-Venta' },
                  ]}
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

function SelectWithIcon({ icon, name, value, onChange, options }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#3D341E] mb-1">Motivo</label>
      <div className="flex items-center border border-[#d6c3b1] rounded-md px-3 py-2 bg-white">
        <div className="mr-2">{icon}</div>
        <select
          name={name}
          value={value}
          onChange={onChange}
          className="w-full focus:outline-none text-[#3D341E] bg-transparent"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
