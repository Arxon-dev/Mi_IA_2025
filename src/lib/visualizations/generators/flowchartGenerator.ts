import { DocumentAnalysisResult, FlowchartNode, FlowchartEdge, VisualizationData } from '../types';
import { generateId } from '../utils/textUtils';

/**
 * Generador de diagramas de flujo a partir de análisis de documentos
 */
export class FlowchartGenerator {
  
  /**
   * Genera un diagrama de flujo basado en el análisis del documento
   */
  async generateFlowchart(analysis: DocumentAnalysisResult): Promise<VisualizationData> {
    try {
      console.log(`🔄 Generando diagrama de flujo para documento ${analysis.documentId}`);

      const nodes = await this.createFlowchartNodes(analysis);
      const edges = this.createFlowchartEdges(analysis, nodes);
      
      // Calcular posiciones básicas para el layout
      this.calculateNodePositions(nodes, edges);

      const visualization: VisualizationData = {
        type: 'FLOWCHART',
        nodes,
        edges,
        metadata: {
          title: `Diagrama de Flujo - ${analysis.documentId}`,
          description: 'Diagrama de flujo generado automáticamente del proceso identificado en el documento',
          generatedAt: new Date(),
          documentId: analysis.documentId,
          complexity: this.calculateFlowchartComplexity(nodes, edges),
          confidence: Math.min(analysis.confidence + 0.1, 1.0) // Ligero boost para flowcharts
        }
      };

      console.log(`✅ Diagrama de flujo generado: ${nodes.length} nodos, ${edges.length} conexiones`);
      return visualization;

    } catch (error) {
      console.error('❌ Error generando diagrama de flujo:', error);
      throw new Error(`Error en generación de flowchart: ${error.message}`);
    }
  }

  /**
   * Crea los nodos del diagrama de flujo
   */
  private async createFlowchartNodes(analysis: DocumentAnalysisResult): Promise<FlowchartNode[]> {
    const nodes: FlowchartNode[] = [];
    
    // Nodo de inicio
    nodes.push({
      id: generateId('start'),
      type: 'start',
      label: 'Inicio',
      description: 'Punto de entrada del proceso'
    });

    // Extraer acciones y decisiones de los segmentos
    for (const segment of analysis.segments) {
      const actionEntities = segment.entities?.filter(e => e.type === 'action') || [];
      const hasDecisionWords = this.containsDecisionWords(segment.content);

      if (actionEntities.length > 0) {
        // Crear nodos de proceso para acciones
        for (const action of actionEntities) {
          nodes.push({
            id: generateId('process'),
            type: 'process',
            label: this.cleanActionLabel(action.text),
            description: segment.content.substring(0, 100) + '...'
          });
        }
      } else if (hasDecisionWords) {
        // Crear nodo de decisión
        nodes.push({
          id: generateId('decision'),
          type: 'decision',
          label: this.extractDecisionLabel(segment.content),
          description: segment.content
        });
      } else if (segment.entities && segment.entities.length > 0) {
        // Crear nodo de proceso genérico
        const mainConcept = segment.entities[0];
        nodes.push({
          id: generateId('process'),
          type: 'process',
          label: this.cleanActionLabel(mainConcept.text),
          description: segment.content.substring(0, 100) + '...'
        });
      }
    }

    // Nodo de fin
    nodes.push({
      id: generateId('end'),
      type: 'end',
      label: 'Fin',
      description: 'Finalización del proceso'
    });

    // Si hay muy pocos nodos, crear algunos genéricos basados en los temas principales
    if (nodes.length < 4) {
      const topics = analysis.entities
        .filter(e => e.type === 'concept')
        .slice(0, 3);
      
      for (const topic of topics) {
        nodes.push({
          id: generateId('process'),
          type: 'process',
          label: this.cleanActionLabel(topic.text),
          description: `Proceso relacionado con ${topic.text}`
        });
      }
    }

    return nodes;
  }

