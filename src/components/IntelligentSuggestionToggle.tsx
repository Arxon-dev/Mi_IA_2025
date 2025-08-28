import React from 'react';
import { Brain, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface IntelligentSuggestionToggleProps {
  useIntelligent: boolean;
  onToggle: () => void;
  loading?: boolean;
}

export default function IntelligentSuggestionToggle({ 
  useIntelligent, 
  onToggle, 
  loading = false 
}: IntelligentSuggestionToggleProps) {
  return (
    <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg border">
      <span className="text-xs font-medium text-gray-600">
        Sugerencias:
      </span>
      
      <Button
        variant={!useIntelligent ? "primary" : "outline"}
        size="sm"
        onClick={onToggle}
        disabled={loading}
        className="h-7 px-2 text-xs"
      >
        <Calculator className="w-3 h-3 mr-1" />
        Tradicional
      </Button>
      
      <Button
        variant={useIntelligent ? "primary" : "outline"}
        size="sm"
        onClick={onToggle}
        disabled={loading}
        className="h-7 px-2 text-xs"
      >
        <Brain className="w-3 h-3 mr-1" />
        Inteligente
      </Button>
      
      {useIntelligent && (
        <span className="text-xs text-blue-600 font-medium">
          🧠 Análisis de contenido
        </span>
      )}
    </div>
  );
} 