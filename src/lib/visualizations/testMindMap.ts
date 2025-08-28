/**
 * 🧪 Prueba del Algoritmo de Mapas Conceptuales Clásicos - OpositIA
 * Archivo para probar el nuevo algoritmo sin afectar el componente principal
 */

import { AIVisualizationService } from './aiVisualizationService';

/**
 * Función para probar el nuevo algoritmo con texto de ejemplo
 */
export async function testConceptualMindMap(content: string) {
  try {
    console.log('🧠 [TEST] Iniciando prueba del algoritmo de mapas conceptuales...');
    
    // Generar mapa conceptual con el nuevo algoritmo
    const result = await AIVisualizationService.generateConceptualMindMap(content, 'test-document');
    
    console.log('✅ [TEST] Resultado del algoritmo:', {
      type: result.type,
      title: result.metadata.title,
      description: result.metadata.description,
      nodesCount: result.nodes.length,
      edgesCount: result.edges?.length || 0,
      complexity: result.metadata.complexity,
      confidence: result.metadata.confidence
    });
    
    // Mostrar algunos nodos de ejemplo
    if (result.nodes.length > 0) {
      console.log('🔍 [TEST] Primeros 5 nodos:', 
        result.nodes.slice(0, 5).map((node: any) => ({
          id: node.id,
          label: node.label,
          type: node.type,
          category: node.category,
          importance: node.importance
        }))
      );
    }
    
    // Mostrar algunas conexiones de ejemplo
    if (result.edges && result.edges.length > 0) {
      console.log('🔗 [TEST] Primeras 5 conexiones:', 
        result.edges.slice(0, 5).map((edge: any) => ({
          id: edge.id,
          from: edge.source,
          to: edge.target,
          label: edge.label,
          relationship: edge.relationship
        }))
      );
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ [TEST] Error en la prueba:', error);
    throw error;
  }
}

/**
 * Función para usar en el navegador/consola
 */
export function testWithSampleText() {
  const sampleText = `
CAPÍTULO I
**El Cuartel General**

**Artículo 1.** "Organización del Cuartel General de la Armada."

1. El Cuartel General de la Armada (CGA) incluye:
1) El Estado Mayor de la Armada.
1) El Gabinete del Almirante Jefe de Estado Mayor de la Armada.
1) Los Órganos de Apoyo a la Acción Orgánica.
1) La Jefatura de Servicios Generales y Asistencia Técnica.
1) El Instituto de Historia y Cultura Naval.
1) La Asesoría Jurídica de la Armada.
1) El Tribunal Marítimo Central.
2. Dentro del Cuartel General de la Armada se encuentra la Intervención Delegada.

Central en la Armada. Constituye el órgano de control económico y financiero que atiende el control interno de la Armada, ejerciendo las funciones de intervención, contabilidad y control económico-patrimonial.
`;

  return testConceptualMindMap(sampleText);
}

// Función auxiliar para mostrar estadísticas detalladas
export function analyzeTestResults(result: any) {
  console.log('📊 [ANÁLISIS] Estadísticas detalladas del mapa conceptual:');
  
  // Contar tipos de nodos
  const nodeTypes = result.nodes.reduce((acc: any, node: any) => {
    acc[node.type] = (acc[node.type] || 0) + 1;
    return acc;
  }, {});
  
  console.log('🏷️ Tipos de nodos:', nodeTypes);
  
  // Contar categorías
  const categories = result.nodes.reduce((acc: any, node: any) => {
    acc[node.category] = (acc[node.category] || 0) + 1;
    return acc;
  }, {});
  
  console.log('📂 Categorías:', categories);
  
  // Mostrar distribución de importancia
  const importanceLevels = result.nodes.reduce((acc: any, node: any) => {
    const level = node.importance || 0;
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {});
  
  console.log('⭐ Niveles de importancia:', importanceLevels);
  
  // Analizar conectividad
  if (result.edges && result.edges.length > 0) {
    const connectionTypes = result.edges.reduce((acc: any, edge: any) => {
      acc[edge.relationship] = (acc[edge.relationship] || 0) + 1;
      return acc;
    }, {});
    
    console.log('🔗 Tipos de relaciones:', connectionTypes);
  }
  
  return {
    summary: {
      totalNodes: result.nodes.length,
      totalEdges: result.edges?.length || 0,
      nodeTypes,
      categories,
      importanceLevels,
      connectionTypes: result.edges ? result.edges.reduce((acc: any, edge: any) => {
        acc[edge.relationship] = (acc[edge.relationship] || 0) + 1;
        return acc;
      }, {}) : {}
    }
  };
} 