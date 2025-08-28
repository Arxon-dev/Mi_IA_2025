'use client';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Documento no encontrado</h1>
        <p className="text-gray-600 mb-6">El documento que buscas no existe o ha sido eliminado.</p>
        <a 
          href="/documents" 
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Volver a documentos
        </a>
      </div>
    </div>
  );
}