import React, { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';

/**
 * 📚 Renderizador de Visualizaciones Educativas - OpositIA
 * Sistema optimizado para el aprendizaje y la retención de conocimientos
 */

interface EducationalNode {
  id: string;
  label: string;
  fullText: string;
  category: string;
  importance: number; // 1-5 (5 = crítico para examen)
  studyLevel: 'basic' | 'intermediate' | 'advanced';
  keyPoints: string[];
  examples?: string[];
  mnemonics?: string;
  context?: any; // Información contextual rica
}

interface EducationalEdge {
  from: string;
  to: string;
  relationshipType: 'includes' | 'regulates' | 'depends_on' | 'implements' | 'part_of' | 'example_of';
  explanation: string;
  strength: number; // 1-3 (importancia de la relación)
}

interface EducationalNetworkRendererProps {
  nodes: EducationalNode[];
  edges: EducationalEdge[];
  type: 'concept-map' | 'flowchart' | 'hierarchical-scheme';
  studyMode: 'overview' | 'detailed' | 'quiz';
  showLevel: 'all' | 'basic' | 'intermediate' | 'advanced';
  onNodeStudied?: (nodeId: string) => void;
  className?: string;
}

export default function EducationalNetworkRenderer({
  nodes,
  edges,
  type,
  studyMode,
  showLevel,
  onNodeStudied,
  className
}: EducationalNetworkRendererProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [studiedNodes, setStudiedNodes] = useState<Set<string>>(new Set());
  const [focusedCategory, setFocusedCategory] = useState<string | null>(null);
  const [showOnlyImportant, setShowOnlyImportant] = useState(false);

  // Filtrar nodos según nivel de estudio
  const filteredNodes = useMemo(() => {
    let filtered = nodes;
    
    // Filtrar por nivel
    if (showLevel !== 'all') {
      filtered = filtered.filter(node => node.studyLevel === showLevel);
    }
    
    // Filtrar por importancia si está activado
    if (showOnlyImportant) {
      filtered = filtered.filter(node => node.importance >= 4);
    }
    
    // Filtrar por categoría si hay una seleccionada
    if (focusedCategory) {
      filtered = filtered.filter(node => node.category === focusedCategory);
    }
    
    return filtered;
  }, [nodes, showLevel, showOnlyImportant, focusedCategory]);

  // Agrupar nodos por categorías para clustering
  const nodesByCategory = useMemo(() => {
    return filteredNodes.reduce((acc, node) => {
      if (!acc[node.category]) {
        acc[node.category] = [];
      }
      acc[node.category].push(node);
      return acc;
    }, {} as Record<string, EducationalNode[]>);
  }, [filteredNodes]);

  // Generar layout educativo inteligente
  const layoutNodes = useMemo(() => {
    return generateEducationalLayout(filteredNodes, type, nodesByCategory);
  }, [filteredNodes, type, nodesByCategory]);

  // Filtrar edges relevantes
  const relevantEdges = useMemo(() => {
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    return edges.filter(edge => nodeIds.has(edge.from) && nodeIds.has(edge.to));
  }, [edges, filteredNodes]);

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNode(selectedNode === nodeId ? null : nodeId);
  }, [selectedNode]);

  const markAsStudied = useCallback((nodeId: string) => {
    setStudiedNodes(prev => new Set([...prev, nodeId]));
    onNodeStudied?.(nodeId);
  }, [onNodeStudied]);

  const getImportanceColor = (importance: number) => {
    switch (importance) {
      case 5: return '#ef4444'; // Rojo - Crítico
      case 4: return '#f97316'; // Naranja - Muy importante
      case 3: return '#eab308'; // Amarillo - Importante
      case 2: return '#22c55e'; // Verde - Moderado
      case 1: return '#64748b'; // Gris - Básico
      default: return '#64748b';
    }
  };

  const getStudyLevelIcon = (level: string) => {
    switch (level) {
      case 'basic': return '🟢';
      case 'intermediate': return '🟡';
      case 'advanced': return '🔴';
      default: return '⭐';
    }
  };

  if (filteredNodes.length === 0) {
    return (
      <div className={cn('w-full h-full flex items-center justify-center bg-muted/20 border-2 border-dashed rounded-lg', className)}>
        <div className="text-center p-8">
          <div className="text-4xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-muted-foreground">Modo Educativo</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Ajusta los filtros para ver contenido de estudio
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('w-full h-full bg-background relative', className)}>
      {/* Panel de Control Educativo */}
      <div className="absolute top-4 left-4 z-10 bg-card/95 backdrop-blur rounded-lg p-3 shadow-lg border">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            📚 <span>Control de Estudio</span>
          </div>
          
          {/* Filtro por importancia */}
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={showOnlyImportant}
              onChange={(e) => setShowOnlyImportant(e.target.checked)}
              className="rounded"
            />
            Solo conceptos críticos
          </label>

          {/* Selector de categoría */}
          <select
            value={focusedCategory || ''}
            onChange={(e) => setFocusedCategory(e.target.value || null)}
            className="w-full text-xs bg-background border rounded px-2 py-1"
          >
            <option value="">Todas las categorías</option>
            {Object.keys(nodesByCategory).map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          {/* Progreso de estudio */}
          <div className="text-xs text-muted-foreground">
            Estudiado: {studiedNodes.size}/{filteredNodes.length}
            <div className="w-full bg-muted rounded-full h-1 mt-1">
              <div 
                className="bg-primary h-1 rounded-full transition-all"
                style={{ width: `${(studiedNodes.size / filteredNodes.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* SVG Principal */}
      <svg width="100%" height="100%" viewBox="0 0 1200 800" className="transition-all duration-300">
        {/* Definiciones para educación */}
        <defs>
          {/* Gradientes por importancia */}
          <linearGradient id="critical" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fee2e2" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
          
          <linearGradient id="important" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fed7aa" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
          
          <linearGradient id="moderate" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#dcfce7" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>

          {/* Filtros educativos */}
          <filter id="studied" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#22c55e" floodOpacity="0.6"/>
          </filter>
          
          <filter id="focus" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#3b82f6" floodOpacity="0.8"/>
          </filter>
        </defs>

        {/* Renderizar clusters por categoría */}
        {Object.entries(nodesByCategory).map(([category, categoryNodes]) => (
          <g key={category} className="category-cluster">
            {/* Fondo del cluster */}
            <rect
              x={Math.min(...categoryNodes.map(n => layoutNodes.find(ln => ln.id === n.id)?.x || 0)) - 40}
              y={Math.min(...categoryNodes.map(n => layoutNodes.find(ln => ln.id === n.id)?.y || 0)) - 40}
              width={Math.max(...categoryNodes.map(n => layoutNodes.find(ln => ln.id === n.id)?.x || 0)) - 
                     Math.min(...categoryNodes.map(n => layoutNodes.find(ln => ln.id === n.id)?.x || 0)) + 80}
              height={Math.max(...categoryNodes.map(n => layoutNodes.find(ln => ln.id === n.id)?.y || 0)) - 
                      Math.min(...categoryNodes.map(n => layoutNodes.find(ln => ln.id === n.id)?.y || 0)) + 80}
              rx="20"
              fill="rgba(59, 130, 246, 0.05)"
              stroke="rgba(59, 130, 246, 0.2)"
              strokeWidth="2"
              strokeDasharray="5,5"
              className="transition-all duration-300"
            />
            
            {/* Etiqueta de categoría */}
            <text
              x={Math.min(...categoryNodes.map(n => layoutNodes.find(ln => ln.id === n.id)?.x || 0)) - 30}
              y={Math.min(...categoryNodes.map(n => layoutNodes.find(ln => ln.id === n.id)?.y || 0)) - 15}
              fontSize="12"
              fontWeight="600"
              fill="#3b82f6"
              className="select-none"
            >
              📂 {category}
            </text>
          </g>
        ))}

        {/* Renderizar conexiones educativas */}
        <g className="educational-edges">
          {relevantEdges.map((edge, index) => {
            const fromNode = layoutNodes.find(n => n.id === edge.from);
            const toNode = layoutNodes.find(n => n.id === edge.to);
            
            if (!fromNode || !toNode) return null;

            return (
              <g key={`edge-${index}`} className="educational-edge">
                <line
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke={edge.strength === 3 ? "#ef4444" : edge.strength === 2 ? "#f97316" : "#64748b"}
                  strokeWidth={edge.strength}
                  strokeDasharray={edge.relationshipType === 'depends_on' ? "5,3" : "none"}
                  markerEnd="url(#arrow)"
                  className="transition-all duration-300"
                />
                
                {/* Etiqueta de relación */}
                <text
                  x={(fromNode.x + toNode.x) / 2}
                  y={(fromNode.y + toNode.y) / 2 - 8}
                  fontSize="10"
                  fill="#64748b"
                  textAnchor="middle"
                  className="select-none"
                >
                  {getRelationshipLabel(edge.relationshipType)}
                </text>
              </g>
            );
          })}
        </g>

        {/* Renderizar nodos educativos */}
        <g className="educational-nodes">
          {layoutNodes.map((node) => {
            const originalNode = filteredNodes.find(n => n.id === node.id);
            if (!originalNode) return null;

            const isStudied = studiedNodes.has(node.id);
            const isSelected = selectedNode === node.id;
            const nodeSize = 60 + (originalNode.importance * 8); // Tamaño por importancia

            return (
              <g
                key={node.id}
                className="educational-node cursor-pointer"
                onClick={() => handleNodeClick(node.id)}
                onDoubleClick={() => markAsStudied(node.id)}
              >
                {/* Círculo principal */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={nodeSize / 2}
                  fill={getImportanceColor(originalNode.importance)}
                  stroke={isSelected ? "#fbbf24" : "#ffffff"}
                  strokeWidth={isSelected ? 4 : 2}
                  filter={isStudied ? "url(#studied)" : isSelected ? "url(#focus)" : undefined}
                  className="transition-all duration-300"
                />

                {/* Texto principal - SIN TRUNCAR */}
                <text
                  x={node.x}
                  y={node.y - 5}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="600"
                  fill="white"
                  className="select-none"
                >
                  {originalNode.label.length > 25 ? 
                    originalNode.label.substring(0, 22) + '...' : 
                    originalNode.label}
                </text>

                {/* Indicadores de estudio */}
                <text
                  x={node.x}
                  y={node.y + 8}
                  textAnchor="middle"
                  fontSize="8"
                  fill="rgba(255,255,255,0.8)"
                  className="select-none"
                >
                  {getStudyLevelIcon(originalNode.studyLevel)} Imp:{originalNode.importance}
                </text>

                {/* Marca de estudiado */}
                {isStudied && (
                  <circle
                    cx={node.x + nodeSize/2 - 8}
                    cy={node.y - nodeSize/2 + 8}
                    r="6"
                    fill="#22c55e"
                    stroke="white"
                    strokeWidth="2"
                  />
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Panel de Detalles Educativo */}
      {selectedNode && (
        <EducationalNodePanel 
          node={filteredNodes.find(n => n.id === selectedNode)}
          onClose={() => setSelectedNode(null)}
          onMarkStudied={() => markAsStudied(selectedNode)}
          isStudied={studiedNodes.has(selectedNode)}
          studyMode={studyMode}
        />
      )}

      {/* Estadísticas educativas */}
      <div className="absolute bottom-4 right-4 bg-card/95 backdrop-blur rounded-lg p-3 shadow-lg border">
        <div className="text-xs space-y-1">
          <div className="font-medium">📊 Estadísticas</div>
          <div>🎯 Conceptos críticos: {filteredNodes.filter(n => n.importance >= 4).length}</div>
          <div>✅ Estudiados: {studiedNodes.size}</div>
          <div>📚 Total visible: {filteredNodes.length}</div>
        </div>
      </div>
    </div>
  );
}

// Generar layout educativo que respeta la pedagogía
function generateEducationalLayout(
  nodes: EducationalNode[], 
  type: string, 
  nodesByCategory: Record<string, EducationalNode[]>
): Array<EducationalNode & { x: number; y: number }> {
  const categories = Object.keys(nodesByCategory);
  const layoutNodes: Array<EducationalNode & { x: number; y: number }> = [];
  
  if (type === 'concept-map') {
    // Layout por importancia y categoría
    let currentY = 120;
    const categorySpacing = 160;
    
    categories.forEach((category, catIndex) => {
      const categoryNodes = nodesByCategory[category].sort((a, b) => b.importance - a.importance);
      const nodesPerRow = Math.min(4, categoryNodes.length);
      const startX = 100;
      const nodeSpacing = 200;
      
      categoryNodes.forEach((node, index) => {
        const row = Math.floor(index / nodesPerRow);
        const col = index % nodesPerRow;
        
        layoutNodes.push({
          ...node,
          x: startX + (col * nodeSpacing),
          y: currentY + (row * 100)
        });
      });
      
      currentY += Math.ceil(categoryNodes.length / nodesPerRow) * 100 + categorySpacing;
    });
  }
  
  return layoutNodes;
}

// Obtener etiqueta legible de relación
function getRelationshipLabel(type: string): string {
  switch (type) {
    case 'includes': return 'incluye';
    case 'regulates': return 'regula';
    case 'depends_on': return 'depende de';
    case 'implements': return 'implementa';
    case 'part_of': return 'parte de';
    case 'example_of': return 'ejemplo de';
    default: return 'relaciona';
  }
}

// Panel de detalles educativo
function EducationalNodePanel({ 
  node, 
  onClose, 
  onMarkStudied, 
  isStudied, 
  studyMode 
}: { 
  node: EducationalNode | undefined;
  onClose: () => void;
  onMarkStudied: () => void;
  isStudied: boolean;
  studyMode: string;
}) {
  if (!node) return null;

  return (
    <div className="absolute top-4 right-4 w-96 max-h-[80vh] bg-card/98 backdrop-blur border rounded-lg shadow-2xl overflow-hidden">
      {/* Header educativo */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="text-lg">📚</span>
            <div className="text-xs px-2 py-1 bg-primary/20 rounded-full">
              Importancia: {node.importance}/5
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onMarkStudied}
            className={cn(
              "px-2 py-1 text-xs rounded-full transition-colors",
              isStudied 
                ? "bg-green-100 text-green-700 border border-green-200" 
                : "bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200"
            )}
          >
            {isStudied ? "✅ Estudiado" : "📖 Marcar estudiado"}
          </button>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded">
            ✕
          </button>
        </div>
      </div>

      {/* Contenido educativo */}
      <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)] space-y-4">
        {/* Título completo */}
        <div>
          <h3 className="font-bold text-lg mb-2">{node.fullText || node.label}</h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-1 bg-muted rounded-full">{node.category}</span>
            <span className="px-2 py-1 bg-muted rounded-full">{node.studyLevel}</span>
          </div>
        </div>

        {/* Puntos clave */}
        {node.keyPoints && node.keyPoints.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              🎯 Puntos Clave para Memorizar
            </h4>
            <ul className="space-y-2">
              {node.keyPoints.map((point, index) => (
                <li key={index} className="text-sm p-2 bg-yellow-50 border-l-3 border-yellow-400 rounded">
                  {point}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Ejemplos */}
        {node.examples && node.examples.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              💡 Ejemplos Prácticos
            </h4>
            <div className="space-y-2">
              {node.examples.map((example, index) => (
                <div key={index} className="text-sm p-2 bg-blue-50 border-l-3 border-blue-400 rounded">
                  {example}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reglas mnemotécnicas */}
        {node.mnemonics && (
          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              🧠 Regla Mnemotécnica
            </h4>
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm">
              {node.mnemonics}
            </div>
          </div>
        )}

        {/* Información contextual si existe */}
        {node.context && (
          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              📋 Información Detallada
            </h4>
            <div className="text-sm space-y-2">
              {node.context.description && (
                <p className="p-2 bg-muted/30 rounded">{node.context.description}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 