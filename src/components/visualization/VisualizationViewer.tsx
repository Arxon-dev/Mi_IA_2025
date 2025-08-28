import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Brain, 
  GitBranch, 
  Layers, 
  Loader2,
  Eye,
  RotateCcw
} from 'lucide-react';

interface VisualizationViewerProps {
  documentId: string;
  content: string;
  onVisualizationGenerated?: (data: any) => void;
  className?: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onDownload?: () => void;
}

type VisualizationType = 'concept-map' | 'flowchart' | 'hierarchical-scheme';

interface LocalVisualizationData {
  id: string;
  type: VisualizationType;
  title: string;
  description: string;
  nodes: any[];
  edges: any[];
  stats: {
    nodes: number;
    connections: number;
    complexity: 'simple' | 'medium' | 'complex';
  };
  isGenerated?: boolean;
  error?: string;
}

// Función simplificada para generar datos de ejemplo
const generateSimpleVisualization = (type: VisualizationType): LocalVisualizationData => {
  const baseData = {
    id: `${type}-simple-${Date.now()}`,
    type,
    isGenerated: true,
    nodes: [
      { id: 'node1', label: 'Concepto Central', x: 400, y: 300, size: 50, color: '#2563eb' },
      { id: 'node2', label: 'Concepto A', x: 300, y: 200, size: 35, color: '#059669' },
      { id: 'node3', label: 'Concepto B', x: 500, y: 200, size: 35, color: '#059669' }
    ],
    edges: [
      { id: 'edge1', source: 'node1', target: 'node2', label: 'relaciona' },
      { id: 'edge2', source: 'node1', target: 'node3', label: 'incluye' }
    ],
    stats: {
      nodes: 3,
      connections: 2,
      complexity: 'simple' as const
    }
  };

  switch (type) {
    case 'concept-map':
      return {
        ...baseData,
        title: '🧠 Mapa Conceptual Simple',
        description: 'Mapa conceptual básico generado'
      };
    case 'flowchart':
      return {
        ...baseData,
        title: '📊 Diagrama de Flujo Simple',
        description: 'Diagrama de flujo básico generado'
      };
    case 'hierarchical-scheme':
      return {
        ...baseData,
        title: '📋 Esquema Jerárquico Simple',
        description: 'Esquema jerárquico básico generado'
      };
    default:
      return {
        ...baseData,
        title: 'Visualización',
        description: 'Visualización básica'
      };
  }
};

export default function VisualizationViewer({
  documentId,
  content,
  onVisualizationGenerated,
  className,
  isFullscreen = false,
  onToggleFullscreen,
  onDownload
}: VisualizationViewerProps) {
  const [currentType, setCurrentType] = useState<VisualizationType>('concept-map');
  const [visualizationData, setVisualizationData] = useState<LocalVisualizationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (content && content.length > 0) {
      generateVisualization(currentType);
    }
  }, [content, currentType]);

  const generateVisualization = async (type: VisualizationType) => {
    setIsLoading(true);
    try {
      // Simular procesamiento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const data = generateSimpleVisualization(type);
      setVisualizationData(data);
      
      if (onVisualizationGenerated) {
        onVisualizationGenerated(data);
      }
    } catch (error) {
      console.error('Error generando visualización:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTypeChange = (type: VisualizationType) => {
    setCurrentType(type);
  };

  const getTypeIcon = (type: VisualizationType) => {
    switch (type) {
      case 'concept-map': return Brain;
      case 'flowchart': return GitBranch;
      case 'hierarchical-scheme': return Layers;
      default: return Brain;
    }
  };

  return (
    <Card className={`w-full h-full ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Visualización de Documento
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => generateVisualization(currentType)}
              disabled={isLoading}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Regenerar
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Selector de tipo */}
        <div className="mb-4">
          <div className="flex gap-2">
            {(['concept-map', 'flowchart', 'hierarchical-scheme'] as VisualizationType[]).map((type) => {
              const Icon = getTypeIcon(type);
              return (
                <Button
                  key={type}
                  variant={currentType === type ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleTypeChange(type)}
                  disabled={isLoading}
                >
                  <Icon className="h-4 w-4 mr-1" />
                  {type === 'concept-map' && 'Mapa Conceptual'}
                  {type === 'flowchart' && 'Diagrama de Flujo'}
                  {type === 'hierarchical-scheme' && 'Esquema Jerárquico'}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Área de visualización */}
        <div className="border rounded-lg p-4 min-h-[400px] bg-slate-50 dark:bg-slate-900">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Generando visualización...</p>
              </div>
            </div>
          ) : visualizationData ? (
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">{visualizationData.title}</h3>
              <p className="text-muted-foreground mb-4">{visualizationData.description}</p>
              
              <div className="flex items-center justify-center gap-4 text-sm">
                <Badge variant="outline">
                  {visualizationData.stats.nodes} nodos
                </Badge>
                <Badge variant="outline">
                  {visualizationData.stats.connections} conexiones
                </Badge>
                <Badge variant="outline">
                  {visualizationData.stats.complexity}
                </Badge>
              </div>
              
              <div className="mt-6 p-8 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-muted-foreground">
                  Visualización simplificada generada<br />
                  <small>Nota: Esta es una versión de compatibilidad. 
                  Para mapas conceptuales avanzados, usa: <br />
                  <strong>/visualizations/test</strong></small>
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">
                Introduce contenido para generar visualización
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 