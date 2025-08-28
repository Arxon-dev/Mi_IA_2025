import React from 'react';

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  size: number;
  color: string;
  level: number;
}

interface Edge {
  id: string;
  source: string;
  target: string;
  label: string;
}

interface SimpleHierarchicalMapProps {
  content: string;
  width?: number;
  height?: number;
}

export default function SimpleHierarchicalMap({ 
  content, 
  width = 1200, 
  height = 800 
}: SimpleHierarchicalMapProps) {
  
  // Función simple para extraer el concepto principal
  const extractMainConcept = (text: string): string => {
    // Buscar títulos en el contenido
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const firstLine = lines[0] || '';
    
    // Si la primera línea parece un título
    if (firstLine.length > 10 && firstLine.length < 80 && !firstLine.includes('.')) {
      return firstLine.trim();
    }
    
    // Buscar conceptos principales en las primeras oraciones
    const sentences = text.split(/[.!?]+/).slice(0, 3);
    for (const sentence of sentences) {
      const words = sentence.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}\b/g) || [];
      for (const word of words) {
        if (word.length > 8 && word.length < 50) {
          return word.trim();
        }
      }
    }
    
    return 'Concepto Principal';
  };

  // Función para extraer conceptos secundarios
  const extractSecondaryConcepts = (text: string, mainConcept: string): string[] => {
    const concepts: string[] = [];
    const sentences = text.split(/[.!?]+/);
    
    sentences.forEach(sentence => {
      if (sentence.toLowerCase().includes('incluye') || 
          sentence.toLowerCase().includes('comprende') ||
          sentence.toLowerCase().includes('constituye') ||
          sentence.toLowerCase().includes('tipos') ||
          sentence.toLowerCase().includes('fases') ||
          sentence.toLowerCase().includes('elementos')) {
        
        const matches = sentence.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b/g) || [];
        matches.forEach(match => {
          if (match !== mainConcept && match.length > 5 && match.length < 40) {
            concepts.push(match.trim());
          }
        });
      }
    });
    
    // Remover duplicados y limitar
    return Array.from(new Set(concepts)).slice(0, 8);
  };

  // Función para extraer detalles
  const extractDetails = (text: string): string[] => {
    const details: string[] = [];
    const sentences = text.split(/[.!?]+/);
    
    sentences.forEach(sentence => {
      if (sentence.toLowerCase().includes('ejemplo') || 
          sentence.toLowerCase().includes('como') ||
          sentence.toLowerCase().includes('mediante') ||
          sentence.toLowerCase().includes('través')) {
        
        const matches = sentence.match(/\b[a-z][a-z\s]{8,30}\b/g) || [];
        matches.forEach(match => {
          if (match.length > 8 && match.length < 35) {
            details.push(match.trim());
          }
        });
      }
    });
    
    return Array.from(new Set(details)).slice(0, 6);
  };

  // Generar los nodos y conexiones
  const generateHierarchicalMap = () => {
    const centerX = width / 2;
    const centerY = height / 2;
    
    const mainConcept = extractMainConcept(content);
    const secondaryConcepts = extractSecondaryConcepts(content, mainConcept);
    const details = extractDetails(content);
    
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    // Nodo central
    nodes.push({
      id: 'central',
      label: mainConcept,
      x: centerX,
      y: centerY,
      size: 40,
      color: '#2563eb',
      level: 0
    });
    
    // Nodos secundarios (nivel 1)
    secondaryConcepts.forEach((concept, index) => {
      const angle = (2 * Math.PI * index) / Math.max(secondaryConcepts.length, 4);
      const radius = 180;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      nodes.push({
        id: `secondary-${index}`,
        label: concept,
        x,
        y,
        size: 25,
        color: '#059669',
        level: 1
      });
      
      // Conexión al centro
      edges.push({
        id: `edge-central-secondary-${index}`,
        source: 'central',
        target: `secondary-${index}`,
        label: 'incluye'
      });
    });
    
    // Nodos de detalle (nivel 2)
    details.forEach((detail, index) => {
      const angle = (2 * Math.PI * index) / Math.max(details.length, 6);
      const radius = 320;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      nodes.push({
        id: `detail-${index}`,
        label: detail,
        x,
        y,
        size: 18,
        color: '#dc2626',
        level: 2
      });
      
      // Conectar con el nodo secundario más cercano
      const parentIndex = index % Math.max(secondaryConcepts.length, 1);
      const parentId = secondaryConcepts.length > 0 ? `secondary-${parentIndex}` : 'central';
      
      edges.push({
        id: `edge-${parentId}-detail-${index}`,
        source: parentId,
        target: `detail-${index}`,
        label: 'mediante'
      });
    });
    
    return { nodes, edges };
  };

  const { nodes, edges } = generateHierarchicalMap();

  return (
    <div className="w-full h-full bg-white border rounded-lg overflow-hidden">
      <svg width={width} height={height} className="w-full h-full">
        {/* Definir patrones de flecha */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#64748b"
            />
          </marker>
        </defs>
        
        {/* Renderizar conexiones */}
        {edges.map(edge => {
          const sourceNode = nodes.find(n => n.id === edge.source);
          const targetNode = nodes.find(n => n.id === edge.target);
          
          if (!sourceNode || !targetNode) return null;
          
          // Calcular posición del centro de la línea para la etiqueta
          const midX = (sourceNode.x + targetNode.x) / 2;
          const midY = (sourceNode.y + targetNode.y) / 2;
          
          return (
            <g key={edge.id}>
              {/* Línea de conexión */}
              <line
                x1={sourceNode.x}
                y1={sourceNode.y}
                x2={targetNode.x}
                y2={targetNode.y}
                stroke="#64748b"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />
              
              {/* Etiqueta de relación */}
              <text
                x={midX}
                y={midY - 5}
                textAnchor="middle"
                className="text-xs fill-gray-600 font-medium"
                style={{ fontSize: '11px' }}
              >
                {edge.label}
              </text>
            </g>
          );
        })}
        
        {/* Renderizar nodos */}
        {nodes.map(node => (
          <g key={node.id}>
            {/* Círculo del nodo */}
            <circle
              cx={node.x}
              cy={node.y}
              r={node.size}
              fill={node.color}
              stroke="#ffffff"
              strokeWidth="3"
              className="cursor-pointer hover:opacity-80 transition-opacity"
            />
            
            {/* Texto del nodo */}
            <text
              x={node.x}
              y={node.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-white font-semibold pointer-events-none"
              style={{ 
                fontSize: node.level === 0 ? '14px' : node.level === 1 ? '12px' : '10px',
                maxWidth: `${node.size * 2 - 10}px`
              }}
            >
              {/* Dividir texto largo en múltiples líneas */}
              {node.label.length > 20 ? (
                <>
                  <tspan x={node.x} dy="-6">
                    {node.label.substring(0, 20)}
                  </tspan>
                  <tspan x={node.x} dy="12">
                    {node.label.substring(20)}
                  </tspan>
                </>
              ) : (
                node.label
              )}
            </text>
          </g>
        ))}
        
        {/* Leyenda */}
        <g transform="translate(20, 20)">
          <rect width="200" height="120" fill="rgba(255,255,255,0.9)" stroke="#e5e7eb" rx="5" />
          <text x="10" y="20" className="font-semibold text-sm fill-gray-800">
            Estructura Jerárquica
          </text>
          
          {/* Nivel 0 */}
          <circle cx="20" cy="40" r="8" fill="#2563eb" />
          <text x="35" y="45" className="text-xs fill-gray-700">
            Concepto Principal
          </text>
          
          {/* Nivel 1 */}
          <circle cx="20" cy="60" r="6" fill="#059669" />
          <text x="35" y="65" className="text-xs fill-gray-700">
            Conceptos Secundarios
          </text>
          
          {/* Nivel 2 */}
          <circle cx="20" cy="80" r="4" fill="#dc2626" />
          <text x="35" y="85" className="text-xs fill-gray-700">
            Detalles y Ejemplos
          </text>
          
          {/* Estadísticas */}
          <text x="10" y="105" className="text-xs fill-gray-600">
            {nodes.length} conceptos • {edges.length} relaciones
          </text>
        </g>
      </svg>
    </div>
  );
} 