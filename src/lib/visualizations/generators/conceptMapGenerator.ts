import { DocumentAnalysisResult, ConceptNode, ConceptLink, VisualizationData } from '../types';
import { generateId } from '../utils/textUtils';

/**
 * Generador de mapas conceptuales a partir de análisis de documentos
 */
export class ConceptMapGenerator {
  
  /**
   * Genera un mapa conceptual basado en el análisis del documento
   */
  async generateConceptMap(analysis: DocumentAnalysisResult): Promise<VisualizationData> {
    try {
      console.log(`🧠 Generando mapa conceptual para documento ${analysis.documentId}`);

      const nodes = await this.createConceptNodes(analysis);
      const links = this.createConceptLinks(analysis, nodes);
      
      // Calcular importancia y posiciones
      this.calculateNodeImportance(nodes, links);
      this.calculateNodePositions(nodes, links);

      const visualization: VisualizationData = {
        type: 'CONCEPT_MAP',
        nodes,
        edges: links,
        metadata: {
          title: `Mapa Conceptual - ${analysis.documentId}`,
          description: 'Mapa conceptual que muestra las relaciones entre los conceptos principales del documento',
          generatedAt: new Date(),
          documentId: analysis.documentId,
          complexity: this.calculateMapComplexity(nodes, links),
          confidence: analysis.confidence
        }
      };

      console.log(`✅ Mapa conceptual generado: ${nodes.length} conceptos, ${links.length} relaciones`);
      return visualization;

    } catch (error) {
      console.error('❌ Error generando mapa conceptual:', error);
      throw new Error(`Error en generación de mapa conceptual: ${error.message}`);
    }
  }

  /**
   * Crea los nodos conceptuales del mapa
   */
  private async createConceptNodes(analysis: DocumentAnalysisResult): Promise<ConceptNode[]> {
    const nodes: ConceptNode[] = [];
    const conceptFrequency: { [key: string]: number } = {};
    
    // Contar frecuencia de conceptos
    analysis.entities.forEach(entity => {
      if (entity.type === 'concept' || entity.type === 'organization' || entity.type === 'person') {
        const cleanText = this.cleanConceptText(entity.text);
        conceptFrequency[cleanText] = (conceptFrequency[cleanText] || 0) + 1;
      }
    });

    // Agregar conceptos de palabras clave de segmentos
    analysis.segments.forEach(segment => {
      segment.keywords?.forEach(keyword => {
        const cleanKeyword = this.cleanConceptText(keyword);
        if (cleanKeyword.length > 3) {
          conceptFrequency[cleanKeyword] = (conceptFrequency[cleanKeyword] || 0) + 1;
        }
      });
    });

    // Ordenar por frecuencia y tomar los más relevantes
    const sortedConcepts = Object.entries(conceptFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 15); // Máximo 15 conceptos para mantener legibilidad

    // Crear nodos
    sortedConcepts.forEach(([concept, frequency], index) => {
      const type: ConceptNode['type'] = index < 3 ? 'main' : index < 8 ? 'secondary' : 'detail';
      
      nodes.push({
        id: generateId('concept'),
        label: concept,
        type,
        description: this.getConceptDescription(concept, analysis),
        importance: frequency,
        color: this.getNodeColor(type),
        size: this.getNodeSize(type, frequency)
      });
    });

    // Si hay muy pocos conceptos, agregar algunos basados en acciones
    if (nodes.length < 5) {
      const actions = analysis.entities
        .filter(e => e.type === 'action')
        .slice(0, 3);
      
      actions.forEach(action => {
        nodes.push({
          id: generateId('concept'),
          label: this.cleanConceptText(action.text),
          type: 'secondary',
          description: `Acción: ${action.text}`,
          importance: 3,
          color: this.getNodeColor('secondary'),
          size: this.getNodeSize('secondary', 3)
        });
      });
    }

    return nodes;
  }

  /**
   * Crea las conexiones entre conceptos
   */
  private createConceptLinks(analysis: DocumentAnalysisResult, nodes: ConceptNode[]): ConceptLink[] {
    const links: ConceptLink[] = [];

    // Crear enlaces basados en relaciones detectadas
    analysis.relationships.forEach(relationship => {
      const sourceNode = this.findNodeByLabel(nodes, relationship.source);
      const targetNode = this.findNodeByLabel(nodes, relationship.target);
      
      if (sourceNode && targetNode) {
        const relationshipLabel = this.translateRelationship(relationship.type);
        
        links.push({
          id: generateId('link'),
          source: sourceNode.id,
          target: targetNode.id,
          relationship: relationshipLabel,
          strength: relationship.confidence,
          label: relationshipLabel
        });
      }
    });

    // Crear enlaces basados en co-ocurrencia en segmentos
    analysis.segments.forEach(segment => {
      if (segment.entities && segment.entities.length >= 2) {
        const segmentNodes = segment.entities
          .map(entity => this.findNodeByLabel(nodes, entity.text))
          .filter(node => node !== undefined) as ConceptNode[];

        // Conectar conceptos que aparecen en el mismo segmento
        for (let i = 0; i < segmentNodes.length - 1; i++) {
          for (let j = i + 1; j < segmentNodes.length; j++) {
            const source = segmentNodes[i];
            const target = segmentNodes[j];
            
            if (!this.linkExists(links, source.id, target.id)) {
              links.push({
                id: generateId('link'),
                source: source.id,
                target: target.id,
                relationship: 'se relaciona con',
                strength: 0.6,
                label: 'relacionado'
              });
            }
          }
        }
      }
    });

    // Crear enlaces jerárquicos entre conceptos principales y secundarios
    const mainNodes = nodes.filter(n => n.type === 'main');
    const secondaryNodes = nodes.filter(n => n.type === 'secondary');
    
    mainNodes.forEach(mainNode => {
      // Conectar con 2-3 nodos secundarios relacionados
      const relatedSecondary = secondaryNodes
        .filter(secNode => this.areConceptsRelated(mainNode.label, secNode.label))
        .slice(0, 3);
      
      relatedSecondary.forEach(secNode => {
        if (!this.linkExists(links, mainNode.id, secNode.id)) {
          links.push({
            id: generateId('link'),
            source: mainNode.id,
            target: secNode.id,
            relationship: 'incluye',
            strength: 0.8,
            label: 'incluye'
          });
        }
      });
    });

    return links;
  }

