import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import ConceptMapRenderer from '@/components/visualization/ConceptMapRenderer';

// Tipos simplificados para testing
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

export default function TestConceptMap() {
  const [inputText, setInputText] = useState(`
Implantación.
Los necesarios cambios de dependencia orgánica se llevarán a cabo de acuerdo con 
las directrices que serán emitidas por mi autoridad. En todo caso, las acciones necesarias 
para implantar la nueva organización, junto con las correspondientes adaptaciones 
orgánicas, deberán quedar completadas antes de transcurridos seis meses desde la entrada en vigor de esta instrucción.
  `.trim());
  
  const [mapData, setMapData] = useState<ConceptMapData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateTestMap = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/visualizations/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: inputText,
          useAI: true
        }),
      });
      
      if (!response.ok) {
        throw new Error('Error generando mapa');
      }
      
      const data = await response.json();
      console.log('📊 Datos del mapa recibidos:', data);
      setMapData(data);
      
    } catch (error) {
      console.error('❌ Error:', error);
      alert('Error generando mapa conceptual');
    } finally {
      setIsLoading(false);
    }
  };

  const generateSimpleMap = () => {
    // Generar mapa simple de prueba
    const testData: ConceptMapData = {
      nodes: [
        {
          id: 'central-1',
          label: 'Implantación',
          level: 'central',
          x: 600,     // ✅ Centrado en canvas más grande
          y: 450,     // ✅ Centrado en canvas más grande
          size: 0,    // ✅ Se calculará dinámicamente
          color: '#2563eb'
        },
        {
          id: 'primary-1',
          label: 'Cambios Orgánicos',
          level: 'primary',
          x: 400,     // ✅ Reposicionado
          y: 300,     // ✅ Reposicionado
          size: 0,    // ✅ Se calculará dinámicamente
          color: '#059669'
        },
        {
          id: 'primary-2',
          label: 'Directrices',
          level: 'primary',
          x: 800,     // ✅ Reposicionado
          y: 300,     // ✅ Reposicionado  
          size: 0,    // ✅ Se calculará dinámicamente
          color: '#059669'
        },
        {
          id: 'secondary-1',
          label: 'Adaptaciones',
          level: 'secondary',
          x: 300,     // ✅ Reposicionado
          y: 600,     // ✅ Reposicionado
          size: 0,    // ✅ Se calculará dinámicamente
          color: '#dc2626'
        },
        {
          id: 'secondary-2',
          label: 'Plazo 6 meses',
          level: 'secondary',
          x: 900,     // ✅ Reposicionado
          y: 600,     // ✅ Reposicionado
          size: 0,    // ✅ Se calculará dinámicamente
          color: '#dc2626'
        }
      ],
      edges: [
        {
          id: 'e1',
          source: 'central-1',
          target: 'primary-1',
          label: 'incluye'
        },
        {
          id: 'e2',
          source: 'central-1',
          target: 'primary-2',
          label: 'requiere'
        },
        {
          id: 'e3',
          source: 'primary-1',
          target: 'secondary-1',
          label: 'comprende'
        },
        {
          id: 'e4',
          source: 'primary-2',
          target: 'secondary-2',
          label: 'establece'
        }
      ],
      metadata: {
        totalNodes: 5,
        totalConnections: 4,
        complexity: 'simple',
        generatedWithAI: false
      }
    };
    
    setMapData(testData);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle>🧠 Test de Mapa Conceptual Mejorado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Input de texto */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Texto a analizar:
              </label>
              <Textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={4}
                className="w-full"
                placeholder="Pega aquí el texto para generar el mapa conceptual..."
              />
            </div>
            
            {/* Botones */}
            <div className="flex gap-3">
              <Button
                onClick={generateTestMap}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? '🔄 Generando con IA...' : '🚀 Generar con IA'}
              </Button>
              
              <Button
                onClick={generateSimpleMap}
                variant="outline"
              >
                📝 Generar Ejemplo Simple
              </Button>
            </div>
            
            {/* Estado */}
            {isLoading && (
              <div className="text-center py-4">
                <p className="text-blue-600">
                  🧠 Procesando con IA... Esto puede tomar 10-30 segundos
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Mapa conceptual */}
        {mapData && (
          <div className="bg-white rounded-lg shadow-lg p-4">
            <ConceptMapRenderer
              data={mapData}
              width={1200}
              height={900}
              onNodeClick={(node) => console.log('Click en nodo:', node)}
            />
          </div>
        )}
        
        {/* Debug info */}
        {mapData && (
          <Card>
            <CardHeader>
              <CardTitle>🔍 Información de Debug</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
                {JSON.stringify(mapData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
        
      </div>
    </div>
  );
}