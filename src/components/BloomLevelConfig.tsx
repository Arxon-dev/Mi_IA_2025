'use client';

import { useState, useEffect, useRef } from 'react';
import { BloomLevel, BloomLevelConfig as BloomLevelType, bloomLevels } from '@/services/bloomTaxonomyService';

interface BloomLevelConfigProps {
  onConfigChange: (levels: BloomLevelType[]) => void;
}

export function BloomLevelConfig({ onConfigChange }: BloomLevelConfigProps) {
  const hasInitializedRef = useRef(false);
  const [selectedLevels, setSelectedLevels] = useState<BloomLevelType[]>([]);
  const [error, setError] = useState<string>('');
  const [showDetails, setShowDetails] = useState<boolean>(false);

  // Inicialización una sola vez
  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      
      // Por defecto, seleccionamos los 4 primeros niveles
      const defaultLevels = bloomLevels.slice(0, 4);
      setSelectedLevels(defaultLevels);
      
      // Usar setTimeout para asegurar que este cambio
      // ocurra después de que el componente se monte completamente
      setTimeout(() => {
        onConfigChange(defaultLevels);
      }, 0);
    }
  }, []);

  // Manejar cambios en la selección de niveles
  const handleLevelChange = (level: BloomLevelType, isChecked: boolean) => {
    let newSelection: BloomLevelType[];
    
    if (isChecked) {
      newSelection = [...selectedLevels, level];
    } else {
      newSelection = selectedLevels.filter(l => l.id !== level.id);
    }
    
    setSelectedLevels(newSelection);
    
    // Validar distribución
    const totalPercentage = newSelection.reduce((total, l) => total + l.percentage, 0);
    if (newSelection.length > 0 && (totalPercentage < 95 || totalPercentage > 105)) {
      setError('La distribución de porcentajes debe sumar aproximadamente 100%');
    } else {
      setError('');
      onConfigChange(newSelection);
    }
  };

  // Seleccionar todos los niveles
  const selectAllLevels = () => {
    setSelectedLevels(bloomLevels);
    onConfigChange(bloomLevels);
    setError('');
  };

  // Deseleccionar todos los niveles
  const deselectAllLevels = () => {
    setSelectedLevels([]);
    onConfigChange([]);
    setError('');
  };

  // Calcular el porcentaje total seleccionado
  const totalPercentage = selectedLevels.reduce((total, level) => total + level.percentage, 0);

  return (
    <div className="bg-card p-4 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Niveles Cognitivos (Taxonomía de Bloom)
        </h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          {showDetails ? 'Ocultar detalles' : 'Mostrar detalles'}
        </button>
      </div>

      {showDetails && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
          <p className="font-medium mb-2">¿Qué es la taxonomía de Bloom?</p>
          <p>
            La taxonomía de Bloom es un marco para categorizar objetivos educativos en niveles
            cognitivos de complejidad creciente. Selecciona los niveles que deseas que aparezcan
            en tus preguntas para evaluar diferentes habilidades cognitivas:
          </p>
          <ul className="list-disc list-inside mt-2">
            <li><strong>Recordar (10%):</strong> Reconocer y memorizar información</li>
            <li><strong>Comprender (15%):</strong> Entender e interpretar información</li>
            <li><strong>Aplicar (25%):</strong> Usar el conocimiento en situaciones nuevas</li>
            <li><strong>Analizar (25%):</strong> Examinar y descomponer información</li>
            <li><strong>Evaluar (15%):</strong> Juzgar el valor según criterios</li>
            <li><strong>Crear (10%):</strong> Generar ideas o perspectivas nuevas</li>
          </ul>
        </div>
      )}

      <div className="space-y-2">
        {bloomLevels.map((level) => (
          <div key={level.id} className="flex items-center">
            <input
              type="checkbox"
              id={`bloom-level-${level.id}`}
              checked={selectedLevels.some(l => l.id === level.id)}
              onChange={(e) => handleLevelChange(level, e.target.checked)}
              className="mr-2"
            />
            <label
              htmlFor={`bloom-level-${level.id}`}
              className="flex flex-1 justify-between"
            >
              <span>{level.name}</span>
              <span className="text-gray-500 text-sm">{level.percentage}%</span>
            </label>
          </div>
        ))}

        <div className="flex justify-between items-center mt-4 text-sm">
          <div className="flex gap-2">
            <button
              onClick={selectAllLevels}
              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
            >
              Seleccionar todos
            </button>
            <button
              onClick={deselectAllLevels}
              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
            >
              Deseleccionar todos
            </button>
          </div>
          <div
            className={`font-medium ${
              totalPercentage >= 95 && totalPercentage <= 105
                ? 'text-green-600'
                : 'text-red-600'
            }`}
          >
            Total: {totalPercentage}%
          </div>
        </div>

        {error && (
          <div className="mt-2 text-sm text-red-600">{error}</div>
        )}
      </div>
    </div>
  );
} 