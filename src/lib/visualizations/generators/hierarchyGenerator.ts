import { DocumentAnalysisResult, HierarchyNode, VisualizationData } from '../types';
import { generateId } from '../utils/textUtils';

/**
 * Generador de esquemas jerárquicos a partir de análisis de documentos
 */
export class HierarchyGenerator {
  
  /**
   * Genera un esquema jerárquico basado en el análisis del documento
   */
  async generateHierarchy(analysis: DocumentAnalysisResult): Promise<VisualizationData> {
    try {
      console.log(`🌳 Generando esquema jerárquico para documento ${analysis.documentId}`);

      const nodes = await this.createHierarchyNodes(analysis);
      this.establishParentChildRelations(nodes);
      this.calculateNodePositions(nodes);

      const visualization: VisualizationData = {
        type: 'HIERARCHICAL_SCHEME',
        nodes,
        edges: [], // Las jerarquías usan relaciones parent/child en lugar de edges
        metadata: {
          title: `Esquema Jerárquico - ${analysis.documentId}`,
          description: 'Esquema jerárquico que organiza la información del documento en una estructura de árbol',
          generatedAt: new Date(),
          documentId: analysis.documentId,
          complexity: this.calculateHierarchyComplexity(nodes),
          confidence: analysis.confidence
        }
      };

      console.log(`✅ Esquema jerárquico generado: ${nodes.length} nodos, ${this.countLevels(nodes)} niveles`);
      return visualization;

    } catch (error) {
      console.error('❌ Error generando esquema jerárquico:', error);
      throw new Error(`Error en generación de jerarquía: ${error.message}`);
    }
  }

  /**
   * Crea los nodos jerárquicos del esquema
   */
  private async createHierarchyNodes(analysis: DocumentAnalysisResult): Promise<HierarchyNode[]> {
    const nodes: HierarchyNode[] = [];
    let nodeOrder = 0;

    // 1. Crear nodo raíz basado en el tema principal
    const mainTopics = this.extractMainTopics(analysis);
    const rootTopic = mainTopics[0] || 'Documento';
    
    const rootNode: HierarchyNode = {
      id: generateId('root'),
      label: rootTopic,
      level: 0,
      description: `Tema principal del documento`,
      order: nodeOrder++
    };
    nodes.push(rootNode);

    // 2. Crear nodos de nivel 1 basados en segmentos de encabezado
    const headingSegments = analysis.segments.filter(s => s.type === 'heading');
    
    if (headingSegments.length > 0) {
      headingSegments.forEach((segment, index) => {
        const level = segment.level || 1;
        nodes.push({
          id: generateId('heading'),
          label: this.cleanHeadingText(segment.content),
          level: Math.min(level, 3), // Máximo 3 niveles de profundidad
          description: segment.content,
          order: nodeOrder++
        });
      });
    } else {
      // Si no hay encabezados, crear secciones basadas en conceptos principales
      const mainConcepts = analysis.entities
        .filter(e => e.type === 'concept' || e.type === 'organization')
        .slice(0, 5);
      
      mainConcepts.forEach((concept, index) => {
        nodes.push({
          id: generateId('concept'),
          label: concept.text,
          level: 1,
          description: this.getConceptDescription(concept.text, analysis),
          order: nodeOrder++
        });
      });
    }

    // 3. Crear subnodos basados en relaciones jerárquicas detectadas
    const includesRelations = analysis.relationships.filter(r => 
      r.type === 'includes' || r.type === 'part_of'
    );

    includesRelations.forEach(relation => {
      const parentExists = nodes.some(n => 
        n.label.toLowerCase().includes(relation.source.toLowerCase())
      );
      
      if (parentExists) {
        nodes.push({
          id: generateId('sub'),
          label: relation.target,
          level: 2,
          description: `Parte de: ${relation.source}`,
          order: nodeOrder++
        });
      }
    });

    // 4. Agregar nodos de detalle basados en listas
    const listSegments = analysis.segments.filter(s => s.type === 'list');
    
    listSegments.slice(0, 10).forEach((segment, index) => { // Limitar para evitar sobrecarga
      const listItem = this.extractListItem(segment.content);
      if (listItem) {
        nodes.push({
          id: generateId('detail'),
          label: listItem,
          level: 3,
          description: segment.content,
          order: nodeOrder++
        });
      }
    });

    return nodes;
  }

  /**
   * Establece las relaciones parent-child entre nodos
   */
  private establishParentChildRelations(nodes: HierarchyNode[]): void {
    // Organizar nodos por nivel
    const nodesByLevel = this.groupNodesByLevel(nodes);
    
    // Para cada nivel, asignar padres del nivel anterior
    for (let level = 1; level <= 3; level++) {
      const currentLevelNodes = nodesByLevel[level] || [];
      const parentLevelNodes = nodesByLevel[level - 1] || [];
      
      if (parentLevelNodes.length === 0) continue;
      
      currentLevelNodes.forEach((node, index) => {
        // Asignar padre de manera inteligente
        const parent = this.findBestParent(node, parentLevelNodes);
        if (parent) {
          node.parent = parent.id;
          
          // Actualizar children del padre
          if (!parent.children) {
            parent.children = [];
          }
          parent.children.push(node.id);
        }
      });
    }
  }

