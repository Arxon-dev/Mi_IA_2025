'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function DocumentViewPage() {
  const searchParams = useSearchParams();
  const documentId = searchParams.get('id');
  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (documentId) {
      // Simulación de carga de documento
      const loadDocument = async () => {
        try {
          // Simulación de delay
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const doc = {
            id: documentId,
            title: `Documento ${documentId}`,
            content: 'Contenido del documento'
          };
          
          setDocument(doc);
        } catch (error) {
          console.error('Error loading document:', error);
        } finally {
          setLoading(false);
        }
      };

      loadDocument();
    } else {
      setLoading(false);
    }
  }, [documentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!documentId || !document) {
    return (
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <Link href="/documents" className="text-blue-500 hover:underline flex items-center">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Volver a documentos
          </Link>
        </div>
        <h1 className="text-2xl font-bold mb-4">Documento no encontrado</h1>
        <p>El documento solicitado no existe o no se proporcionó un ID válido.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/documents" className="text-blue-500 hover:underline flex items-center">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Volver a documentos
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">{document.title}</h1>
          <div className="prose max-w-none">
            <p>ID: {document.id}</p>
            <p>{document.content}</p>
          </div>
        </div>
      </div>
    </div>
  );
}