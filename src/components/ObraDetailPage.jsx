'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { obrasService, departamentosService } from '@/lib/api';
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

// Función mejorada para obtener el archivo plano
const getPlanoFile = (deptoData) => {
  // Intentar diferentes caminos para obtener el plano
  const plano = getProperty(deptoData, 'plano');
  
  // Si es null o undefined, probar otras posibles rutas en la estructura de datos
  if (!plano) {
    // Intentar otras posibles rutas donde podría estar el plano
    return getProperty(deptoData, 'attributes.plano') || 
           getProperty(deptoData, 'plano.data') || 
           getProperty(deptoData, 'archivos.plano');
  }
  
  return plano;
};

// Función mejorada para obtener el archivo boleto
const getBoletoFile = (deptoData) => {
  // Intentar diferentes caminos para obtener el boleto
  const boleto = getProperty(deptoData, 'boleto');
  
  // Si es null o undefined, probar otras posibles rutas en la estructura de datos
  if (!boleto) {
    // Intentar otras posibles rutas donde podría estar el boleto
    return getProperty(deptoData, 'attributes.boleto') || 
           getProperty(deptoData, 'boleto.data') || 
           getProperty(deptoData, 'archivos.boleto') ||
           getProperty(deptoData, 'documentos.boleto');
  }
  
  return boleto;
};