  /**
   * Calcula posiciones para renderizado del árbol
   */
  private calculateNodePositions(nodes: HierarchyNode[]): void {
    const levelSpacing = 150;
    const nodeSpacing = 100;
    const startX = 50;
    const startY = 50;

    // Agrupar por nivel para cálculo de posiciones
    const nodesByLevel = this.groupNodesByLevel(nodes);
    
    Object.keys(nodesByLevel).forEach(levelStr => {
      const level = parseInt(levelStr);
      const levelNodes = nodesByLevel[level];
      
      levelNodes.forEach((node, index) => {
        // Posición Y basada en el nivel
        const y = startY + (level * levelSpacing);
        
        // Posición X distribuida equitativamente en el nivel
        const totalWidth = Math.max(800, levelNodes.length * nodeSpacing);
        const x = startX + (index * (totalWidth / levelNodes.length));
        
        (node as any).position = { x, y };
      });
    });
  }

  /**
   * Extrae los temas principales del análisis
   */
  private extractMainTopics(analysis: DocumentAnalysisResult): string[] {
    // Priorizar conceptos con alta frecuencia
    const conceptFrequency: { [key: string]: number } = {};
    
    analysis.entities.forEach(entity => {
      if (entity.type === 'concept' || entity.type === 'organization') {
        conceptFrequency[entity.text] = (conceptFrequency[entity.text] || 0) + 1;
      }
    });

    return Object.entries(conceptFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([concept]) => concept);
  }

  /**
   * Limpia el texto de encabezados
   */
  private cleanHeadingText(text: string): string {
    return text
      .replace(/^#+\s*/, '') // Remover símbolos de markdown
      .replace(/[^\w\sáéíóúñ]/g, '')
      .trim();
  }

  /**
   * Obtiene descripción del concepto
   */
  private getConceptDescription(concept: string, analysis: DocumentAnalysisResult): string {
    const relevantSegments = analysis.segments.filter(segment =>
      segment.content.toLowerCase().includes(concept.toLowerCase())
    );

    if (relevantSegments.length > 0) {
      return relevantSegments[0].content.substring(0, 120) + '...';
    }

    return `Concepto: ${concept}`;
  }

  /**
   * Extrae elemento de lista del contenido
   */
  private extractListItem(content: string): string | null {
    // Remover marcadores de lista
    const cleaned = content
      .replace(/^[\d]+\.\s*/, '') // Números
      .replace(/^[•\-*]\s*/, '')  // Viñetas
      .trim();
    
    if (cleaned.length > 5 && cleaned.length < 100) {
      return cleaned;
    }
    
    return null;
  }

  /**
   * Agrupa nodos por nivel
   */
  private groupNodesByLevel(nodes: HierarchyNode[]): { [level: number]: HierarchyNode[] } {
    const grouped: { [level: number]: HierarchyNode[] } = {};
    
    nodes.forEach(node => {
      if (!grouped[node.level]) {
        grouped[node.level] = [];
      }
      grouped[node.level].push(node);
    });
    
    // Ordenar cada nivel por orden
    Object.keys(grouped).forEach(level => {
      grouped[parseInt(level)].sort((a, b) => a.order - b.order);
    });
    
    return grouped;
  }

  /**
   * Encuentra el mejor padre para un nodo
   */
  private findBestParent(node: HierarchyNode, potentialParents: HierarchyNode[]): HierarchyNode | null {
    if (potentialParents.length === 0) return null;
    
    // Buscar padre por similitud semántica
    const nodeWords = node.label.toLowerCase().split(' ');
    
    let bestParent: HierarchyNode | null = null;
    let bestScore = 0;
    
    potentialParents.forEach(parent => {
      const parentWords = parent.label.toLowerCase().split(' ');
      
      // Calcular similitud básica
      let score = 0;
      nodeWords.forEach(word => {
        if (parentWords.some(pWord => pWord.includes(word) || word.includes(pWord))) {
          score += 1;
        }
      });
      
      if (score > bestScore) {
        bestScore = score;
        bestParent = parent;
      }
    });
    
    // Si no hay similitud semántica, asignar al primer padre disponible con menos hijos
    if (!bestParent && potentialParents.length > 0) {
      bestParent = potentialParents.reduce((prev, current) => 
        (prev.children?.length || 0) <= (current.children?.length || 0) ? prev : current
      );
    }
    
    return bestParent;
  }

  /**
   * Cuenta el número de niveles en la jerarquía
   */
  private countLevels(nodes: HierarchyNode[]): number {
    return Math.max(...nodes.map(n => n.level)) + 1;
  }

  /**
   * Calcula la complejidad de la jerarquía
   */
  private calculateHierarchyComplexity(nodes: HierarchyNode[]): number {
    let complexity = 0;
    
    complexity += nodes.length * 0.3;
    complexity += this.countLevels(nodes) * 1.5;
    complexity += nodes.filter(n => n.children && n.children.length > 3).length * 2;
    
    return Math.min(complexity, 10);
  }
} 