import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Info, Zap, Maximize2, Minimize2, Download } from 'lucide-react';

// Interfaces
interface ConceptMapNode {
  id: string;
  label: string;
  level: 'central' | 'primary' | 'secondary' | 'detail';
  x: number;
  y: number;
  size: number;
  color: string;
}

interface ConceptMapEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

interface ConceptMapData {
  nodes: ConceptMapNode[];
  edges: ConceptMapEdge[];
  metadata: {
    totalNodes: number;
    totalConnections: number;
    complexity: 'simple' | 'medium' | 'complex';
    generatedWithAI: boolean;
    processingTime?: number;
  };
}

interface ConceptMapRendererProps {
  data: ConceptMapData;
  width?: number;
  height?: number;
  onNodeClick?: (node: ConceptMapNode) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  layoutType?: 'circular' | 'tree';
  className?: string;
}

function ConceptMapRenderer({
  data,
  width = 1200,
  height = 900,
  onNodeClick,
  isFullscreen = false,
  onToggleFullscreen,
  layoutType = 'circular',
  className = ''
}: ConceptMapRendererProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [showLegend, setShowLegend] = useState(true);

  // Función para calcular el tamaño necesario del nodo basado en el texto
  const calculateNodeSize = (text: string, level: 'central' | 'primary' | 'secondary' | 'detail') => {
    // Configuración base por nivel
    const levelConfig = {
      central: { minSize: 100, fontSize: 16, padding: 20, fontWeight: 'bold' },
      primary: { minSize: 80, fontSize: 14, padding: 16, fontWeight: 'bold' },
      secondary: { minSize: 60, fontSize: 12, padding: 12, fontWeight: 'medium' },
      detail: { minSize: 45, fontSize: 10, padding: 8, fontWeight: 'medium' }
    };
    
    const config = levelConfig[level];
    
    // Calcular dimensiones del texto
    // Aproximación: caracteres promedio × factor de ancho de fuente
    const charWidth = config.fontSize * 0.6; // Factor aproximado para fuentes sans-serif
    const lineHeight = config.fontSize * 1.2;
    
    // Dividir texto en líneas óptimas
    const maxCharsPerLine = level === 'central' ? 12 : level === 'primary' ? 10 : 8;
    const lines = splitTextIntoLines(text, maxCharsPerLine, 2);
    
    // Calcular ancho necesario (línea más larga)
    const maxLineLength = Math.max(...lines.map(line => line.length));
    const textWidth = maxLineLength * charWidth;
    
    // Calcular alto necesario
    const textHeight = lines.length * lineHeight;
    
    // Determinar tamaño del círculo (el mayor entre ancho y alto + padding)
    const requiredSize = Math.max(textWidth, textHeight) + config.padding;
    
    // Asegurar tamaño mínimo por nivel
    const finalSize = Math.max(requiredSize, config.minSize);
    
    return {
      size: finalSize,
      fontSize: config.fontSize,
      fontWeight: config.fontWeight,
      lines: lines
    };
  };

  // Función para dividir texto en múltiples líneas
  const splitTextIntoLines = (text: string, maxCharsPerLine: number, maxLines: number = 2) => {
    if (text.length <= maxCharsPerLine) return [text];
    
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      if (lines.length >= maxLines) break;
      
      if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
        currentLine = currentLine ? currentLine + ' ' + word : word;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // Palabra muy larga, truncar
          lines.push(word.substring(0, maxCharsPerLine - 3) + '...');
          break;
        }
      }
    }
    
    if (currentLine && lines.length < maxLines) {
      lines.push(currentLine);
    }
    
    return lines;
  };

  // Función para truncar texto inteligentemente
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    const words = text.split(' ');
    let result = '';
    for (const word of words) {
      if ((result + word).length > maxLength) break;
      result += (result ? ' ' : '') + word;
    }
    return result + '...';
  };

  // Mejorar el algoritmo de posicionamiento
  const calculatePositions = useCallback(() => {
    if (!data?.nodes) return;

    const centerX = width / 2;
    const centerY = height / 2;
    
    // Agrupar nodos por nivel
    const nodesByLevel = {
      central: data.nodes.filter(n => n.level === 'central'),
      primary: data.nodes.filter(n => n.level === 'primary'),
      secondary: data.nodes.filter(n => n.level === 'secondary'),
      detail: data.nodes.filter(n => n.level === 'detail')
    };

    // Calcular tamaños dinámicos para todos los nodos
    const nodeMetrics = new Map();
    
    Object.entries(nodesByLevel).forEach(([level, nodes]) => {
      nodes.forEach(node => {
        const metrics = calculateNodeSize(node.label, level as any);
        nodeMetrics.set(node.id, metrics);
        
        // Actualizar el nodo con el tamaño calculado
        node.size = metrics.size;
        
        // Definir colores por nivel
        const levelColors = {
          central: '#2563eb',
          primary: '#059669',
          secondary: '#dc2626',
          detail: '#7c3aed'
        };
        node.color = levelColors[level as keyof typeof levelColors];
      });
    });

    // Configuración de radios ajustada dinámicamente
    const getRadiusForLevel = (level: string, nodeCount: number, avgSize: number) => {
      const baseRadii = {
        central: 0,
        primary: 180,
        secondary: 320,
        detail: 460
      };
      
      // Ajustar radio basado en tamaño promedio de nodos y cantidad
      const spacing = avgSize * 1.5; // Espaciado proporcional al tamaño
      const adjustment = Math.max(0, (nodeCount - 3) * 20); // Más espacio si hay más nodos
      
      return baseRadii[level as keyof typeof baseRadii] + adjustment;
    };

    // Posicionar nodos
    Object.entries(nodesByLevel).forEach(([level, nodes]) => {
      if (level === 'central' && nodes.length > 0) {
        // Nodo central en el centro
        nodes[0].x = centerX;
        nodes[0].y = centerY;
      } else if (nodes.length > 0) {
        // Calcular tamaño promedio para este nivel
        const avgSize = nodes.reduce((sum, node) => sum + node.size, 0) / nodes.length;
        const radius = getRadiusForLevel(level, nodes.length, avgSize);
        
        // Distribuir nodos evitando superposiciones
        const angleStep = (2 * Math.PI) / Math.max(nodes.length, 4);
        
        nodes.forEach((node, index) => {
          const metrics = nodeMetrics.get(node.id);
          
          // Calcular ángulo con offset para evitar alineación perfecta
          const baseAngle = index * angleStep;
          const offset = (level === 'secondary' ? Math.PI / 8 : level === 'detail' ? Math.PI / 6 : 0);
          const angle = baseAngle + offset;
          
          // Añadir variación al radio para evitar círculos perfectos
          const radiusVariation = radius + (Math.random() - 0.5) * (avgSize * 0.8);
          
          // Calcular posición
          node.x = centerX + radiusVariation * Math.cos(angle);
          node.y = centerY + radiusVariation * Math.sin(angle);
          
          // Verificar y corregir superposiciones
          let attempts = 0;
          while (attempts < 10) {
            const hasOverlap = data.nodes.some(otherNode => {
              if (otherNode.id === node.id || !otherNode.x || !otherNode.y) return false;
              
              const dx = node.x - otherNode.x;
              const dy = node.y - otherNode.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              const minDistance = (node.size + otherNode.size) / 2 + 20; // 20px de margen
              
              return distance < minDistance;
            });
            
            if (!hasOverlap) break;
            
            // Ajustar posición si hay superposición
            const newAngle = angle + (attempts * Math.PI / 12);
            const newRadius = radiusVariation + (attempts * 30);
            
            node.x = centerX + newRadius * Math.cos(newAngle);
            node.y = centerY + newRadius * Math.sin(newAngle);
            
            attempts++;
          }
        });
      }
    });
  }, [data, width, height]);

  // Simplificar conexiones para evitar sobrecarga visual
  const getSimplifiedEdges = () => {
    if (!data?.edges) return [];
    
    // Limitar conexiones para evitar caos visual
    const maxConnections = Math.min(data.edges.length, data.nodes.length * 1.5);
    
    // Priorizar conexiones desde el nodo central
    const sortedEdges = [...data.edges].sort((a, b) => {
      const aFromCentral = data.nodes.find(n => n.id === a.source)?.level === 'central' ? 1 : 0;
      const bFromCentral = data.nodes.find(n => n.id === b.source)?.level === 'central' ? 1 : 0;
      return bFromCentral - aFromCentral;
    });
    
    return sortedEdges.slice(0, maxConnections);
  };

  useEffect(() => {
    calculatePositions();
  }, [calculatePositions]);

  const getNodeById = (id: string) => data?.nodes.find(n => n.id === id);

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(selectedNode === nodeId ? null : nodeId);
    const node = getNodeById(nodeId);
    if (node && onNodeClick) {
      onNodeClick(node);
    }
  };

  // Componente de marcador de flecha mejorado
  const ArrowMarker = () => (
    <defs>
      <marker
        id="arrowhead"
        markerWidth="10"
        markerHeight="7"
        refX="9"
        refY="3.5"
        orient="auto"
        fill="#6b7280"
      >
        <polygon points="0 0, 10 3.5, 0 7" />
      </marker>
    </defs>
  );

  // Renderizar conexiones simplificadas
  const renderEdges = () => {
    const edges = getSimplifiedEdges();
    
    return edges.map(edge => {
      const sourceNode = getNodeById(edge.source);
      const targetNode = getNodeById(edge.target);
      
      if (!sourceNode || !targetNode) return null;

      // Calcular puntos de conexión en el borde de los círculos
      const dx = targetNode.x - sourceNode.x;
      const dy = targetNode.y - sourceNode.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance === 0) return null;
      
      const sourceRadius = sourceNode.size / 2;
      const targetRadius = targetNode.size / 2;
      
      const startX = sourceNode.x + (dx / distance) * sourceRadius;
      const startY = sourceNode.y + (dy / distance) * sourceRadius;
      const endX = targetNode.x - (dx / distance) * targetRadius;
      const endY = targetNode.y - (dy / distance) * targetRadius;

      return (
        <g key={edge.id}>
          <line
            x1={startX}
            y1={startY}
            x2={endX}
            y2={endY}
            stroke="#6b7280"
            strokeWidth="2"
            markerEnd="url(#arrowhead)"
            opacity="0.7"
            className="transition-opacity duration-200"
          />
        </g>
      );
    });
  };

  // Renderizar nodos con texto mejorado
  const renderNodes = () => {
    return data?.nodes.map(node => {
      const isSelected = selectedNode === node.id;
      const isHovered = hoveredNode === node.id;
      const nodeOpacity = isSelected || isHovered ? 1 : 0.9;
      const strokeWidth = isSelected ? 4 : isHovered ? 3 : 2;
      
      // Calcular métricas dinámicas del nodo
      const nodeMetrics = calculateNodeSize(node.label, node.level);
      const { fontSize, fontWeight, lines } = nodeMetrics;

      return (
        <g
          key={node.id}
          className="cursor-pointer transition-all duration-200"
          onClick={() => handleNodeClick(node.id)}
          onMouseEnter={() => setHoveredNode(node.id)}
          onMouseLeave={() => setHoveredNode(null)}
        >
          {/* Sombra */}
          <circle
            cx={node.x + 4}
            cy={node.y + 4}
            r={node.size / 2}
            fill="rgba(0,0,0,0.2)"
            className="pointer-events-none"
          />
          
          {/* Nodo principal */}
          <circle
            cx={node.x}
            cy={node.y}
            r={node.size / 2}
            fill={node.color}
            stroke={isSelected ? '#1d4ed8' : 'white'}
            strokeWidth={strokeWidth}
            opacity={nodeOpacity}
            className="transition-all duration-200"
          />
          
          {/* Texto del nodo con múltiples líneas usando métricas calculadas */}
          {lines.map((line, lineIndex) => {
            const lineOffset = lines.length === 1 ? 0 : 
                              lineIndex === 0 ? -fontSize/2 : fontSize/2;
            
            return (
              <text
                key={lineIndex}
                x={node.x}
                y={node.y + lineOffset}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={fontSize}
                fill="white"
                fontWeight={fontWeight}
                className="pointer-events-none select-none"
                style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.7)' }}
              >
                {line}
              </text>
            );
          })}
          
          {/* Tooltip solo si el texto original fue truncado */}
          {isHovered && lines.join(' ') !== node.label && (
            <g>
              <rect
                x={node.x - Math.max(node.label.length * 4, 80)}
                y={node.y + node.size / 2 + 15}
                width={Math.max(node.label.length * 8, 160)}
                height="24"
                fill="rgba(0,0,0,0.9)"
                rx="6"
                className="pointer-events-none"
              />
              <text
                x={node.x}
                y={node.y + node.size / 2 + 28}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="12"
                fill="white"
                className="pointer-events-none select-none"
              >
                {node.label}
              </text>
            </g>
          )}
        </g>
      );
    });
  };

  const calculateViewBox = () => {
    const padding = 150;
    return `0 0 ${width + padding} ${height + padding}`;
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'complex': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className={`w-full h-full ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Mapa Conceptual
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Badge className={getComplexityColor(data?.metadata?.complexity || 'medium')}>
              {data?.metadata?.complexity || 'medium'}
            </Badge>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowLegend(!showLegend)}
            >
              <Info className="h-4 w-4" />
            </Button>
            
            {onToggleFullscreen && (
              <Button
                size="sm"
                variant="outline"
                onClick={onToggleFullscreen}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 relative">
        <svg
          width="100%"
          height={height}
          viewBox={calculateViewBox()}
          className="border-t bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800"
          preserveAspectRatio="xMidYMid meet"
        >
          <ArrowMarker />
          {renderEdges()}
          {renderNodes()}
        </svg>
        
        {/* Leyenda mejorada */}
        {showLegend && (
          <div className="absolute top-4 left-4 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-border rounded-lg p-4 shadow-lg">
            <h4 className="font-medium text-sm mb-3">Niveles Jerárquicos</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">C</span>
                </div>
                <span>Central - Concepto principal</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <span>Primario - Conceptos clave</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                <span>Secundario - Subconceptos</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span>Detalle - Elementos específicos</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Información del nodo seleccionado */}
        {selectedNode && (
          <div className="absolute bottom-4 right-4 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-border rounded-lg p-4 shadow-lg max-w-sm">
            {(() => {
              const node = getNodeById(selectedNode);
              if (!node) return null;
              
              return (
                <div>
                  <h4 className="font-medium text-sm mb-2">{node.label}</h4>
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="outline">Nivel: {node.level}</Badge>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
        
        {/* Estadísticas mejoradas */}
        <div className="absolute bottom-4 left-4 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span className="font-medium">{data?.metadata?.totalNodes || 0}</span>
              <span className="text-muted-foreground">conceptos</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="font-medium">{getSimplifiedEdges().length}</span>
              <span className="text-muted-foreground">relaciones</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Named export para compatibilidad
export { ConceptMapRenderer };

// Default export
export default ConceptMapRenderer;