  /**
   * Calcula la importancia de cada nodo basada en sus conexiones
   */
  private calculateNodeImportance(nodes: ConceptNode[], links: ConceptLink[]): void {
    nodes.forEach(node => {
      const connectionsCount = links.filter(link => 
        link.source === node.id || link.target === node.id
      ).length;
      
      // Ajustar importancia basada en conexiones
      node.importance = (node.importance || 1) + connectionsCount * 0.5;
      
      // Recalcular tamaño basado en nueva importancia
      node.size = Math.max(20, Math.min(60, 20 + node.importance * 3));
    });
  }

  /**
   * Calcula posiciones para los nodos usando un layout básico
   */
  private calculateNodePositions(nodes: ConceptNode[], links: ConceptLink[]): void {
    const centerX = 300;
    const centerY = 200;
    const radius = 150;

    // Layout circular básico
    nodes.forEach((node, index) => {
      const angle = (index / nodes.length) * 2 * Math.PI;
      let nodeRadius = radius;

      // Nodos principales más cerca del centro
      if (node.type === 'main') {
        nodeRadius = radius * 0.6;
      } else if (node.type === 'detail') {
        nodeRadius = radius * 1.2;
      }

      node.position = {
        x: centerX + Math.cos(angle) * nodeRadius,
        y: centerY + Math.sin(angle) * nodeRadius
      };
    });

    // Ajustar posición de nodos muy conectados hacia el centro
    nodes.forEach(node => {
      const connectionCount = links.filter(link => 
        link.source === node.id || link.target === node.id
      ).length;
      
      if (connectionCount > 3) {
        const currentPos = node.position!;
        node.position = {
          x: currentPos.x + (centerX - currentPos.x) * 0.3,
          y: currentPos.y + (centerY - currentPos.y) * 0.3
        };
      }
    });
  }

  /**
   * Calcula la complejidad del mapa conceptual
   */
  private calculateMapComplexity(nodes: ConceptNode[], links: ConceptLink[]): number {
    let complexity = 0;
    
    complexity += nodes.length * 0.4;
    complexity += links.length * 0.6;
    complexity += nodes.filter(n => n.type === 'main').length * 1.5;
    
    return Math.min(complexity, 10);
  }

  /**
   * Limpia el texto de conceptos
   */
  private cleanConceptText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\sáéíóúñ]/g, '')
      .trim();
  }

  /**
   * Obtiene descripción del concepto basada en el análisis
   */
  private getConceptDescription(concept: string, analysis: DocumentAnalysisResult): string {
    // Buscar en segmentos donde aparece el concepto
    const relevantSegments = analysis.segments.filter(segment =>
      segment.content.toLowerCase().includes(concept.toLowerCase())
    );

    if (relevantSegments.length > 0) {
      return relevantSegments[0].content.substring(0, 100) + '...';
    }

    return `Concepto: ${concept}`;
  }

  /**
   * Obtiene el color del nodo según su tipo
   */
  private getNodeColor(type: ConceptNode['type']): string {
    switch (type) {
      case 'main': return '#2563eb';      // Azul
      case 'secondary': return '#059669'; // Verde
      case 'detail': return '#dc2626';    // Rojo
      default: return '#6b7280';          // Gris
    }
  }

  /**
   * Calcula el tamaño del nodo
   */
  private getNodeSize(type: ConceptNode['type'], importance: number): number {
    const baseSize = type === 'main' ? 40 : type === 'secondary' ? 30 : 20;
    return baseSize + Math.min(importance * 2, 20);
  }

  /**
   * Traduce tipos de relaciones al español
   */
  private translateRelationship(type: string): string {
    const translations = {
      'causes': 'causa',
      'includes': 'incluye',
      'follows': 'sigue a',
      'defines': 'define',
      'relates_to': 'se relaciona con',
      'part_of': 'es parte de'
    };
    
    return translations[type] || 'relacionado con';
  }

  /**
   * Busca un nodo por etiqueta similar
   */
  private findNodeByLabel(nodes: ConceptNode[], label: string): ConceptNode | undefined {
    const cleanLabel = this.cleanConceptText(label);
    return nodes.find(node => 
      this.cleanConceptText(node.label).includes(cleanLabel) ||
      cleanLabel.includes(this.cleanConceptText(node.label))
    );
  }

  /**
   * Verifica si ya existe un enlace entre dos nodos
   */
  private linkExists(links: ConceptLink[], sourceId: string, targetId: string): boolean {
    return links.some(link => 
      (link.source === sourceId && link.target === targetId) ||
      (link.source === targetId && link.target === sourceId)
    );
  }

  /**
   * Determina si dos conceptos están relacionados semánticamente
   */
  private areConceptsRelated(concept1: string, concept2: string): boolean {
    // Implementación básica - se puede mejorar con análisis semántico más avanzado
    const words1 = concept1.split(' ');
    const words2 = concept2.split(' ');
    
    return words1.some(word1 => 
      words2.some(word2 => 
        word1.length > 3 && word2.length > 3 && 
        (word1.includes(word2) || word2.includes(word1))
      )
    );
  }
} 