'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { obrasService } from '@/lib/api';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import { GalleryButton } from '@/components/RenderGallery';

// Función auxiliar para acceder de forma segura a propiedades posiblemente anidadas
const getProperty = (obj, path, defaultValue = null) => {
  // Divide la ruta en partes (ejemplo: "attributes.nombre" se convierte en ["attributes", "nombre"])
  const parts = typeof path === 'string' ? path.split('.') : path;
  
  // Si obj es nulo o undefined, devuelve el valor por defecto
  if (obj == null) return defaultValue;
  
  // Si no hay más partes en la ruta, devuelve el objeto
  if (parts.length === 0) return obj;
  
  // Toma la primera parte y el resto
  const [first, ...rest] = parts;
  
  // Si la propiedad existe, continúa con el resto de la ruta
  // Si no, devuelve el valor por defecto
  return getProperty(obj[first], rest, defaultValue);
};

// Mapeo de nombres de campos de la API a nombres amigables para mostrar
const rubroMapping = {
  demolicion: 'Demolición',
  movimientoSuelos: 'Movimiento de suelos',
  hormigonArmado: 'Hormigón armado',
  albanileriaMamposteria: 'Albañilería (Mamposteria)',
  albanileriaContrapisosCarpetas: 'Albañilería (Contrapisos y carpeta)',
  albanileriaRevoquesExteriorInterior: 'Albañilería (Revoques exterior e interior)',
  albanileriaTerminacion: 'Albañilería de terminación',
  carpinteriaExterior: 'Carpintería exterior',
  carpinteriaInterior: 'Carpintería interior',
  electricista: 'Electricista',
  plomeria: 'Plomería',
  yesera: 'Yesería',
  revestimientoExterior: 'Revestimiento exterior',
  pintor: 'Pintura',
  soladosRevestimientos: 'Solados y revestimientos',
  aireAcondicionado: 'Aire acondicionado',
  mueblesCocinaPlacard: 'Muebles de cocina y placard',
  marmoleria: 'Marmolería',
  cortinasEnrollar: 'Cortinas de enrollar',
  ascensores: 'Ascensores',
  hererria: 'Herrería',
  porteros: 'Porteros',
  aislacion: 'Aislación (membrana)',
  parquizacion: 'Parquización',
  mediasombras: 'Mediasombras',
  ajustesPuertasTapas: 'Ajustes de puertas y tapas',
  varios: 'Varios'
};

// Función para extraer rubros de cualquier estructura de datos
function extraerRubros(obraData) {
  const rubrosObra = [];
  
  // Función para buscar rubros recursivamente en un objeto
  function buscarRubrosRecursivo(obj) {
    if (!obj || typeof obj !== 'object') return;
    
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      
      // Si coincide con un rubro y tiene un valor numérico
      if (rubroMapping[key] && (typeof value === 'number' || !isNaN(Number(value)) && value !== '')) {
        const porcentaje = typeof value === 'number' ? value : Number(value);
        console.log(`Rubro encontrado: ${key} => ${rubroMapping[key]} con porcentaje: ${porcentaje}`);
        
        rubrosObra.push({
          nombre: rubroMapping[key],
          porcentaje: porcentaje
        });
      }
      
      // Continuar buscando en propiedades anidadas
      if (value && typeof value === 'object') {
        buscarRubrosRecursivo(value);
      }
    });
  }
  
  buscarRubrosRecursivo(obraData);
  
  // Ordenar por porcentaje de mayor a menor
  rubrosObra.sort((a, b) => b.porcentaje - a.porcentaje);
  
  return rubrosObra;
}

// Función para extraer el avance total de forma segura de cualquier estructura de datos
function obtenerAvanceTotal(obraData) {
  // Primero intentamos obtener directamente
  if (typeof obraData.avanceTotal === 'number') {
    return obraData.avanceTotal;
  }
  
  // Si no está directamente, buscamos en estructuras anidadas
  let avanceTotal = null;
  
  function buscarAvanceTotalRecursivo(obj) {
    if (!obj || typeof obj !== 'object') return;
    
    // Si encontramos el campo avanceTotal, guardamos su valor
    if ('avanceTotal' in obj && (typeof obj.avanceTotal === 'number' || !isNaN(Number(obj.avanceTotal)))) {
      avanceTotal = typeof obj.avanceTotal === 'number' ? obj.avanceTotal : Number(obj.avanceTotal);
      return;
    }
    
    // Buscar en propiedades anidadas
    Object.values(obj).forEach(value => {
      if (value && typeof value === 'object') {
        buscarAvanceTotalRecursivo(value);
      }
    });
  }
  
  buscarAvanceTotalRecursivo(obraData);
  
  // Devolver el avance total encontrado, o 0 si no se encontró
  return avanceTotal !== null ? avanceTotal : 0;
}

