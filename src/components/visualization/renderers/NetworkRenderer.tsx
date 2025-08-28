import React, { useEffect, useRef, useState } from 'react';
import { NetworkData, NetworkOptions } from '@/lib/visualizations/types';

interface NetworkRendererProps {
  data: NetworkData;
  options?: NetworkOptions;
  className?: string;
  onNodeClick?: (nodeId: string) => void;
  onEdgeClick?: (edgeId: string) => void;
}

/**
 * Renderer de redes usando vis-network con carga dinámica
 * Compatible con Next.js SSR
 */
export default function NetworkRenderer({ 
  data, 
  options = {}, 
  className = '',
  onNodeClick,
  onEdgeClick 
}: NetworkRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadVisNetwork = async () => {
      try {
        // Importación dinámica para evitar problemas con SSR
        const [{ Network }, { DataSet }] = await Promise.all([
          import('vis-network/standalone/esm/vis-network'),
          import('vis-data/esnext')
        ]);

        if (!mounted || !containerRef.current) return;

        // Preparar datos
        const nodes = new DataSet(data.nodes);
        const edges = new DataSet(data.edges);
        const networkData = { nodes, edges };

        // Opciones por defecto
        const defaultOptions = {
          nodes: {
            shape: 'box',
            margin: 10,
            font: { size: 14, color: '#333' },
            borderWidth: 2,
            shadow: true
          },
          edges: {
            font: { size: 12, align: 'middle' },
            arrows: { to: { enabled: true, scaleFactor: 1 } },
            smooth: { type: 'continuous' }
          },
          physics: {
            enabled: true,
            stabilization: { iterations: 100 }
          },
          interaction: {
            hover: true,
            selectConnectedEdges: false
          },
          layout: {
            improvedLayout: true
          }
        };

        // Combinar opciones
        const finalOptions = { ...defaultOptions, ...options };

        // Crear la red
        const network = new Network(containerRef.current, networkData, finalOptions);

        // Event listeners
        if (onNodeClick) {
          network.on('click', (params: any) => {
            if (params.nodes.length > 0) {
              onNodeClick(params.nodes[0]);
            }
          });
        }

        if (onEdgeClick) {
          network.on('click', (params: any) => {
            if (params.edges.length > 0) {
              onEdgeClick(params.edges[0]);
            }
          });
        }

        networkRef.current = network;
        setIsLoading(false);

      } catch (err: any) {
        console.error('Error cargando vis-network:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    loadVisNetwork();

    return () => {
      mounted = false;
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, [data, options, onNodeClick, onEdgeClick]);

  if (error) {
    return (
      <div className={`flex items-center justify-center h-96 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <div className="text-center">
          <div className="text-red-600 font-medium mb-2">Error al cargar la visualización</div>
          <div className="text-red-500 text-sm">{error}</div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-96 bg-gray-50 border border-gray-200 rounded-lg ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <div className="text-gray-600">Cargando visualización...</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className={`w-full h-96 border border-gray-200 rounded-lg ${className}`}
      style={{ minHeight: '400px' }}
    />
  );
}