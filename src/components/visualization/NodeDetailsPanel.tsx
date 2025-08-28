import React from 'react';
import { cn } from '@/lib/utils';

interface Node {
  id: string;
  label: string;
  x?: number;
  y?: number;
  type?: string;
  confidence?: number;
  context?: any;
}

interface NodeDetailsPanelProps {
  node: (Node & { x: number; y: number }) | undefined;
  onClose: () => void;
}

/**
 * 📋 Panel de Detalles de Nodo - OpositIA
 * Muestra información contextual completa de un nodo seleccionado
 */
export default function NodeDetailsPanel({ 
  node, 
  onClose 
}: NodeDetailsPanelProps) {
  if (!node) return null;

  // Extraer información contextual del nodo (si existe)
  const context = (node as any).context || {};
  const {
    description = '',
    functions = [],
    dependencies = [],
    responsibilities = [],
    normativeFramework = [],
    organizationalLevel = '',
    hierarchicalPosition = '',
    legalBasis = [],
    applications = [],
    steps = [],
    requirements = []
  } = context;

  return (
    <div className="absolute top-4 right-4 w-96 max-h-[80vh] bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-2xl overflow-hidden">
      <style jsx>{`
        .panel-slide {
          animation: slideIn 0.3s ease-out;
        }
        
        @keyframes slideIn {
          0% { transform: translateX(100%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/10 to-primary/5 panel-slide">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary"></div>
          <h3 className="font-semibold text-lg">{node.label}</h3>
        </div>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-muted rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Contenido scrolleable */}
      <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)] space-y-4">
        
        {/* Información básica */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium">Tipo:</span>
            <span className="px-2 py-1 bg-muted rounded text-xs font-medium">
              {node.type || 'Concepto'}
            </span>
          </div>
          
          {(node as any).category && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium">Categoría:</span>
              <span className="px-2 py-1 bg-accent/20 rounded text-xs">
                {(node as any).category}
              </span>
            </div>
          )}

          {organizationalLevel && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium">Nivel:</span>
              <span className="px-2 py-1 bg-success/20 rounded text-xs">
                {organizationalLevel}
              </span>
            </div>
          )}
        </div>

        {/* Descripción */}
        {description && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              📝 Descripción
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed p-3 bg-muted/30 rounded-lg">
              {description}
            </p>
          </div>
        )}

        {/* Funciones */}
        {functions.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              ⚙️ Funciones Principales
            </h4>
            <div className="space-y-1">
              {functions.map((func: string, index: number) => (
                <div key={index} className="text-sm p-2 bg-primary/5 rounded border-l-2 border-primary/20">
                  {func}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Responsabilidades */}
        {responsibilities.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              🎯 Responsabilidades
            </h4>
            <div className="space-y-1">
              {responsibilities.map((resp: string, index: number) => (
                <div key={index} className="text-sm p-2 bg-warning/5 rounded border-l-2 border-warning/20">
                  {resp}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dependencias organizacionales */}
        {dependencies.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              🏢 Dependencias
            </h4>
            <div className="space-y-1">
              {dependencies.map((dep: string, index: number) => (
                <div key={index} className="text-sm p-2 bg-success/5 rounded border-l-2 border-success/20">
                  {dep}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Marco normativo */}
        {normativeFramework.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              ⚖️ Marco Normativo
            </h4>
            <div className="space-y-1">
              {normativeFramework.map((norm: string, index: number) => (
                <div key={index} className="text-sm p-2 bg-accent/5 rounded border-l-2 border-accent/20">
                  {norm}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Base legal */}
        {legalBasis.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              📚 Base Legal
            </h4>
            <div className="space-y-1">
              {legalBasis.map((basis: string, index: number) => (
                <div key={index} className="text-sm p-2 bg-blue-50 dark:bg-blue-950/20 rounded border-l-2 border-blue-200 dark:border-blue-800">
                  {basis}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Aplicaciones */}
        {applications.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              🎯 Aplicaciones
            </h4>
            <div className="space-y-1">
              {applications.map((app: string, index: number) => (
                <div key={index} className="text-sm p-2 bg-green-50 dark:bg-green-950/20 rounded border-l-2 border-green-200 dark:border-green-800">
                  {app}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pasos del proceso */}
        {steps.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              📋 Pasos del Proceso
            </h4>
            <div className="space-y-1">
              {steps.map((step: string, index: number) => (
                <div key={index} className="text-sm p-2 bg-purple-50 dark:bg-purple-950/20 rounded border-l-2 border-purple-200 dark:border-purple-800 flex items-start gap-2">
                  <span className="font-medium text-purple-600 dark:text-purple-400 min-w-[20px]">{index + 1}.</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Requisitos */}
        {requirements.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              ✅ Requisitos
            </h4>
            <div className="space-y-1">
              {requirements.map((req: string, index: number) => (
                <div key={index} className="text-sm p-2 bg-orange-50 dark:bg-orange-950/20 rounded border-l-2 border-orange-200 dark:border-orange-800">
                  {req}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Posición jerárquica */}
        {hierarchicalPosition && hierarchicalPosition !== 'No especificado' && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              🏗️ Posición Jerárquica
            </h4>
            <div className="text-sm p-3 bg-muted/30 rounded-lg border border-muted-foreground/10">
              {hierarchicalPosition}
            </div>
          </div>
        )}

        {/* Información de confianza */}
        <div className="pt-3 border-t border-muted-foreground/10">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Confianza:</span>
            <div className="flex-1 bg-muted rounded-full h-2">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${(node.confidence || 0.8) * 100}%` }}
              ></div>
            </div>
            <span>{Math.round((node.confidence || 0.8) * 100)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
} 