// Función para extraer los renders de la obra
function obtenerRenders(obraData) {
  const renders = [];
  
  // Si existe la estructura antigua (colección de renders)
  if (obraData.renders) {
    if (Array.isArray(obraData.renders)) {
      return obraData.renders;
    } else if (obraData.renders?.data) {
      return obraData.renders.data;
    }
  }
  
  // Buscar los campos renders1, renders2, etc.
  for (let i = 1; i <= 5; i++) {
    const renderField = `renders${i}`;
    if (obraData[renderField] && obraData[renderField] !== '') {
      // Si es un string directo (URL), agregarlo como objeto
      if (typeof obraData[renderField] === 'string') {
        renders.push({
          id: i,
          url: obraData[renderField],
          nombre: `Render ${i}`
        });
      } 
      // Si es un objeto con estructura de Strapi
      else if (obraData[renderField]?.data?.attributes?.url) {
        renders.push({
          id: i,
          url: obraData[renderField].data.attributes.url,
          nombre: `Render ${i}`
        });
      }
    }
  }
  
  return renders;
}

export default function ObraDetailPage() {
  const { user, loading } = useAuth();
  const [obra, setObra] = useState(null);
  const [rubrosAvance, setRubrosAvance] = useState([]);
  const [avanceTotal, setAvanceTotal] = useState(0);
  const [renders, setRenders] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const params = useParams();
  const router = useRouter();
  
  const obraDocumentId = params?.obraDocumentId;
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!user || !obraDocumentId) {
        console.log('No se puede cargar datos, falta:',
          !user ? 'usuario' : !obraDocumentId ? 'obraDocumentId' : 'nada');
        setLoadingData(false);
        return;
      }
      
      console.log('Iniciando carga de datos con:');
      console.log('- Usuario ID:', user.id);
      console.log('- ObraDocumentId:', obraDocumentId);
      
      try {
        // Obtenemos la obra específica
        const token = localStorage.getItem('jwt');
        if (!token) {
          throw new Error('Token no disponible');
        }
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/obras?populate=*&filters[users][id][$eq]=${user.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error al obtener obras:', errorText);
          throw new Error('Error al obtener obras');
        }
        
        const obrasData = await response.json();
        console.log('Obras obtenidas:', obrasData);
        
        // Encontrar la obra específica por su documentId
        const obraEncontrada = obrasData.data.find(o => 
          (o.documentId === obraDocumentId) || 
          (o.attributes && o.attributes.documentId === obraDocumentId)
        );
        
        if (!obraEncontrada) {
          console.error('Obra no encontrada con documentId:', obraDocumentId);
          setError('Obra no encontrada');
          setLoadingData(false);
          return;
        }
        
        // Normalizar datos de la obra (manejar tanto formato plano como Strapi v4)
        const obraData = obraEncontrada.attributes || obraEncontrada;
        setObra(obraData);
        
        console.log('Obra encontrada:', obraData);
        
        // Extraer los rubros usando la función robusta
        const rubrosObra = extraerRubros(obraData);
        console.log('Rubros de avance extraídos de la API:', rubrosObra);
        setRubrosAvance(rubrosObra);
        
        // Obtener el avance total desde la API
        const avanceTotalObra = obtenerAvanceTotal(obraData);
        console.log('Avance total de la obra obtenido de la API:', avanceTotalObra);
        setAvanceTotal(avanceTotalObra);
        
        // Obtener los renders de la obra
        const rendersObra = obtenerRenders(obraData);
        console.log('Renders obtenidos de la obra:', rendersObra);
        setRenders(rendersObra);
        
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setError('Error al cargar los datos. Por favor, intenta nuevamente.');
      } finally {
        setLoadingData(false);
      }
    };
    
    fetchData();
  }, [user, obraDocumentId]);
  
  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="flex">
          <main className="flex-1 p-6">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="flex">
          
          <main className="flex-1 p-6">
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <p>Debes iniciar sesión para ver esta página.</p>
              <Link 
                href="/login"
                className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Iniciar sesión
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }
  
  if (error || !obra) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="flex">
          
          <main className="flex-1 p-6">
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <p>{error || 'La obra solicitada no existe o no tienes acceso a ella.'}</p>
              <Link 
                href="/obras"
                className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Volver a Mis Obras
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  
  const imageUrl = obra.imagen_principal;
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="flex">
        
        <main className="flex-1 p-6">
          {/* Botón de volver */}
          <div className="mb-6">
            <Link 
              href="/obras"
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
            >
              <svg className="w-5 h-5 mr-2 -ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
              Volver a Mis Obras
            </Link>
          </div>
          
          {/* Detalles de la obra */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6 border border-gray-200">
            <div className="md:flex">
              <div className="md:w-1/3 h-64 bg-gray-100 flex items-center justify-center">
                {imageUrl ? (
                  <img 
                    src={imageUrl} 
                    alt={obra.nombre}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 22V12h6v10"></path>
                    </svg>
                    <span className="text-sm">Sin imagen</span>
                  </div>
                )}
              </div>
              <div className="md:w-2/3 p-6">
                <h1 className="text-3xl font-bold mb-2 text-gray-800">{obra.nombre}</h1>
                <p className="text-gray-600 mb-4 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  {obra.direccion}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                  <div className="flex items-center">
                    <span className="font-semibold text-gray-700 mr-2">Estado:</span> 
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      obra.estado === 'en curso' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 
                      obra.estado === 'terminada' ? 'bg-green-100 text-green-800 border border-green-200' : 
                      'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}>
                      {obra.estado || 'No especificado'}
                    </span>
                  </div>
                  {obra.fecha_inicio && (
                    <div className="flex items-center">
                      <span className="font-semibold text-gray-700 mr-2">Fecha de inicio:</span> 
                      <span className="text-gray-600">{new Date(obra.fecha_inicio).toLocaleDateString()}</span>
                    </div>
                  )}
                  {obra.fecha_entrega_estimada && (
                    <div className="flex items-center">
                      <span className="font-semibold text-gray-700 mr-2">Fecha est. de entrega:</span> 
                      <span className="text-gray-600">{new Date(obra.fecha_entrega_estimada).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                
                {/* Galería de renders */}

{renders && renders.length > 0 && (
  <div className="mb-4">
    <div className="flex items-center">
      <span className="font-semibold text-gray-700 mr-2">Galería:</span>
      <GalleryButton renders={renders} />
    </div>
  </div>
)}
                
                <div className="mt-6 border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">Descripción</h3>
                  <p className="text-gray-700 leading-relaxed">{obra.descripcion || 'Sin descripción disponible'}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Avance de la obra por rubros */}
          {rubrosAvance.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6 border border-gray-200">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-3">Avance de la Obra</h2>
                
                {/* Porcentaje total de avance (ahora desde Strapi) */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-medium text-gray-700">Avance total de la obra</span>
                    <span className="text-lg font-bold text-gray-800">{avanceTotal}%</span>
                  </div>
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        avanceTotal < 30 ? 'bg-red-500' : 
                        avanceTotal < 70 ? 'bg-yellow-500' : 
                        'bg-green-500'
                      }`}
                      style={{ width: `${avanceTotal}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* Lista de rubros */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {rubrosAvance.map((rubro, index) => (
                    <div key={index} className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">{rubro.nombre}</span>
                        <span className="text-sm font-bold text-gray-800">{rubro.porcentaje}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            rubro.porcentaje < 30 ? 'bg-red-500' : 
                            rubro.porcentaje < 70 ? 'bg-yellow-500' : 
                            'bg-green-500'
                          }`}
                          style={{ width: `${rubro.porcentaje}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Nota */}
                <div className="mt-8 text-sm text-gray-500 border-t border-gray-200 pt-4">
                  <p className="italic">* El avance se actualiza semanalmente según los informes de obra.</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}