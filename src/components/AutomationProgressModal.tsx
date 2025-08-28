import React from 'react';
import { ProcessingResult } from '../services/automatedSectionProcessor';

interface AutomationProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: {
    currentSection: number;
    totalSections: number;
    currentSectionName: string;
    questionsGenerated: number;
    categoriesUsed: string[];
    errors: string[];
  } | null;
  result: ProcessingResult | null;
  isCompleted: boolean;
}

export const AutomationProgressModal: React.FC<AutomationProgressModalProps> = ({
  isOpen,
  onClose,
  progress,
  result,
  isCompleted
}) => {
  if (!isOpen) return null;

  const progressPercentage = progress 
    ? Math.round((progress.currentSection / progress.totalSections) * 100)
    : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">
          {isCompleted ? '✅ Automatización Completada' : '🔄 Procesamiento en Curso'}
        </h2>
        
        {progress && !isCompleted && (
          <div className="space-y-4">
            {/* Barra de progreso */}
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progreso General</span>
                <span>{progress.currentSection}/{progress.totalSections} secciones</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <div className="text-center text-sm text-gray-600 mt-1">{progressPercentage}%</div>
            </div>

            {/* Sección actual */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900">Procesando:</h3>
              <p className="text-blue-700">{progress.currentSectionName}</p>
            </div>

            {/* Estadísticas en tiempo real */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{progress.questionsGenerated}</div>
                <div className="text-sm text-green-700">Preguntas Generadas</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{progress.categoriesUsed.length}</div>
                <div className="text-sm text-purple-700">Categorías Usadas</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{progress.errors.length}</div>
                <div className="text-sm text-red-700">Errores</div>
              </div>
            </div>

            {/* Categorías utilizadas */}
            {progress.categoriesUsed.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Categorías Utilizadas:</h4>
                <div className="flex flex-wrap gap-2">
                  {progress.categoriesUsed.map((category, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Errores */}
            {progress.errors.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 text-red-600">Errores Encontrados:</h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {progress.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Resultado final */}
        {result && isCompleted && (
          <div className="space-y-4">
            {/* Resumen final */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{result.processedSections}</div>
                <div className="text-sm text-green-700">Secciones Procesadas</div>
                <div className="text-xs text-gray-500">de {result.totalSections} totales</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{result.totalQuestionsGenerated}</div>
                <div className="text-sm text-blue-700">Preguntas Generadas</div>
                <div className="text-xs text-gray-500">e importadas a Moodle</div>
              </div>
            </div>

            {/* Validación */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Resultados de Validación:</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-green-600">{result.validationResults.totalValid}</div>
                  <div className="text-sm text-gray-600">Válidas</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-red-600">{result.validationResults.totalInvalid}</div>
                  <div className="text-sm text-gray-600">Inválidas</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-600">{result.validationResults.averageScore.toFixed(1)}</div>
                  <div className="text-sm text-gray-600">Puntuación Media</div>
                </div>
              </div>
            </div>

            {/* Categorías utilizadas */}
            <div>
              <h4 className="font-medium mb-2">Categorías de Moodle Utilizadas:</h4>
              <div className="flex flex-wrap gap-2">
                {result.categoriesUsed.map((category, index) => (
                  <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    ✅ {category}
                  </span>
                ))}
              </div>
            </div>

            {/* Errores finales */}
            {result.errors.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 text-red-600">Errores Encontrados ({result.errors.length}):</h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {result.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Botón de cierre */}
        <div className="flex justify-end pt-4">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            {isCompleted ? 'Cerrar' : 'Cancelar'}
          </button>
        </div>
      </div>
    </div>
  );
};