'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { obrasService } from '@/lib/api';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import { GalleryButton } from '@/components/RenderGallery';

const getProperty = (obj, path, defaultValue = null) => {
  const parts = typeof path === 'string' ? path.split('.') : path;
  if (obj == null) return defaultValue;
  if (parts.length === 0) return obj;
  const [first, ...rest] = parts;
  return getProperty(obj[first], rest, defaultValue);
};

const rubroMapping = {
  demolicion: 'Demolición',
  movimientoSuelos: 'Movimiento de suelos',
  hormigonArmado: 'Hormigón armado',
  albanileriaMamposteria: 'Albañilería (Mampostería)',
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

// Extraer rubros desde los datos de la obra
function extraerRubros(obraData) {
  const rubrosObra = [];

  function buscarRubrosRecursivo(obj) {
    if (!obj || typeof obj !== 'object') return;

    Object.keys(obj).forEach(key => {
      const value = obj[key];
      if (rubroMapping[key] && (typeof value === 'number' || (!isNaN(Number(value)) && value !== ''))) {
        const porcentaje = typeof value === 'number' ? value : Number(value);
        rubrosObra.push({
          nombre: rubroMapping[key],
          porcentaje: porcentaje
        });
      }

      if (value && typeof value === 'object') {
        buscarRubrosRecursivo(value);
      }
    });
  }

  buscarRubrosRecursivo(obraData);
  rubrosObra.sort((a, b) => b.porcentaje - a.porcentaje);
  return rubrosObra;
}

// Obtener avance total desde cualquier estructura de datos
function obtenerAvanceTotal(obraData) {
  if (typeof obraData.avanceTotal === 'number') {
    return obraData.avanceTotal;
  }

  let avanceTotal = null;

  function buscarAvanceTotalRecursivo(obj) {
    if (!obj || typeof obj !== 'object') return;
    if ('avanceTotal' in obj && (typeof obj.avanceTotal === 'number' || !isNaN(Number(obj.avanceTotal)))) {
      avanceTotal = typeof obj.avanceTotal === 'number' ? obj.avanceTotal : Number(obj.avanceTotal);
      return;
    }
    Object.values(obj).forEach(value => {
      if (value && typeof value === 'object') {
        buscarAvanceTotalRecursivo(value);
      }
    });
  }

  buscarAvanceTotalRecursivo(obraData);
  return avanceTotal !== null ? avanceTotal : 0;
}

// Obtener renders desde múltiples formatos
function obtenerRenders(obraData) {
  const renders = [];

  if (obraData.renders) {
    if (Array.isArray(obraData.renders)) {
      return obraData.renders;
    } else if (obraData.renders?.data) {
      return obraData.renders.data;
    }
  }

  for (let i = 1; i <= 5; i++) {
    const renderField = `renders${i}`;
    if (obraData[renderField] && obraData[renderField] !== '') {
      if (typeof obraData[renderField] === 'string') {
        renders.push({
          id: i,
          url: obraData[renderField],
          nombre: `Render ${i}`
        });
      } else if (obraData[renderField]?.data?.attributes?.url) {
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
  const [isAvanceCollapsed, setIsAvanceCollapsed] = useState(false); // Estado para controlar el colapso
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
        setLoadingData(false);
        return;
      }

      try {
        const token = localStorage.getItem('jwt');
        if (!token) throw new Error('Token no disponible');

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/obras?populate=*&filters[users][id][$eq]=${user.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!response.ok) throw new Error(await response.text());

        const obrasData = await response.json();
        const obraEncontrada = obrasData.data.find(o =>
          (o.documentId === obraDocumentId) || 
          (o.attributes && o.attributes.documentId === obraDocumentId)
        );

        if (!obraEncontrada) {
          setError('Obra no encontrada');
          setLoadingData(false);
          return;
        }

        const obraData = obraEncontrada.attributes || obraEncontrada;
        setObra(obraData);
        setRubrosAvance(extraerRubros(obraData));
        setAvanceTotal(obtenerAvanceTotal(obraData));
        setRenders(obtenerRenders(obraData));
      } catch (error) {
        setError('Error al cargar los datos. Por favor, intenta nuevamente.');
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [user, obraDocumentId]);

  // Función para alternar el estado de colapso
  const toggleAvanceCollapse = () => {
    setIsAvanceCollapsed(!isAvanceCollapsed);
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="p-8 flex justify-center items-center">
          <div className="animate-spin h-10 w-10 border-t-4 border-blue-500 rounded-full"></div>
        </main>
      </div>
    );
  }

  if (!user || error || !obra) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="p-8">
          <div className="bg-white shadow-md rounded-lg p-6 text-center max-w-xl mx-auto">
            <p className="text-gray-700 mb-4">
              {error || 'La obra solicitada no existe o no tenés acceso.'}
            </p>
            <Link href="/obras">
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition" >
                Volver a Mis Obras
              </button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const imageUrl = obra.imagen_principal;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="p-8 max-w-6xl mx-auto">

        {/* Botón de volver */}
        <div className="mb-6">
          <Link href="/obras">
            <button className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-100 transition">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
              Volver a Mis Obras
            </button>
          </Link>
        </div>

        {/* Información de la obra */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
          <div className="md:flex">
            <div className="md:w-1/3 bg-gray-200 h-64 flex items-center justify-center">
              {imageUrl ? (
                <img src={imageUrl} alt={obra.nombre} className="w-full h-full object-cover" />
              ) : (
                <div className="text-gray-400 flex flex-col items-center">
                  <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 22V12h6v10"></path>
                  </svg>
                  <span>Sin imagen</span>
                </div>
              )}
            </div>
            <div className="md:w-2/3 p-6">
              <h1 className="text-3xl font-bold mb-4">{obra.nombre}</h1>
              <p className="flex items-center text-gray-600 mb-4">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                {obra.direccion}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                {obra.fecha_inicio && (
                  <div>
                    <span className="text-gray-700 font-semibold">Inicio:</span> {new Date(obra.fecha_inicio).toLocaleDateString()}
                  </div>
                )}
                {obra.fecha_entrega_estimada && (
                  <div>
                    <span className="text-gray-700 font-semibold">Entrega estimada:</span> {new Date(obra.fecha_entrega_estimada).toLocaleDateString()}
                  </div>
                )}
                {obra.estado && (
                  <div>
                    <span className="text-gray-700 font-semibold">Estado:</span> {obra.estado}
                  </div>
                )}
              </div>

              {renders.length > 0 && (
                <div className="mt-4">
                  <span className="text-gray-700 font-semibold mr-2">Galería:</span>
                  <GalleryButton renders={renders} />
                </div>
              )}

              {obra.descripcion && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Descripción</h3>
                  <p className="text-gray-600">{obra.descripcion}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Avance de la obra con botón de colapsar */}
        {rubrosAvance.length > 0 && (
          <div className="bg-white shadow-md rounded-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-6 cursor-pointer" onClick={toggleAvanceCollapse}>
              <h2 className="text-2xl font-bold text-gray-800">Avance de la Obra</h2>
              <button 
                className="p-2 text-gray-600 hover:text-gray-800 focus:outline-none transition-transform duration-300"
                aria-label={isAvanceCollapsed ? "Expandir sección" : "Colapsar sección"}
              >
                <svg 
                  className={`w-6 h-6 transform ${isAvanceCollapsed ? '' : 'rotate-180'}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
            </div>

            {/* Contenido colapsable */}
            <div className={`transition-all duration-300 overflow-hidden ${isAvanceCollapsed ? 'max-h-0 opacity-0' : 'max-h-full opacity-100'}`}>
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-semibold text-gray-700">Avance Total</span>
                  <span className="text-lg font-bold">{avanceTotal}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      avanceTotal < 30 ? 'bg-red-500' :
                      avanceTotal < 70 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${avanceTotal}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rubrosAvance.map((rubro, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-700">{rubro.nombre}</span>
                      <span className="text-sm font-semibold">{rubro.porcentaje}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          rubro.porcentaje < 30 ? 'bg-red-400' :
                          rubro.porcentaje < 70 ? 'bg-yellow-400' :
                          'bg-green-400'
                        }`}
                        style={{ width: `${rubro.porcentaje}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 text-sm text-gray-400 text-center italic">
                * El avance se actualiza semanalmente.
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}