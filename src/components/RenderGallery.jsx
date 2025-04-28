'use client';

import { useState } from 'react';

// Componente de Modal para la galería
const RenderGalleryModal = ({ renders, isOpen, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  if (!isOpen || !renders || renders.length === 0) return null;
  
  // Función actualizada para construir URL de archivo
  const getFileUrl = (file) => {
    if (!file) return null;
    
    // Si es un string directo (nueva estructura), usarlo directamente
    if (typeof file === 'string') return file;
    
    // Si es un objeto con url directa
    if (file.url) return `${file.url}`;
    
    // Si es un objeto con estructura de Strapi
    if (file.data && file.data.attributes && file.data.attributes.url) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '');
      return `${baseUrl}${file.data.attributes.url}`;
    }
    
    return null;
  };
  
  const currentRender = renders[currentIndex];
  const currentUrl = getFileUrl(currentRender);
  
  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? renders.length - 1 : prevIndex - 1));
  };
  
  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex === renders.length - 1 ? 0 : prevIndex + 1));
  };
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen p-4 text-center sm:p-0">
        {/* Overlay de fondo */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        {/* Contenido del modal */}
        <div className="relative inline-block w-full max-w-4xl p-4 bg-white rounded-lg shadow-xl transform transition-all">
          <div className="absolute top-0 right-0 p-2">
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="p-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Render {currentIndex + 1} de {renders.length}
            </h3>
            
            <div className="relative overflow-hidden h-96 bg-gray-100 flex items-center justify-center rounded-lg">
              {currentUrl ? (
                <img 
                  src={currentUrl} 
                  alt={`Render ${currentIndex + 1}`}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="text-gray-500">Imagen no disponible</div>
              )}
              
              {/* Botón anterior */}
              <button 
                onClick={goToPrevious}
                className="absolute left-2 p-2 rounded-full bg-white bg-opacity-75 text-gray-800 hover:bg-opacity-90 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              {/* Botón siguiente */}
              <button 
                onClick={goToNext}
                className="absolute right-2 p-2 rounded-full bg-white bg-opacity-75 text-gray-800 hover:bg-opacity-90 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            <div className="flex justify-center mt-4 space-x-2">
              {renders.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2.5 w-2.5 rounded-full ${idx === currentIndex ? 'bg-blue-600' : 'bg-gray-300'}`}
                  aria-label={`Ver render ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modificación del componente GalleryButton para los renders
const GalleryButton = ({ renders }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  if (!renders || renders.length === 0) return (
    <button disabled className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded border border-gray-300 cursor-not-available">
      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
      No disponible
    </button>
  );
  
  const rendersCount = renders.length > 0 ? (
    <span className="ml-1 inline-flex items-center justify-center w-4 h-4 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full">
      {renders.length}
    </span>
  ) : null;
  
  return (
    <>
      <button 
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center px-2 py-1 bg-white text-blue-600 text-xs font-medium rounded border border-blue-300 hover:bg-blue-50 transition-colors"
      >
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
        </svg>
        Ver galería{rendersCount}
      </button>
      
      <RenderGalleryModal 
        renders={renders}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export { GalleryButton, RenderGalleryModal };