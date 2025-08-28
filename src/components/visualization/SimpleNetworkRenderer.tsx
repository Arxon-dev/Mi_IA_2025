import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface Node {
  id: string;
  label: string;
  x?: number;
  y?: number;
  type?: string;
  confidence?: number;
  // Nuevas propiedades educativas
  importance?: number; // 1-5 (5 = más importante)
  studyLevel?: 'basic' | 'intermediate' | 'advanced';
  category?: string;
  fullText?: string; // Texto completo sin truncar
  keyPoints?: string[]; // Puntos clave para memorizar
  examples?: string[]; // Ejemplos prácticos
  mnemonics?: string; // Reglas mnemotécnicas
}

interface Edge {
  from?: string;
  to?: string;
  source?: string;
  target?: string;
  type?: string;
  label?: string;
  // Nuevas propiedades educativas
  relationshipType?: 'includes' | 'regulates' | 'depends_on' | 'implements' | 'part_of' | 'example_of';
  explanation?: string; // Explicación de la relación
  bidirectional?: boolean;
}

interface SimpleNetworkRendererProps {
  nodes: Node[];
  edges: Edge[];
  type: 'concept-map' | 'flowchart' | 'hierarchical-scheme';
  animated?: boolean;
  showStats?: boolean;
  className?: string;
  // Nuevas propiedades educativas
  studyMode?: 'overview' | 'detailed' | 'quiz';
  showLevel?: 'all' | 'basic' | 'intermediate' | 'advanced';
  enableClustering?: boolean;
}

/**
 * 🎨 Renderizador de Visualizaciones Avanzadas - OpositIA
 * Genera mapas conceptuales, diagramas de flujo y esquemas jerárquicos hermosos
 */