export default function ObraDetailPage() {
  const { cliente, user, loading } = useAuth();
  const [obra, setObra] = useState(null);
  const [departamentos, setDepartamentos] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
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
      if (!user || !cliente || !obraDocumentId) {
        console.log('No se puede cargar datos, falta:',
          !user ? 'usuario' : !cliente ? 'cliente' : !obraDocumentId ? 'obraDocumentId' : 'nada');
        return;
      }
      
      console.log('Iniciando carga de datos con:');
      console.log('- Cliente documentId:', cliente.documentId);
      console.log('- ObraDocumentId:', obraDocumentId);
      
      try {
        // 1. Obtenemos la obra específica usando su documentId
        let obraEncontrada = null;
        
        // Intentamos obtener obras con getObrasDetalladas si está disponible
        try {
          if (obrasService.getObrasDetalladas) {
            console.log('Usando método getObrasDetalladas');
            const obrasResponse = await obrasService.getObrasDetalladas();
            obraEncontrada = obrasResponse.data.find(
              (o) => o.documentId === obraDocumentId
            );
          } else {
            console.log('Usando método getObras estándar');
            const obrasResponse = await obrasService.getObras();
            obraEncontrada = obrasResponse.data.find(
              (o) => o.documentId === obraDocumentId
            );
          }
        } catch (error) {
          console.error('Error al obtener obras:', error);
          const obrasResponse = await obrasService.getObras();
          obraEncontrada = obrasResponse.data.find(
            (o) => o.documentId === obraDocumentId
          );
        }
        
        if (!obraEncontrada) {
          console.error('Obra no encontrada con documentId:', obraDocumentId);
          setLoadingData(false);
          return;
        }
        
        setObra(obraEncontrada);
        console.log('Obra encontrada:', obraEncontrada);
        console.log('Obra ID:', obraEncontrada.id);
        console.log('Obra documentId:', obraEncontrada.documentId);
        
        // 2. Obtenemos los departamentos filtrando por documentId
        // Intentamos obtener todos los departamentos con populate
        const deptosResponse = await departamentosService.getDepartamentosDetallados();
        
        // Explorar la estructura completa del primer departamento para depuración
        if (deptosResponse.data && deptosResponse.data.length > 0) {
          console.log('EXPLORACIÓN DETALLADA DE ESTRUCTURA DE DEPARTAMENTO:');
          const primerDepto = deptosResponse.data[0];
          
          // Imprimir estructura completa
          console.log('Estructura completa:', JSON.stringify(primerDepto, null, 2));
          
          // Buscar específicamente dónde están los archivos de plano y boleto
          const buscarEnObjeto = (obj, prefijo = '') => {
            if (!obj || typeof obj !== 'object') return;
            
            Object.keys(obj).forEach(key => {
              const ruta = prefijo ? `${prefijo}.${key}` : key;
              
              // Revisar si este campo podría ser un plano o boleto
              if (
                key === 'plano' || 
                key === 'boleto' || 
                key.includes('archivo') || 
                key.includes('document')
              ) {
                console.log(`Posible archivo encontrado en: ${ruta}`, obj[key]);
              }
              
              // Recursión para objetos anidados
              if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                buscarEnObjeto(obj[key], ruta);
              }
              
              // Revisar también el primer elemento si es un array
              if (Array.isArray(obj[key]) && obj[key].length > 0) {
                console.log(`Array encontrado en: ${ruta}`, obj[key]);
                if (typeof obj[key][0] === 'object') {
                  buscarEnObjeto(obj[key][0], `${ruta}[0]`);
                }
              }
            });
          };
          
          buscarEnObjeto(primerDepto);
        }
        
        console.log('Todos los departamentos:', deptosResponse.data);
        
        // Filtramos manualmente por documentId de obra y cliente
        const clienteDeptosEnObra = deptosResponse.data.filter(depto => {
          // Adaptamos para manejar tanto formato plano como formato Strapi v4
          const deptoData = depto.attributes || depto;
          
          // Accedemos a obra y cliente (que pueden estar anidados)
          let obraObj, clienteObj;
          
          if (depto.attributes) {
            // Formato Strapi v4
            obraObj = getProperty(depto, 'attributes.obra.data.attributes') || getProperty(depto, 'attributes.obra');
            clienteObj = getProperty(depto, 'attributes.cliente.data.attributes') || getProperty(depto, 'attributes.cliente');
          } else {
            // Formato plano
            obraObj = depto.obra;
            clienteObj = depto.cliente;
          }
          
          const obraCoincide = obraObj && (obraObj.documentId === obraEncontrada.documentId);
          const clienteCoincide = clienteObj && (clienteObj.documentId === cliente.documentId);
          
          if (obraCoincide) {
            console.log('Encontrado departamento en esta obra:', getProperty(deptoData, 'nombre') || depto.id);
          }
          
          if (clienteCoincide) {
            console.log('Encontrado departamento de este cliente:', getProperty(deptoData, 'nombre') || depto.id);
          }
          
          return obraCoincide && clienteCoincide;
        });
        
        console.log('Departamentos encontrados por documentId:', clienteDeptosEnObra);
        
        if (clienteDeptosEnObra.length === 0) {
          console.log('No se encontraron departamentos por documentId, intentando con método específico');
          
          // Backup: intentar con el endpoint específico si está disponible
          try {
            if (departamentosService.getDepartamentosPorClienteYObra) {
              // Intentamos con el método específico que usa IDs numéricos
              const deptosEspecificos = await departamentosService.getDepartamentosPorClienteYObra(
                cliente.id, 
                obraEncontrada.id
              );
              
              if (deptosEspecificos.data && deptosEspecificos.data.length > 0) {
                console.log('Departamentos encontrados con método específico:', deptosEspecificos.data);
                setDepartamentos(deptosEspecificos.data);
              } else {
                setDepartamentos([]);
              }
            } else {
              setDepartamentos([]);
            }
          } catch (error) {
            console.error('Error al intentar método específico:', error);
            setDepartamentos([]);
          }
        } else {
          setDepartamentos(clienteDeptosEnObra);
        }
        
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoadingData(false);
      }
    };
    
    fetchData();
    
    // Función de limpieza para el useEffect
    return () => {
      console.log('Limpieza del efecto de carga de obras');
    };
  }, [user, cliente, obraDocumentId]);
  
  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }
  
  if (!user || !obra) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6">
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <p>La obra solicitada no existe o no tienes acceso.</p>
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
  
  // Verificar departamentos para mostrar en la consola
  if (departamentos.length > 0) {
    console.log('DEPARTAMENTOS QUE SE VAN A RENDERIZAR:');
    departamentos.forEach((depto, index) => {
      console.log(`Departamento ${index + 1}:`, depto);
    });
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="flex">
        <Sidebar />
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
                {obra.imagen_principal ? (
                  <img 
                    src={`http://localhost:1337${obra.imagen_principal.url}`} 
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
                
                <div className="mt-6 border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">Descripción</h3>
                  <p className="text-gray-700 leading-relaxed">{obra.descripcion}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Lista de departamentos del cliente en esta obra */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-3">Mis Departamentos en esta Obra</h2>
            
            {departamentos.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-2 text-lg font-medium text-gray-600">No tienes departamentos asociados en esta obra.</p>
                <p className="mt-1 text-gray-500">Cuando adquieras departamentos, aparecerán en este listado.</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:-mx-6">
                <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-100">
                        <tr>
                          <th scope="col" className="py-4 px-4 text-left text-sm font-semibold text-gray-700">Número</th>
                          <th scope="col" className="py-4 px-4 text-right text-sm font-semibold text-gray-700">Precio Total</th>
                          <th scope="col" className="py-4 px-4 text-center text-sm font-semibold text-gray-700">Estado</th>
                          <th scope="col" className="py-4 px-4 text-center text-sm font-semibold text-gray-700">Renders</th>
                          <th scope="col" className="py-4 px-4 text-center text-sm font-semibold text-gray-700">Plano</th>
                          <th scope="col" className="py-4 px-4 text-center text-sm font-semibold text-gray-700">Boleto</th>
                          <th scope="col" className="py-4 px-4 text-center text-sm font-semibold text-gray-700">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {departamentos.map((departamento, index) => {
                          // Manejar tanto formato plano como formato Strapi v4
                          const deptoData = departamento.attributes || departamento;
                          
                          // Obtener valores de forma segura (considerando posible anidación)



                            const id = departamento.id;
                          const numero = getProperty(deptoData, 'numero') || getProperty(deptoData, 'nombre') || `Departamento ${id}`;
                          const precio = getProperty(deptoData, 'precio_total') || getProperty(deptoData, 'precio');
                          const estado = getProperty(deptoData, 'estado');
                          const documentId = getProperty(deptoData, 'documentId');
                          
                          // Obtener archivos relacionados utilizando las funciones mejoradas
                          const renders = getProperty(deptoData, 'renders') || [];
                          const plano = getPlanoFile(deptoData);
                          const boleto = getBoletoFile(deptoData);
                          
                          // Función para obtener colores según el estado
                          const getEstadoStyles = (estado) => {
                            switch(estado) {
                              case 'vendido':
                                return 'bg-green-100 text-green-800 border-green-200';
                              case 'reservado':
                                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                              default:
                                return 'bg-gray-100 text-gray-700 border-gray-200';
                            }
                          };
                          
                          // Componente mejorado para botones de descarga/visualización
                          const DownloadButton = ({ file, label, icon, tipo = 'archivo' }) => {
                            // Si no recibimos archivo, intentamos registrar la información para depuración
                            if (!file) {
                              console.log(`${tipo} no disponible o con formato desconocido`);
                              return (
                                <button disabled className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded border border-gray-300 cursor-not-available">
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                  </svg>
                                  No disponible
                                </button>
                              );
                            }
                            
                            // Intentar obtener la URL de diferentes formas
                            let url = null;
                            
                            // Registrar el archivo para depuración
                            console.log(`Estructura del ${tipo}:`, file);
                            
                            // 1. Comprobar si es un objeto con url directa
                            if (typeof file === 'object' && file !== null) {
                              if (file.url) {
                                url = `http://localhost:1337${file.url}`;
                              } 
                              // 2. Comprobar estructura Strapi v4
                              else if (file.data && file.data.attributes) {
                                url = `http://localhost:1337${file.data.attributes.url}`;
                              }
                              // 3. Comprobar si tiene attributes directamente
                              else if (file.attributes && file.attributes.url) {
                                url = `http://localhost:1337${file.attributes.url}`;
                              }
                              // 4. Si es un array, intentamos con el primer elemento
                              else if (Array.isArray(file) && file.length > 0) {
                                if (file[0].url) {
                                  url = `http://localhost:1337${file[0].url}`;
                                } else if (file[0].data && file[0].data.attributes) {
                                  url = `http://localhost:1337${file[0].data.attributes.url}`;
                                }
                              }
                            }
                            
                            // Si después de todo no tenemos URL, mostramos no disponible
                            if (!url) {
                              console.log(`No se pudo obtener URL para ${tipo}`);
                              return (
                                <button disabled className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded border border-gray-300 cursor-not-available">
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                  </svg>
                                  No disponible
                                </button>
                              );
                            }
                            
                            // Si tenemos URL, mostramos el botón
                            return (
                              <a 
                                href={url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-2 py-1 bg-white text-blue-600 text-xs font-medium rounded border border-blue-300 hover:bg-blue-50 transition-colors"
                              >
                                {icon}
                                {label}
                              </a>
                            );
                          };
                          
                          // Iconos para los botones
                          const downloadIcon = (
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                            </svg>
                          );
                          
                          const viewIcon = (
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                            </svg>
                          );
                          
                          return (
                            <tr key={`${id}-${index}`} className="hover:bg-gray-50 transition-colors">
                              <td className="py-4 px-4 text-sm font-medium text-gray-900">{numero}</td>
                              <td className="py-4 px-4 text-sm text-gray-700 text-right font-medium">
                                {precio ? 
                                  new Intl.NumberFormat('es-AR', { 
                                    style: 'currency', 
                                    currency: 'ARS' 
                                  }).format(precio) : 
                                  'No especificado'
                                }
                              </td>
                              <td className="py-4 px-4 text-center">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getEstadoStyles(estado)}`}>
                                  {estado || 'No especificado'}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-center">
                                <GalleryButton renders={renders} />
                              </td>
                              <td className="py-4 px-4 text-center">
                                <DownloadButton 
                                  file={plano}
                                  label="Ver plano"
                                  icon={viewIcon}
                                  tipo="plano"
                                />
                              </td>
                              <td className="py-4 px-4 text-center">
                                <DownloadButton 
                                  file={boleto}
                                  label="Descargar"
                                  icon={downloadIcon}
                                  tipo="boleto"
                                />
                              </td>
                              <td className="py-4 px-4 text-center">
                                <Link 
                                  href={`/departamentos/${documentId || id}`}
                                  className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                >
                                  Ver detalles
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}