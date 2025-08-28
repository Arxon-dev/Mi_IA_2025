import React from 'react';
import { NetworkData } from '@/lib/visualizations/types';

interface SimpleNetworkRendererProps {
  data: NetworkData;
  className?: string;
  onNodeClick?: (nodeId: string) => void;
}

/**
 * Renderer simple de redes usando SVG
 * Alternativa ligera a vis-network para pruebas
 */
export default function SimpleNetworkRenderer({ 
  data, 
  className = '',
  onNodeClick 
}: SimpleNetworkRendererProps) {
  
  // Calcular posiciones simples en círculo
  const centerX = 300;
  const centerY = 200;
  const radius = 150;
  
  const nodesWithPositions = data.nodes.map((node, index) => {
    const angle = (index / data.nodes.length) * 2 * Math.PI;
    return {
      ...node,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  });

  const handleNodeClick = (nodeId: string) => {
    if (onNodeClick) {
      onNodeClick(nodeId);
    }
  };

  return (
    <div className={`w-full h-96 border border-gray-200 rounded-lg bg-white ${className}`}>
      <svg width="100%" height="100%" viewBox="0 0 600 400">
        {/* Renderizar edges */}
        {data.edges.map((edge, index) => {
          const fromNode = nodesWithPositions.find(n => n.id === edge.from);
          const toNode = nodesWithPositions.find(n => n.id === edge.to);
          
          if (!fromNode || !toNode) return null;
          
          return (
            <g key={`edge-${index}`}>
              <line
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke="#94a3b8"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />
              {edge.label && (
                <text
                  x={(fromNode.x + toNode.x) / 2}
                  y={(fromNode.y + toNode.y) / 2}
                  textAnchor="middle"
                  className="text-xs fill-gray-600"
                  dy="-5"
                >
                  {edge.label}
                </text>
              )}
            </g>
          );
        })}
        
        {/* Renderizar nodes */}
        {nodesWithPositions.map((node) => (
          <g key={node.id}>
            <rect
              x={node.x - 40}
              y={node.y - 15}
              width="80"
              height="30"
              rx="6"
              fill={node.color || '#3b82f6'}
              stroke="#1e40af"
              strokeWidth="2"
              className="cursor-pointer hover:opacity-80"
              onClick={() => handleNodeClick(node.id)}
            />
            <text
              x={node.x}
              y={node.y + 5}
              textAnchor="middle"
              className="text-sm fill-white font-medium pointer-events-none"
            >
              {node.label}
            </text>
          </g>
        ))}
        
        {/* Definir marcador de flecha */}
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
              fill="#94a3b8"
            />
          </marker>
        </defs>
      </svg>
      
      {/* Información de debug */}
      <div className="p-2 text-xs text-gray-500 border-t">
        {data.nodes.length} nodos, {data.edges.length} conexiones
      </div>
    </div>
  );
}