export default function SimpleNetworkRenderer({
  nodes,
  edges,
  animated = true,
  showStats = true,
  className,
  type,
  studyMode,
  showLevel,
  enableClustering
}: SimpleNetworkRendererProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 1200, height: 800 });

  // Procesar y normalizar los datos
  const processedNodes = useMemo(() => {
    if (!nodes || nodes.length === 0) return [];
    
    // Asegurar que todos los nodos tengan posiciones
    return nodes.map((node, index) => ({
      ...node,
      x: node.x ?? 0,
      y: node.y ?? 0,
      type: node.type || 'concept',
      confidence: node.confidence || 0.8
    }));
  }, [nodes]);

  const processedEdges = useMemo(() => {
    if (!edges || edges.length === 0) return [];
    
    return edges.map(edge => ({
      from: edge.from || edge.source || '',
      to: edge.to || edge.target || '',
      type: edge.type || 'relates_to',
      label: edge.label || ''
    })).filter(edge => edge.from && edge.to);
  }, [edges]);

  // Layouts inteligentes según el tipo de visualización
  const layoutNodes = useMemo(() => {
    if (!processedNodes || processedNodes.length === 0) return [];
    
    switch (type) {
      case 'concept-map':
        return generateConceptMapLayout(processedNodes);
      case 'flowchart':
        return generateFlowchartLayout(processedNodes);
      case 'hierarchical-scheme':
        return generateHierarchicalLayout(processedNodes);
      default:
        return processedNodes;
    }
  }, [processedNodes, type]);

  // Actualizar viewBox basado en los nodos
  useEffect(() => {
    if (layoutNodes.length === 0) return;
    
    const margin = 100;
    const xs = layoutNodes.map(n => n.x);
    const ys = layoutNodes.map(n => n.y);
    const minX = Math.min(...xs) - margin;
    const maxX = Math.max(...xs) + margin;
    const minY = Math.min(...ys) - margin;
    const maxY = Math.max(...ys) + margin;
    
    setViewBox({
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    });
  }, [layoutNodes]);

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNode(selectedNode === nodeId ? null : nodeId);
  }, [selectedNode]);

  if (!layoutNodes || layoutNodes.length === 0) {
    return (
      <div className={cn('w-full h-full flex items-center justify-center bg-muted/30 border-2 border-dashed border-muted-foreground/20 rounded-lg', className)}>
        <div className="text-center p-8">
          <div className="text-4xl mb-4">🎨</div>
          <h3 className="text-lg font-medium text-muted-foreground">Generando visualización...</h3>
          <p className="text-sm text-muted-foreground mt-2">Los conceptos aparecerán aquí</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('w-full h-full bg-gradient-to-br from-background to-muted/20 relative overflow-hidden', className)}>
      {/* Estilos CSS para animaciones */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 10px rgba(59, 130, 246, 0.3); }
          50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.6); }
        }
        
        @keyframes flow-dash {
          0% { stroke-dashoffset: 20; }
          100% { stroke-dashoffset: 0; }
        }
        
        @keyframes slideIn {
          0% { transform: translateX(100%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        
        .node-float { animation: float 3s ease-in-out infinite; }
        .node-glow { animation: pulse-glow 2s ease-in-out infinite; }
        .edge-flow { animation: flow-dash 1s linear infinite; }
        .panel-slide { animation: slideIn 0.3s ease-out; }
        
        .node-hover {
          transform: scale(1.1);
          filter: drop-shadow(0 0 12px rgba(59, 130, 246, 0.4));
        }
        
        .edge-hover {
          stroke-width: 3 !important;
          stroke: #3b82f6 !important;
        }
      `}</style>

      <svg
        width="100%"
        height="100%"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        className="transition-all duration-500"
      >
        {/* Definiciones */}
        <defs>
          {/* Gradientes hermosos y profesionales */}
          <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#1e40af" />
          </linearGradient>
          
          <linearGradient id="successGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="50%" stopColor="#16a34a" />
            <stop offset="100%" stopColor="#15803d" />
          </linearGradient>
          
          <linearGradient id="warningGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="50%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
          
          <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#6d28d9" />
          </linearGradient>

          {/* Gradientes adicionales para más variedad */}
          <linearGradient id="pinkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="50%" stopColor="#db2777" />
            <stop offset="100%" stopColor="#be185d" />
          </linearGradient>

          <linearGradient id="cyanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#0891b2" />
            <stop offset="100%" stopColor="#0e7490" />
          </linearGradient>

          <linearGradient id="emeraldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#059669" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>

          <linearGradient id="indigoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#4338ca" />
          </linearGradient>

          {/* Filtros para efectos hermosos */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.2"/>
          </filter>

          <filter id="innerGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feComposite in="coloredBlur" in2="SourceGraphic" operator="over"/>
          </filter>

          {/* Flechas elegantes */}
          <marker id="arrowPrimary" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="strokeWidth">
            <path d="M2,2 L2,10 L8,6 z" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="0.5" />
          </marker>
          
          <marker id="arrowSuccess" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="strokeWidth">
            <path d="M2,2 L2,10 L8,6 z" fill="#10b981" stroke="#047857" strokeWidth="0.5" />
          </marker>
          
          <marker id="arrowWarning" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="strokeWidth">
            <path d="M2,2 L2,10 L8,6 z" fill="#f59e0b" stroke="#d97706" strokeWidth="0.5" />
          </marker>

          <marker id="arrowAccent" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="strokeWidth">
            <path d="M2,2 L2,10 L8,6 z" fill="#8b5cf6" stroke="#7c3aed" strokeWidth="0.5" />
          </marker>

          {/* Patrones para conexiones */}
          <pattern id="connectionDots" patternUnits="userSpaceOnUse" width="10" height="10">
            <circle cx="5" cy="5" r="1" fill="#94a3b8" opacity="0.6"/>
          </pattern>
        </defs>

        {/* Renderizar conexiones */}
        <g className="edges">
          {processedEdges.map((edge, index) => {
            const fromNode = layoutNodes.find(n => n.id === edge.from);
            const toNode = layoutNodes.find(n => n.id === edge.to);
            
            if (!fromNode || !toNode) return null;
            
            const isHighlighted = selectedNode === edge.from || selectedNode === edge.to ||
                                hoveredNode === edge.from || hoveredNode === edge.to;
            
            return (
              <RenderEdge
                key={`edge-${index}`}
                edge={edge}
                fromNode={fromNode}
                toNode={toNode}
                type={type}
                isHighlighted={isHighlighted}
                animated={animated}
              />
            );
          })}
        </g>

        {/* Renderizar nodos */}
        <g className="nodes">
          {layoutNodes.map((node) => {
            const isSelected = selectedNode === node.id;
            const isHovered = hoveredNode === node.id;
            const isHighlighted = isSelected || isHovered ||
              processedEdges.some(edge => 
                (edge.from === selectedNode && edge.to === node.id) ||
                (edge.to === selectedNode && edge.from === node.id) ||
                (edge.from === hoveredNode && edge.to === node.id) ||
                (edge.to === hoveredNode && edge.from === node.id)
              );
            
            return (
              <RenderNode
                key={node.id}
                node={node}
                type={type}
                isSelected={isSelected}
                isHighlighted={isHighlighted}
                animated={animated}
                onClick={() => handleNodeClick(node.id)}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
              />
            );
          })}
        </g>
      </svg>

      {/* Panel de Detalles Contextual */}
      {selectedNode && (
        <NodeDetailsPanel 
          node={layoutNodes.find(n => n.id === selectedNode)}
          onClose={() => setSelectedNode(null)}
        />
      )}

      {/* Panel de estadísticas */}
      {showStats && (
        <div className="absolute bottom-4 right-4 bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <span className="font-medium">{layoutNodes.length}</span>
              <span className="text-muted-foreground">nodos</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-success"></div>
              <span className="font-medium">{processedEdges.length}</span>
              <span className="text-muted-foreground">conexiones</span>
            </div>
            <div className="px-2 py-1 bg-muted/50 rounded text-xs font-medium">
              {type === 'concept-map' && '🧠 Conceptual'}
              {type === 'flowchart' && '🔄 Proceso'}
              {type === 'hierarchical-scheme' && '🏗️ Jerárquico'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente para renderizar nodos individuales
function RenderNode({
  node,
  type,
  isSelected,
  isHighlighted,
  animated,
  onClick,
  onMouseEnter,
  onMouseLeave
}: {
  node: Node & { x: number; y: number };
  type: string;
  isSelected: boolean;
  isHighlighted: boolean;
  animated: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const { fill, stroke, shape, size } = getNodeStyle(node, type, isSelected, isHighlighted);
  
  return (
    <g
      className={cn(
        'cursor-pointer transition-all duration-300 ease-out',
        animated && 'node-float',
        isHighlighted && 'node-hover'
      )}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Sombras más suaves y profesionales */}
      {shape === 'circle' && (
        <>
          {/* Sombra principal */}
          <circle
            cx={node.x + 3}
            cy={node.y + 3}
            r={size / 2}
            fill="rgba(0,0,0,0.15)"
            className="opacity-70"
          />
          {/* Sombra secundaria para más profundidad */}
          <circle
            cx={node.x + 6}
            cy={node.y + 6}
            r={size / 2}
            fill="rgba(0,0,0,0.08)"
            className="opacity-50"
          />
        </>
      )}
      
      {shape === 'rect' && (
        <>
          {/* Sombra principal */}
          <rect
            x={node.x - size / 2 + 3}
            y={node.y - size / 3 + 3}
            width={size}
            height={size / 1.5}
            rx="12"
            fill="rgba(0,0,0,0.15)"
            className="opacity-70"
          />
          {/* Sombra secundaria */}
          <rect
            x={node.x - size / 2 + 6}
            y={node.y - size / 3 + 6}
            width={size}
            height={size / 1.5}
            rx="12"
            fill="rgba(0,0,0,0.08)"
            className="opacity-50"
          />
        </>
      )}
      
      {shape === 'diamond' && (
        <>
          {/* Sombra principal */}
          <polygon
            points={`${node.x + 3},${node.y - size / 2 + 3} ${node.x + size / 2 + 3},${node.y + 3} ${node.x + 3},${node.y + size / 2 + 3} ${node.x - size / 2 + 3},${node.y + 3}`}
            fill="rgba(0,0,0,0.15)"
            className="opacity-70"
          />
          {/* Sombra secundaria */}
          <polygon
            points={`${node.x + 6},${node.y - size / 2 + 6} ${node.x + size / 2 + 6},${node.y + 6} ${node.x + 6},${node.y + size / 2 + 6} ${node.x - size / 2 + 6},${node.y + 6}`}
            fill="rgba(0,0,0,0.08)"
            className="opacity-50"
          />
        </>
      )}

      {/* Nodo principal con efectos mejorados */}
      {shape === 'circle' && (
        <>
          {/* Círculo principal */}
          <circle
            cx={node.x}
            cy={node.y}
            r={size / 2}
            fill={fill}
            stroke={stroke}
            strokeWidth={isSelected ? 4 : 2}
            filter={isHighlighted ? "url(#glow)" : undefined}
            className="transition-all duration-300"
          />
          {/* Highlight superior para efecto 3D */}
          <circle
            cx={node.x}
            cy={node.y - size / 8}
            r={size / 3}
            fill="rgba(255,255,255,0.3)"
            className="pointer-events-none"
          />
        </>
      )}
      
      {shape === 'rect' && (
        <>
          {/* Rectángulo principal */}
          <rect
            x={node.x - size / 2}
            y={node.y - size / 3}
            width={size}
            height={size / 1.5}
            rx="12"
            fill={fill}
            stroke={stroke}
            strokeWidth={isSelected ? 4 : 2}
            filter={isHighlighted ? "url(#glow)" : undefined}
            className="transition-all duration-300"
          />
          {/* Highlight superior para efecto 3D */}
          <rect
            x={node.x - size / 2 + 4}
            y={node.y - size / 3 + 4}
            width={size - 8}
            height={size / 4}
            rx="8"
            fill="rgba(255,255,255,0.25)"
            className="pointer-events-none"
          />
        </>
      )}
      
      {shape === 'diamond' && (
        <>
          {/* Rombo principal */}
          <polygon
            points={`${node.x},${node.y - size / 2} ${node.x + size / 2},${node.y} ${node.x},${node.y + size / 2} ${node.x - size / 2},${node.y}`}
            fill={fill}
            stroke={stroke}
            strokeWidth={isSelected ? 4 : 2}
            filter={isHighlighted ? "url(#glow)" : undefined}
            className="transition-all duration-300"
          />
          {/* Highlight superior para efecto 3D */}
          <polygon
            points={`${node.x},${node.y - size / 3} ${node.x + size / 4},${node.y - size / 8} ${node.x},${node.y + size / 8} ${node.x - size / 4},${node.y - size / 8}`}
            fill="rgba(255,255,255,0.25)"
            className="pointer-events-none"
          />
        </>
      )}

      {/* Texto del nodo con mejor tipografía */}
      <text
        x={node.x}
        y={node.y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={Math.max(11, Math.min(15, size / 4.5))}
        fontWeight={isSelected ? "700" : "600"}
        fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
        fill={fill.includes('gradient') ? "#ffffff" : (isHighlighted ? "#ffffff" : "#1f2937")}
        className="transition-all duration-300 pointer-events-none select-none"
        style={{
          textShadow: fill.includes('gradient') || isHighlighted ? '1px 1px 2px rgba(0,0,0,0.3)' : 'none'
        }}
      >
        {truncateText(node.label, size)}
      </text>

      {/* Indicador de confianza como pequeño círculo */}
      {node.confidence && node.confidence < 0.9 && (
        <circle
          cx={node.x + size / 2 - 8}
          cy={node.y - size / 2 + 8}
          r="4"
          fill={node.confidence > 0.7 ? "#22c55e" : node.confidence > 0.5 ? "#f59e0b" : "#ef4444"}
          stroke="white"
          strokeWidth="1"
          className="opacity-80"
        />
      )}
    </g>
  );
}

// Componente para renderizar conexiones
function RenderEdge({
  edge,
  fromNode,
  toNode,
  type,
  isHighlighted,
  animated
}: {
  edge: any;
  fromNode: Node & { x: number; y: number };
  toNode: Node & { x: number; y: number };
  type: string;
  isHighlighted: boolean;
  animated: boolean;
}) {
  const { stroke, strokeWidth, markerEnd, strokeDasharray } = getEdgeStyle(edge, type, isHighlighted);
  
  // Calcular puntos de conexión en los bordes de los nodos
  const { startX, startY, endX, endY } = calculateEdgePoints(fromNode, toNode);
  
  return (
    <g className={cn(animated && 'edge-flow')}>
      <line
        x1={startX}
        y1={startY}
        x2={endX}
        y2={endY}
        stroke={stroke}
        strokeWidth={strokeWidth}
        markerEnd={markerEnd}
        strokeDasharray={strokeDasharray}
        className={cn(
          'transition-all duration-200',
          isHighlighted && 'edge-hover'
        )}
      />
      
      {/* Etiqueta de la conexión */}
      {edge.label && (
        <text
          x={(startX + endX) / 2}
          y={(startY + endY) / 2 - 5}
          textAnchor="middle"
          fontSize="10"
          fill="#6b7280"
          className="pointer-events-none select-none"
        >
          {edge.label}
        </text>
      )}
    </g>
  );
}

// Funciones auxiliares de layout

function generateConceptMapLayout(nodes: Node[]): (Node & { x: number; y: number })[] {
  if (nodes.length === 0) return [];
  
  // Encontrar el nodo central (normalmente el primero o el más importante)
  const centralNode = nodes.find(n => 
    n.type === 'main' || 
    n.category === 'central' || 
    n.importance === 5
  ) || nodes[0];
  
  const layoutNodes: (Node & { x: number; y: number })[] = [];
  const centerX = 600;
  const centerY = 400;
  
  // Posicionar el nodo central
  layoutNodes.push({
    ...centralNode,
    x: centerX,
    y: centerY
  });
  
  // Separar otros nodos por categorías/importancia
  const otherNodes = nodes.filter(n => n.id !== centralNode.id);
  
  if (otherNodes.length === 0) return layoutNodes;
  
  // Agrupar nodos por categoría o tipo
  const nodeGroups: { [key: string]: Node[] } = {};
  otherNodes.forEach(node => {
    const key = node.category || node.type || 'default';
    if (!nodeGroups[key]) nodeGroups[key] = [];
    nodeGroups[key].push(node);
  });
  
  // Posicionar grupos en círculos concéntricos
  const groupKeys = Object.keys(nodeGroups);
  const baseRadius = 180;
  
  groupKeys.forEach((groupKey, groupIndex) => {
    const groupNodes = nodeGroups[groupKey];
    const groupRadius = baseRadius + (groupIndex * 80); // Círculos concéntricos
    const angleStep = (2 * Math.PI) / Math.max(groupNodes.length, 3);
    const startAngle = (groupIndex * Math.PI) / 4; // Offset para evitar solapamiento
    
    groupNodes.forEach((node, nodeIndex) => {
      const angle = startAngle + (nodeIndex * angleStep);
      const x = centerX + Math.cos(angle) * groupRadius;
      const y = centerY + Math.sin(angle) * groupRadius;
      
      layoutNodes.push({
        ...node,
        x,
        y
      });
    });
  });
  
  return layoutNodes;
}

function generateFlowchartLayout(nodes: Node[]): (Node & { x: number; y: number })[] {
  if (nodes.length === 0) return [];
  
  const startX = 500;
  const startY = 80;
  const stepY = 120;
  const branchWidth = 200;
  
  const layoutNodes: (Node & { x: number; y: number })[] = [];
  
  // Clasificar nodos por tipo de flujo
  const processNodes: Node[] = [];
  const decisionNodes: Node[] = [];
  let startNode: Node | null = null;
  let endNode: Node | null = null;
  
  nodes.forEach((node, index) => {
    if (index === 0 || node.label.toLowerCase().includes('inicio') || node.type === 'start') {
      startNode = node;
    } else if (index === nodes.length - 1 || node.label.toLowerCase().includes('fin') || node.type === 'end') {
      endNode = node;
    } else if (node.label.includes('?') || node.label.toLowerCase().includes('requisito') || 
               node.label.toLowerCase().includes('condición') || node.type === 'decision') {
      decisionNodes.push(node);
    } else {
      processNodes.push(node);
    }
  });
  
  let currentY = startY;
  
  // 1. Nodo de inicio (verde, circular)
  if (startNode) {
    layoutNodes.push({
      id: startNode.id,
      label: startNode.label,
      x: startX,
      y: currentY,
      type: 'start',
      confidence: startNode.confidence || 0.8
    });
    currentY += stepY;
  }
  
  // 2. Procesos principales (azul, rectangulares)
  processNodes.forEach((node, index) => {
    layoutNodes.push({
      id: node.id,
      label: node.label,
      x: startX + (index % 2 === 0 ? 0 : (index % 4 === 1 ? -branchWidth/2 : branchWidth/2)),
      y: currentY,
      type: 'process',
      confidence: node.confidence || 0.8
    });
    currentY += stepY;
  });
  
  // 3. Decisiones (naranja, rombo)
  decisionNodes.forEach((node, index) => {
    layoutNodes.push({
      id: node.id,
      label: node.label,
      x: startX + (index % 2 === 0 ? -branchWidth/4 : branchWidth/4),
      y: currentY,
      type: 'decision',
      confidence: node.confidence || 0.8
    });
    currentY += stepY;
  });
  
  // 4. Nodo final (rojo, circular)
  if (endNode) {
    layoutNodes.push({
      id: endNode.id,
      label: endNode.label,
      x: startX,
      y: currentY,
      type: 'end',
      confidence: endNode.confidence || 0.8
    });
  }
  
  return layoutNodes;
}

function generateHierarchicalLayout(nodes: Node[]): (Node & { x: number; y: number })[] {
  if (nodes.length === 0) return [];
  
  const rootX = 500;
  const rootY = 80;
  const levelHeight = 120;
  const nodeSpacing = 180;
  
  // Identificar niveles jerárquicos
  const levels: Node[][] = [[], [], [], []]; // Máximo 4 niveles
  
  nodes.forEach((node, index) => {
    const nodeType = node.type;
    const nodeText = node.label.toLowerCase();
    
    // Nivel 0: Raíz (Ministerio, concepto principal)
    if (index === 0 || nodeText.includes('ministerio') || nodeType === 'main' || nodeType === 'root') {
      levels[0].push(node);
    }
    // Nivel 1: Direcciones Generales, Secretarías
    else if (nodeText.includes('dirección') || nodeText.includes('secretaría') || nodeType === 'organization') {
      levels[1].push(node);
    }
    // Nivel 2: Subdirecciones, Departamentos
    else if (nodeText.includes('subdirección') || nodeText.includes('departamento') || nodeType === 'category') {
      levels[2].push(node);
    }
    // Nivel 3: Servicios, Unidades, otros
    else {
      levels[3].push(node);
    }
  });
  
  const layoutNodes: (Node & { x: number; y: number })[] = [];
  
  levels.forEach((levelNodes, levelIndex) => {
    if (levelNodes.length === 0) return;
    
    const currentY = rootY + levelIndex * levelHeight;
    const totalWidth = Math.max(levelNodes.length - 1, 0) * nodeSpacing;
    const startX = rootX - totalWidth / 2;
    
    levelNodes.forEach((node, nodeIndex) => {
      const nodeType = levelIndex === 0 ? 'root' :
                      levelIndex === 1 ? 'category' :
                      levelIndex === 2 ? 'subcategory' : 'detail';
                      
      layoutNodes.push({
        ...node,
        x: startX + nodeIndex * nodeSpacing,
        y: currentY,
        type: nodeType
      });
    });
  });
  
  return layoutNodes;
}

// Funciones de estilo

function getNodeStyle(node: Node, type: string, isSelected: boolean, isHighlighted: boolean) {
  const nodeType = node.type || 'default';
  
  let fill = 'url(#primaryGradient)';
  let stroke = '#3b82f6';
  let shape = 'circle';
  let size = 65;
  
  if (type === 'concept-map') {
    switch (nodeType) {
      case 'central':
        fill = 'url(#primaryGradient)';
        stroke = '#1e40af';
        size = 100; // Nodo central más grande
        shape = 'circle';
        break;
      case 'organization':
        fill = 'url(#successGradient)';
        stroke = '#047857';
        size = 85;
        shape = 'rect'; // Rectángulos para organizaciones
        break;
      case 'legal':
        fill = 'url(#accentGradient)';
        stroke = '#7c2d12';
        size = 80;
        shape = 'rect';
        break;
      case 'process':
        fill = 'url(#warningGradient)';
        stroke = '#b45309';
        size = 75;
        shape = 'circle';
        break;
      case 'principle':
        fill = 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)'; // Rosa elegante
        stroke = '#be185d';
        size = 78;
        shape = 'circle';
        break;
      case 'management':
        fill = 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)'; // Cyan profesional
        stroke = '#0891b2';
        size = 82;
        shape = 'rect';
        break;
      case 'concept':
      default:
        fill = 'linear-gradient(135deg, #10b981 0%, #047857 100%)'; // Verde suave
        stroke = '#047857';
        size = 70;
        shape = 'circle';
    }
  } else if (type === 'flowchart') {
    switch (nodeType) {
      case 'start':
      case 'end':
        fill = nodeType === 'start' 
          ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' 
          : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        stroke = nodeType === 'start' ? '#16a34a' : '#dc2626';
        shape = 'circle';
        size = 75;
        break;
      case 'decision':
        fill = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
        stroke = '#d97706';
        shape = 'diamond';
        size = 80;
        break;
      case 'process':
        fill = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
        stroke = '#1d4ed8';
        shape = 'rect';
        size = 90;
        break;
    }
  } else if (type === 'hierarchical-scheme') {
    switch (nodeType) {
      case 'root':
        fill = 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)';
        stroke = '#4f46e5';
        size = 100;
        shape = 'rect';
        break;
      case 'category':
        fill = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
        stroke = '#047857';
        size = 85;
        shape = 'rect';
        break;
      case 'subcategory':
        fill = 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)';
        stroke = '#0e7490';
        size = 70;
        shape = 'circle';
        break;
      default:
        fill = 'linear-gradient(135deg, #64748b 0%, #475569 100%)';
        stroke = '#475569';
        size = 60;
        shape = 'circle';
    }
  }
  
  // Efectos de selección y hover más atractivos
  if (isSelected || isHighlighted) {
    size *= 1.15; // Aumento más notorio
    stroke = '#fbbf24'; // Borde dorado para destacar
  }
  
  return { fill, stroke, shape, size };
}

function getEdgeStyle(edge: any, type: string, isHighlighted: boolean) {
  let stroke = '#6b7280';
  let strokeWidth = 2;
  let markerEnd = 'url(#arrowPrimary)';
  let strokeDasharray = 'none';
  
  if (type === 'flowchart') {
    stroke = '#3b82f6';
    strokeWidth = 3;
  } else if (type === 'hierarchical-scheme') {
    stroke = '#10b981';
    markerEnd = 'url(#arrowSuccess)';
  } else if (type === 'concept-map') {
    strokeDasharray = '5,5';
  }
  
  if (isHighlighted) {
    strokeWidth *= 1.5;
    stroke = '#3b82f6';
  }
  
  return { stroke, strokeWidth, markerEnd, strokeDasharray };
}

function calculateEdgePoints(fromNode: { x: number; y: number }, toNode: { x: number; y: number }) {
  const dx = toNode.x - fromNode.x;
  const dy = toNode.y - fromNode.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance === 0) return { startX: fromNode.x, startY: fromNode.y, endX: toNode.x, endY: toNode.y };
  
  const nodeRadius = 35; // Radio aproximado de los nodos
  
  const startX = fromNode.x + (dx / distance) * nodeRadius;
  const startY = fromNode.y + (dy / distance) * nodeRadius;
  const endX = toNode.x - (dx / distance) * nodeRadius;
  const endY = toNode.y - (dy / distance) * nodeRadius;
  
  return { startX, startY, endX, endY };
}

function truncateText(text: string, size: number): string {
  const maxChars = Math.max(8, Math.floor(size / 6));
  return text.length > maxChars ? text.substring(0, maxChars - 3) + '...' : text;
}

// Componente para mostrar detalles contextuales del nodo seleccionado
function NodeDetailsPanel({ 
  node, 
  onClose 
}: { 
  node: (Node & { x: number; y: number }) | undefined;
  onClose: () => void;
}) {
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
    <div className="absolute top-4 right-4 w-96 max-h-[80vh] bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-2xl panel-slide overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/10 to-primary/5">
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