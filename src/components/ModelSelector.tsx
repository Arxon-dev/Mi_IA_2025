import React from 'react';
import { ChevronDown, Bot, Zap } from 'lucide-react';
import { AIModel } from '@/types/ai';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface ModelSelectorProps {
  models: AIModel[];
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
  showModelDetails?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModel,
  onModelChange,
  label = 'Modelo de IA',
  description,
  disabled = false,
  className,
  showModelDetails = true,
}) => {
  const selectedModelDetails = models.find(m => m.id === selectedModel);

  return (
    <div className={cn("space-y-2", className)}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
        </label>
      )}

      {/* Select Container */}
      <div className="relative">
        <select
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value)}
          disabled={disabled}
          className={cn(
            "w-full px-3 py-2 pr-10 bg-background border border-border rounded-lg text-foreground",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted",
            "appearance-none transition-colors duration-200",
            "hover:border-border-hover"
          )}
        >
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
        
        {/* Custom Dropdown Arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDown className={cn(
            "w-4 h-4 text-muted-foreground",
            disabled && "opacity-50"
          )} />
        </div>
      </div>

      {/* Description */}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      {/* Model Details */}
      {showModelDetails && selectedModelDetails && (
        <div className="p-3 bg-muted/50 rounded-lg border border-border space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                {selectedModelDetails.name}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Badge variant="secondary" className="text-xs">
                {selectedModelDetails.provider}
              </Badge>
              {selectedModelDetails.config.maxTokens && (
                <Badge variant="outline" className="text-xs">
                  {selectedModelDetails.config.maxTokens.toLocaleString()} tokens
                </Badge>
              )}
            </div>
          </div>
          
          {selectedModelDetails.description && (
            <p className="text-xs text-muted-foreground">
              {selectedModelDetails.description}
            </p>
          )}
          
          {/* Model Configuration */}
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            {selectedModelDetails.config.temperature !== undefined && (
              <div className="flex items-center space-x-1">
                <Zap className="w-3 h-3" />
                <span>Temp: {selectedModelDetails.config.temperature}</span>
              </div>
            )}
            {selectedModelDetails.config.maxTokens && (
              <div className="flex items-center space-x-1">
                <span>Max: {selectedModelDetails.config.maxTokens.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 