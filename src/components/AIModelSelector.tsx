'use client';

interface AIModelSelectorProps {
  onModelSelect: (model: string) => void;
}

const AI_MODELS = [
  {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    description: 'Modelo avanzado de Anthropic con capacidades de comprensión y generación de texto.'
  },
  {
    id: 'deepseek',
    name: 'Deepseek',
    description: 'Modelo especializado en procesamiento de lenguaje natural.'
  },
  {
    id: 'gemini',
    name: 'Google (Gemini)',
    description: 'Modelo de última generación de Google con capacidades multimodales.'
  },
  {
    id: 'grok',
    name: 'xAI (Grok)',
    description: 'Modelo conversacional avanzado de xAI.'
  },
  {
    id: 'qwen',
    name: 'Alibaba (Qwen)',
    description: 'Modelo de lenguaje de Alibaba optimizado para múltiples tareas.'
  },
  {
    id: 'gpt',
    name: 'OpenAI (GPT)',
    description: 'Modelo GPT de OpenAI con capacidades avanzadas de generación de texto.'
  }
];

export function AIModelSelector({ onModelSelect }: AIModelSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {AI_MODELS.map((model) => (
          <div
            key={model.id}
            className="border rounded-lg p-4 hover:border-blue-500 cursor-pointer transition-colors"
            onClick={() => onModelSelect(model.id)}
          >
            <h3 className="font-medium text-gray-900">{model.name}</h3>
            <p className="mt-1 text-sm text-gray-500">{model.description}</p>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-900">Configuración Adicional</h4>
        <div className="mt-2 space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-600">
              Incluir retroalimentación detallada
            </span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-600">
              Generar reglas mnemotécnicas
            </span>
          </label>
        </div>
      </div>
    </div>
  );
} 