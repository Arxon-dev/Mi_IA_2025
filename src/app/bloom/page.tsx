'use client';

import React, { useState, useEffect } from 'react';
import { Info, Save, RotateCcw, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import type { BloomLevel } from '@prisma/client';
import { StorageService } from '@/services/storageService';

// Eliminar los mensajes de depuración
// console.log('StorageService disponible:', !!StorageService);
// console.log('Métodos:', Object.keys(StorageService));
// console.log('getBloomLevelConfig existe:', !!StorageService.getBloomLevelConfig);
// console.log('saveBloomLevelConfig existe:', !!StorageService.saveBloomLevelConfig);

export default function BloomPage() {
  const [levels, setLevels] = useState<BloomLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadBloomLevels() {
      try {
        setLoading(true);
        const storedLevels = await StorageService.getBloomLevelConfig();
        
        if (storedLevels && storedLevels.length > 0) {
          setLevels(storedLevels);
        } else {
          // Configuración por defecto
          setLevels([
            {
              id: 'remember',
              name: 'Recordar',
              description: 'Reconocer y recordar información relevante de la memoria a largo plazo.',
              keywords: ['Definir', 'Recordar', 'Listar', 'Reconocer', 'Identificar', 'Recuperar'],
              percentage: 20,
              enabled: true,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 'understand',
              name: 'Comprender',
              description: 'Construir significado a partir de mensajes orales, escritos y gráficos.',
              keywords: ['Interpretar', 'Ejemplificar', 'Clasificar', 'Resumir', 'Comparar', 'Explicar'],
              percentage: 25,
              enabled: true,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 'apply',
              name: 'Aplicar',
              description: 'Llevar a cabo o utilizar un procedimiento en una situación determinada.',
              keywords: ['Ejecutar', 'Implementar', 'Usar', 'Desempeñar', 'Resolver', 'Aplicar'],
              percentage: 25,
              enabled: true,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 'analyze',
              name: 'Analizar',
              description: 'Descomponer el material en sus partes y detectar cómo se relacionan entre ellas.',
              keywords: ['Diferenciar', 'Organizar', 'Atribuir', 'Comparar', 'Delinear', 'Estructurar'],
              percentage: 15,
              enabled: true,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 'evaluate',
              name: 'Evaluar',
              description: 'Hacer juicios basados en criterios y estándares.',
              keywords: ['Revisar', 'Criticar', 'Juzgar', 'Experimentar', 'Probar', 'Detectar'],
              percentage: 10,
              enabled: true,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              id: 'create',
              name: 'Crear',
              description: 'Juntar elementos para formar un todo coherente y funcional.',
              keywords: ['Generar', 'Planear', 'Producir', 'Diseñar', 'Construir', 'Elaborar'],
              percentage: 5,
              enabled: true,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ]);
        }
      } catch (err) {
        console.error('Error al cargar niveles Bloom:', err);
        setError('Error al cargar la configuración de niveles Bloom');
      } finally {
        setLoading(false);
      }
    }

    loadBloomLevels();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Validar que los porcentajes sumen 100%
      const totalPercentage = levels.reduce((sum, level) => sum + level.percentage, 0);
      if (totalPercentage !== 100) {
        setError('Los porcentajes deben sumar 100%');
        return;
      }

      // Guardar configuración
      await StorageService.saveBloomLevelConfig(levels);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error al guardar niveles Bloom:', err);
      setError('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setLevels(levels.map(level => ({
      ...level,
      percentage: Math.floor(100 / levels.length),
      enabled: true
    })));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-card shadow-lg rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Configuración de Niveles Bloom</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleReset}
                className="flex items-center btn-secondary"
                disabled={saving}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Restablecer
              </button>
              <button
                onClick={handleSave}
                className="flex items-center btn-primary"
                disabled={saving}
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              Configuración guardada correctamente
            </div>
          )}

          <div className="space-y-6">
            {levels.map((level, index) => (
              <div key={level.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{level.name}</h3>
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={level.percentage}
                      onChange={(e) => {
                        const newLevels = [...levels];
                        newLevels[index] = {
                          ...level,
                          percentage: parseInt(e.target.value) || 0
                        };
                        setLevels(newLevels);
                      }}
                      className="w-20 px-2 py-1 border rounded mr-4"
                      min="0"
                      max="100"
                    />
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={level.enabled}
                        onChange={(e) => {
                          const newLevels = [...levels];
                          newLevels[index] = {
                            ...level,
                            enabled: e.target.checked
                          };
                          setLevels(newLevels);
                        }}
                        className="mr-2"
                      />
                      Activo
                    </label>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">{level.description}</p>
                <div className="flex flex-wrap gap-2">
                  {level.keywords.map((keyword, kidx) => (
                    <span
                      key={kidx}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 