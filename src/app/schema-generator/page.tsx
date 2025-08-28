import { Metadata } from 'next';
import AISchemaGenerator from '@/components/ai-schema-generator';

export const metadata: Metadata = {
  title: 'Generador de Esquemas con IA | NeuroOpositor',
  description: 'Convierte texto en esquemas visuales inteligentes usando IA. Crea mapas mentales, diagramas jerárquicos, líneas de tiempo y diagramas de flujo automáticamente.',
  keywords: 'esquemas, IA, mapas mentales, diagramas, visualización, estudio, oposiciones',
};

export default function SchemaGeneratorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Generador de Esquemas con IA
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Transforma tu texto en esquemas visuales inteligentes. Utiliza el poder de la IA para crear 
            mapas mentales, diagramas jerárquicos, líneas de tiempo y diagramas de flujo que optimizan 
            tu proceso de estudio.
          </p>
        </div>
        
        <AISchemaGenerator />
        
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-2xl mb-3">🧠</div>
            <h3 className="font-semibold text-gray-900 mb-2">Mapas Mentales</h3>
            <p className="text-gray-600 text-sm">
              Organiza ideas de forma radial para una mejor comprensión y memorización.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-2xl mb-3">📊</div>
            <h3 className="font-semibold text-gray-900 mb-2">Esquemas Jerárquicos</h3>
            <p className="text-gray-600 text-sm">
              Estructura la información en niveles para un aprendizaje progresivo.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-2xl mb-3">⏱️</div>
            <h3 className="font-semibold text-gray-900 mb-2">Líneas de Tiempo</h3>
            <p className="text-gray-600 text-sm">
              Visualiza procesos y eventos cronológicos de manera clara.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-2xl mb-3">🔄</div>
            <h3 className="font-semibold text-gray-900 mb-2">Diagramas de Flujo</h3>
            <p className="text-gray-600 text-sm">
              Representa procesos y decisiones de forma lógica y secuencial.
            </p>
          </div>
        </div>
        
        <div className="mt-12 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">¿Cómo funciona?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Ingresa tu texto</h3>
              <p className="text-gray-600 text-sm">
                Escribe o pega el contenido que quieres convertir en esquema. Puede ser cualquier tipo de texto educativo.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">La IA lo mejora</h3>
              <p className="text-gray-600 text-sm">
                Nuestro sistema de IA analiza el contenido y lo optimiza para crear un esquema más efectivo y comprensible.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Descarga tu esquema</h3>
              <p className="text-gray-600 text-sm">
                Obtén tu esquema visual optimizado listo para usar en tus estudios. Disponible en formato PNG.
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-md p-8 text-white">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Potenciado por IA Avanzada</h2>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Utilizamos modelos de IA de última generación para analizar tu contenido y crear esquemas 
              optimizados que mejoran la comprensión y retención de información.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}