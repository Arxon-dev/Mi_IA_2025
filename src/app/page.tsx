'use client';

import { useState, useEffect } from 'react';
import { AIService } from '@/services/aiService';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [selectedModelName, setSelectedModelName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAI = async () => {
      try {
        setIsLoading(true);
        await AIService.initialize();
        
        // Obtener el modelo desde el servicio
        const model = AIService.getSelectedModel();
        
        if (model) {
          setSelectedModel(model.id);
          setSelectedModelName(model.name); // Guardamos también el nombre descriptivo
        } else {
          // Si no hay modelo, intentar obtenerlo de la configuración
          const config = await AIService.getConfig();
          if (config && config.model) {
            setSelectedModel(config.model);
            // Intentar encontrar el nombre del modelo
            const allModels = await fetch('/api/ai-models').then(res => res.json()).catch(() => []);
            const modelDetails = allModels.find((m: any) => m.id === config.model);
            setSelectedModelName(modelDetails?.name || config.model);
          }
        }
        
        setError(null);
      } catch (error) {
        console.error('Error al inicializar:', error);
        setError(`Error al inicializar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAI();
  }, []);

  return (
    <Dashboard 
      isLoading={isLoading} 
      error={error} 
      selectedModel={selectedModelName || selectedModel} // Preferimos mostrar el nombre descriptivo
    />
  );
} 