'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { initializeServices } from '@/services/initServices';
import { AIService } from '@/services/aiService';

// Declaración para TypeScript
declare global {
  interface Window {
    verificarConfiguracionAI?: () => void;
    verificarModelosGoogle?: () => void;
    probarModeloGemini?: (modelId: string) => Promise<string>;
  }
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isInitialized, setIsInitialized] = useState(false);

  // Inicializar servicios solo una vez en el cliente
  useEffect(() => {
    // Verificar que estamos en el navegador
    if (typeof window !== 'undefined' && !isInitialized) {
      try {
        // Inicializar servicios
        initializeServices();
        setIsInitialized(true);
        console.log('✅ Servicios inicializados correctamente');
        
        // Añadir función auxiliar para verificar la configuración desde la consola
        window.verificarConfiguracionAI = async () => {
          console.log('🔍 Ejecutando verificación de configuración de AIService...');
          await AIService.verificarEstadoAPIKey();
        };
        
        console.log('💡 Para verificar la configuración de AI desde la consola, ejecuta: window.verificarConfiguracionAI()');
      } catch (error) {
        console.error('❌ Error al inicializar servicios:', error);
      }
    }
  }, [isInitialized]);
  
  return (
    <>
      <Header />
      <div className="flex h-[calc(100vh-64px)] pt-16">
        <Sidebar />
        <main className="flex-1 p-4">
          {children}
        </main>
      </div>
    </>
  );
} 