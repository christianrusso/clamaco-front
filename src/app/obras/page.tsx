'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { obrasService, departamentosService } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';

// Tipo para una obra
type Obra = {
  id: number;
  documentId: string;
  nombre: string;
  direccion: string;
  descripcion: string;
  imagen_principal?: {
    url: string;
    data?: {
      attributes?: {
        url: string;
      }
    }
  };
  // otros campos...
};

export default function ObrasPage() {
  const { cliente, user, loading } = useAuth();
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
      if (!user || !cliente) return;
      
      console.log('Cliente:', cliente);
      if (cliente.obras) {
        console.log('Obras del cliente:', cliente.obras);
      }
      
      try {
        const clienteResponse = await fetch('http://localhost:1337/api/clientes/me');
        const clienteData = await clienteResponse.json();
        console.log('Cliente desde API directa:', clienteData);
      } catch (error) {
        console.error('Error al obtener cliente desde API directa:', error);
      }
      
      try {
        // Usamos el método mejorado si está disponible
        let obrasResponse;
        try {
          if (obrasService.getObrasDetalladas) {
            console.log('Usando método getObrasDetalladas');
            obrasResponse = await obrasService.getObrasDetalladas();
          } else {
            console.log('Usando método getObras estándar');
            obrasResponse = await obrasService.getObras();
          }
        } catch (error) {
          console.error('Error al obtener obras detalladas:', error);
          obrasResponse = await obrasService.getObras();
        }
        
        const allObras = obrasResponse.data;
        console.log('Todas las obras obtenidas:', allObras);
        
        // Verificamos la estructura de la primera obra para depuración
        if (allObras && allObras.length > 0) {
          console.log('Estructura de la primera obra:', JSON.stringify(allObras[0], null, 2));
        }
        
        // 1. Intentamos obtener obras directamente desde el cliente
        if (cliente.obras && cliente.obras.length > 0) {
          const clienteObrasDocIds = cliente.obras.map((obra) => obra.documentId);
          const clienteObras = allObras.filter((obra) => clienteObrasDocIds.includes(obra.documentId));
          
          if (clienteObras.length === 0) {
            console.log('No se encontraron coincidencias por documentId, probando con id regular');
            const clienteObrasIds = cliente.obras.map((obra) => obra.id);
            const clienteObrasFallback = allObras.filter((obra) => clienteObrasIds.includes(obra.id));
            setObras(clienteObrasFallback);
          } else {
            setObras(clienteObras);
          }
        } 
        // 2. Si no hay obras directamente en el cliente, intentamos a través de departamentos
        else {
          const deptoResponse = await departamentosService.getDepartamentos();
          const clienteDepartamentos = deptoResponse.data.filter(
            (depto) => depto.cliente?.id === cliente?.id
          );
          
          const obrasDocIds = [...new Set(clienteDepartamentos
            .filter(depto => depto.obra)
            .map((depto) => depto.obra?.documentId))];
          
          const clienteObras = allObras.filter((obra) => obrasDocIds.includes(obra.documentId));
          
          if (clienteObras.length === 0) {
            console.log('No se encontraron coincidencias por documentId en departamentos, probando con id regular');
            const obrasIds = [...new Set(clienteDepartamentos
              .filter(depto => depto.obra)
              .map((depto) => depto.obra?.id))];
            const clienteObrasFallback = allObras.filter((obra) => obrasIds.includes(obra.id));
            setObras(clienteObrasFallback);
          } else {
            setObras(clienteObras);
          }
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoadingData(false);
      }
    };
    
    fetchData();
    
    return () => {
      console.log('Limpieza del efecto de carga de obras');
    };
  }, [user, cliente]);
  
  // Función auxiliar para obtener la URL de la imagen
  const getImageUrl = (obra: Obra) => {
    if (!obra.imagen_principal) return null;
    
    // Intentar diferentes estructuras de datos para la imagen
    if (obra.imagen_principal.url) {
      return `http://localhost:1337${obra.imagen_principal.url}`;
    }
    
    if (obra.imagen_principal.data && obra.imagen_principal.data.attributes && obra.imagen_principal.data.attributes.url) {
      return `http://localhost:1337${obra.imagen_principal.data.attributes.url}`;
    }
    
    // Si llegamos aquí, no pudimos encontrar una URL válida
    console.log('No se pudo obtener URL de imagen para obra:', obra.nombre);
    return null;
  };
  
  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-[#E5E0D5]">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#E88B29]"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-[#E5E0D5]">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <h1 className="text-2xl font-bold mb-6 text-[#4B4B27]">Mis Obras</h1>
          
          {obras.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <p>No tienes obras asociadas a tu cuenta.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {obras.map((obra) => {
                const imageUrl = getImageUrl(obra);
                
                return (
                  <div key={obra.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="h-60 bg-gray-100 flex items-center justify-center">
                      {imageUrl ? (
                        <img 
                          src={imageUrl}
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
        </main>
      </div>
    </div>
  );
}