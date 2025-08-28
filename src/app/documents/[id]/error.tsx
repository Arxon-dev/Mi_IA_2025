'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error en página de documento:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-red-600">
          Error al cargar el documento
        </h2>
        <p className="text-gray-600">
          Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.
        </p>
        <div className="space-x-4">
          <Button onClick={reset} variant="outline">
            Reintentar
          </Button>
          <Button onClick={() => window.location.href = '/documents'} variant="default">
            Volver a documentos
          </Button>
        </div>
      </div>
    </div>
  );
}