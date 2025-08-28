import React, { useState } from 'react';
import { AutomationConfig } from '../services/automatedSectionProcessor';

interface AutomationConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (config: AutomationConfig) => void;
  isProcessing: boolean;
}

export const AutomationConfigModal: React.FC<AutomationConfigModalProps> = ({
  isOpen,
  onClose,
  onStart,
  isProcessing
}) => {
  const [config, setConfig] = useState<AutomationConfig>({
    targetCategoryPattern: 'L21',
    maxQuestionsPerCategory: 20,
    questionsPerSection: 5,
    useIntelligentMode: true,
    moodleContextId: 18,
    autoAdvanceCategory: true,
    questionTypeCounts: {
      'multiple_choice': 3,
      'true_false': 1,
      'short_answer': 1
    },
    optionLength: 'medium',
    customTitle: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart(config);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">🤖 Configuración de Automatización</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Configuración de Moodle */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Context ID de Moodle</label>
              <input
                type="number"
                value={config.moodleContextId}
                onChange={(e) => setConfig(prev => ({ ...prev, moodleContextId: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Categoría Inicial</label>
              <input
                type="text"
                value={config.targetCategoryPattern}
                onChange={(e) => setConfig(prev => ({ ...prev, targetCategoryPattern: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Ej: L21, P21, B21"
                required
              />
            </div>
          </div>

          {/* Configuración de preguntas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Preguntas por Sección</label>
              <input
                type="number"
                value={config.questionsPerSection}
                onChange={(e) => setConfig(prev => ({ ...prev, questionsPerSection: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border rounded-md"
                min="1"
                max="20"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Máx. Preguntas por Categoría</label>
              <input
                type="number"
                value={config.maxQuestionsPerCategory}
                onChange={(e) => setConfig(prev => ({ ...prev, maxQuestionsPerCategory: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border rounded-md"
                min="10"
                max="100"
                required
              />
            </div>
          </div>

          {/* Configuración avanzada */}
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoAdvance"
                checked={config.autoAdvanceCategory}
                onChange={(e) => setConfig(prev => ({ ...prev, autoAdvanceCategory: e.target.checked }))}
                className="mr-2"
              />
              <label htmlFor="autoAdvance" className="text-sm font-medium">
                Cambio automático de categoría al superar el límite
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="intelligentMode"
                checked={config.useIntelligentMode}
                onChange={(e) => setConfig(prev => ({ ...prev, useIntelligentMode: e.target.checked }))}
                className="mr-2"
              />
              <label htmlFor="intelligentMode" className="text-sm font-medium">
                Usar modo inteligente para generación
              </label>
            </div>
          </div>

          {/* Título personalizado */}
          <div>
            <label className="block text-sm font-medium mb-2">Título Personalizado (Opcional)</label>
            <input
              type="text"
              value={config.customTitle}
              onChange={(e) => setConfig(prev => ({ ...prev, customTitle: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Ej: Examen Tema 21"
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? '🔄 Procesando...' : '🚀 Iniciar Automatización'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};