  /**
   * Crea las conexiones entre nodos
   */
  private createFlowchartEdges(analysis: DocumentAnalysisResult, nodes: FlowchartNode[]): FlowchartEdge[] {
    const edges: FlowchartEdge[] = [];
    
    // Conexiones secuenciales básicas
    for (let i = 0; i < nodes.length - 1; i++) {
      const sourceNode = nodes[i];
      const targetNode = nodes[i + 1];
      
      let label = '';
      
      // Etiquetas especiales para decisiones
      if (sourceNode.type === 'decision') {
        label = i % 2 === 0 ? 'Sí' : 'No';
      }

      edges.push({
        id: generateId('edge'),
        source: sourceNode.id,
        target: targetNode.id,
        label
      });
    }

    // Buscar relaciones adicionales basadas en el análisis
    const followsRelations = analysis.relationships.filter(r => r.type === 'follows');
    
    for (const relation of followsRelations.slice(0, 3)) { // Limitar para evitar complejidad excesiva
      const sourceNode = this.findNodeByLabel(nodes, relation.source);
      const targetNode = this.findNodeByLabel(nodes, relation.target);
      
      if (sourceNode && targetNode && !this.edgeExists(edges, sourceNode.id, targetNode.id)) {
        edges.push({
          id: generateId('edge'),
          source: sourceNode.id,
          target: targetNode.id,
          label: 'continúa'
        });
      }
    }

    return edges;
  }

  /**
   * Calcula posiciones básicas para los nodos
   */
  private calculateNodePositions(nodes: FlowchartNode[], edges: FlowchartEdge[]): void {
    const startY = 50;
    const verticalSpacing = 120;
    const horizontalCenter = 200;
    
    // Layout vertical simple
    nodes.forEach((node, index) => {
      node.position = {
        x: horizontalCenter + (index % 2 === 0 ? 0 : 100), // Alternar posición
        y: startY + (index * verticalSpacing)
      };
    });

    // Ajustar nodos de decisión para layout en diamante
    nodes.forEach(node => {
      if (node.type === 'decision') {
        node.position!.x = horizontalCenter + 50;
      }
    });
  }

  /**
   * Calcula la complejidad del diagrama de flujo
   */
  private calculateFlowchartComplexity(nodes: FlowchartNode[], edges: FlowchartEdge[]): number {
    let complexity = 0;
    
    // Factores de complejidad
    complexity += nodes.length * 0.5; // Número de nodos
    complexity += edges.length * 0.3; // Número de conexiones
    complexity += nodes.filter(n => n.type === 'decision').length * 2; // Decisiones añaden complejidad
    
    return Math.min(complexity, 10);
  }

  /**
   * Verifica si un segmento contiene palabras de decisión
   */
  private containsDecisionWords(content: string): boolean {
    const decisionWords = ['si', 'entonces', 'cuando', 'en caso', 'depende', 'opción', 'elegir'];
    const lowerContent = content.toLowerCase();
    return decisionWords.some(word => lowerContent.includes(word));
  }

  /**
   * Extrae una etiqueta de decisión del contenido
   */
  private extractDecisionLabel(content: string): string {
    // Buscar patrones como "Si X entonces..."
    const siMatch = content.match(/si\s+([^,?.]+)/i);
    if (siMatch) {
      return `¿${siMatch[1].trim()}?`;
    }
    
    // Buscar patrones como "Cuando X..."
    const cuandoMatch = content.match(/cuando\s+([^,?.]+)/i);
    if (cuandoMatch) {
      return `¿${cuandoMatch[1].trim()}?`;
    }
    
    // Etiqueta genérica
    return 'Decisión';
  }

  /**
   * Limpia y formatea las etiquetas de acción
   */
  private cleanActionLabel(text: string): string {
    return text
      .replace(/^(el|la|los|las|un|una)\s+/i, '')
      .replace(/[^\w\sáéíóúñ]/g, '')
      .trim()
      .split(' ')
      .slice(0, 3) // Máximo 3 palabras
      .join(' ');
  }

  /**
   * Busca un nodo por su etiqueta
   */
  private findNodeByLabel(nodes: FlowchartNode[], label: string): FlowchartNode | undefined {
    return nodes.find(node => 
      node.label.toLowerCase().includes(label.toLowerCase()) ||
      label.toLowerCase().includes(node.label.toLowerCase())
    );
  }

  /**
   * Verifica si ya existe una conexión entre dos nodos
   */
  private edgeExists(edges: FlowchartEdge[], sourceId: string, targetId: string): boolean {
    return edges.some(edge => 
      edge.source === sourceId && edge.target === targetId
    );
  }
} 