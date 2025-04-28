'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

type Obra = {
  id: number;
  documentId: string;
  nombre: string;
  direccion: string;
  descripcion: string;
  imagen_principal?: {
    url?: string;
    data?: {
      attributes?: {
        url?: string;
      };
    };
  };
};

export default function ObrasPage() {
  const { user, loading } = useAuth();
  const [obras, setObras] = useState<Obra[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user) return;

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/obras?filters[users][id][$eq]=${user.id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('jwt')}`,
          },
        });

        const data = await res.json();
        setObras(data.data || []);
      } catch (error) {
        console.error('Error al obtener obras:', error);
      } finally {
        setLoadingData(false);
      }
    };

    if (user) fetchData();
  }, [user]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#E5E0D5]">
      <Navbar />
      <div className="flex flex-col md:flex-row">
        <div className="hidden md:block md:w-64">

        </div>
        <main className="flex-1 p-6">
          {loading || loadingData ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#E88B29]"></div>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold mb-6 text-[#4B4B27]">Mis Obras</h1>
              {obras.length === 0 ? (
                <div className="bg-white p-6 rounded-lg shadow text-center">
                  <p>No hay obras cargadas todavía.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {obras.map((obra) => {
                    const imageUrl = obra.imagen_principal;

                    return (
                      <div key={obra.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="h-60 bg-gray-100 flex items-center justify-center">
                          {imageUrl ? (
                            <img
                              src={typeof imageUrl === 'string' ? imageUrl : imageUrl?.data?.attributes?.url || ''}
                              alt={obra.nombre}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-gray-400 p-6 text-center">
                              <span className="text-xl mb-2">Sin imagen</span>
                            </div>
                          )}
                        </div>
                        <div className="p-6">
                          <h2 className="text-2xl font-bold text-[#4B4B27] mb-2">{obra.nombre}</h2>
                          <p className="text-gray-600 mb-3">{obra.direccion}</p>
                          <p className="text-gray-500 mb-6 line-clamp-3">
                            {obra.descripcion || 'Sin descripción disponible'}
                          </p>
                          <Link
                            href={`/obras/${obra.documentId}`}
                            className="block w-full text-center bg-[#3366FF] text-white py-3 rounded hover:bg-blue-600 transition-colors"
                          >
                            Ver detalles
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}