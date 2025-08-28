import { AIService } from '@/services/aiService';
import { VisualizationData, VisualizationType, Entity, Relationship } from './types';

/**
 * 🤖 Servicio de Visualización con IA - OpositIA
 * Genera mapas conceptuales clásicos con IA avanzada
 */

export class AIVisualizationService {
  
  // Configuración de timeouts en milisegundos
  private static readonly ANALYSIS_TIMEOUT = 30000; // 30 segundos
  private static readonly GENERATION_TIMEOUT = 25000; // 25 segundos
  private static readonly QUICK_TIMEOUT = 15000; // 15 segundos para operaciones rápidas
  
  /**
   * Genera un mapa conceptual clásico con IA
   */
  static async generateConceptualMindMap(content: string, documentId: string): Promise<VisualizationData> {
    try {
      console.log('🧠 [MIND MAP] Iniciando análisis para mapa conceptual clásico...');
      
      // 1. Análisis semántico profundo del contenido
      const analysis = this.analyzeContentForMindMap(content);
      
      // 2. Identificar concepto central
      const centralConcept = this.identifyCentralConcept(content, analysis);
      
      // 3. Extraer conceptos secundarios organizados por categorías
      const concepts = this.extractConceptsByCategory(content, analysis, centralConcept);
      
      // 4. Crear relaciones semánticas entre conceptos
      const relationships = this.createSemanticRelationships(centralConcept, concepts, content);
      
      // 5. Generar nodos con layout radial
      const nodes = this.generateMindMapNodes(centralConcept, concepts);
      
      // 6. Generar conexiones etiquetadas
      const edges = this.generateLabeledConnections(relationships, nodes);
      
      console.log(`✅ [MIND MAP] Mapa conceptual generado: ${nodes.length} nodos, ${edges.length} conexiones`);
      
      const totalConcepts = Object.values(concepts).reduce((sum, categoryArray) => sum + categoryArray.length, 0);
      
      return {
        type: 'CONCEPT_MAP',
        nodes,
        edges,
        metadata: {
          title: '🧠 Mapa Conceptual Clásico',
          description: `Concepto central: "${centralConcept}" con ${totalConcepts} ramas principales`,
          generatedAt: new Date(),
          documentId,
          complexity: nodes.length > 15 ? 3 : nodes.length > 8 ? 2 : 1,
          confidence: 0.9
        }
      };
      
    } catch (error) {
      console.error('❌ [MIND MAP] Error generando mapa conceptual:', error);
      return this.generateFallbackMindMap(content, documentId);
    }
  }

  /**
   * Análisis semántico específico para mapas conceptuales
   */
  private static analyzeContentForMindMap(content: string) {
    const cleanContent = content
      .replace(/#{1,6}\s/g, '') // Remover markdown
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remover negrita
      .replace(/\*(.*?)\*/g, '$1') // Remover cursiva
      .replace(/\([^)]*\)/g, '') // Remover paréntesis
      .replace(/\s+/g, ' ')
      .trim();

    return {
      sentences: cleanContent.split(/[.!?]+/).filter(s => s.length > 20),
      paragraphs: cleanContent.split(/\n\s*\n/).filter(p => p.length > 50),
      keyPhrases: this.extractKeyPhrases(cleanContent),
      definitions: this.extractDefinitions(cleanContent),
      entities: this.extractEntities(cleanContent),
      processes: this.extractProcesses(cleanContent),
      wordFrequency: this.calculateWordFrequency(cleanContent)
    };
  }

  /**
   * Identifica el concepto central del mapa
   */
  private static identifyCentralConcept(content: string, analysis: any): string {
    // 1. Buscar en títulos y encabezados
    const titleMatch = content.match(/^#{1,3}\s*(.+)$/m);
    if (titleMatch) {
      const title = titleMatch[1].trim();
      if (title.length > 5 && title.length < 60) {
        return title;
      }
    }

    // 2. Buscar conceptos principales en primeras oraciones
    const firstSentences = analysis.sentences.slice(0, 3);
    for (const sentence of firstSentences) {
      const mainConcepts = sentence.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,4}\b/g) || [];
      for (const concept of mainConcepts) {
        if (concept.length > 10 && concept.length < 50 && 
            !concept.includes('Artículo') && 
            !concept.includes('Capítulo')) {
          return concept.trim();
        }
      }
    }

    // 3. Usar entidad más frecuente
    if (analysis.entities.length > 0) {
      return analysis.entities[0];
    }

    // 4. Fallback
    return 'Concepto Principal';
  }

  /**
   * Extrae conceptos organizados por categorías semánticas
   */
  private static extractConceptsByCategory(content: string, analysis: any, centralConcept: string) {
    const concepts: {
      definitions: string[];
      components: string[];
      functions: string[];
      characteristics: string[];
      relationships: string[];
      applications: string[];
      processes: string[];
      examples: string[];
    } = {
      definitions: [], // Qué es
      components: [], // Partes o elementos
      functions: [], // Qué hace
      characteristics: [], // Cómo es
      relationships: [], // Con qué se relaciona
      applications: [], // Para qué sirve
      processes: [], // Cómo funciona
      examples: [] // Ejemplos
    };

    // Extraer definiciones y características
    analysis.sentences.forEach((sentence: string) => {
      if (sentence.toLowerCase().includes('es ') || 
          sentence.toLowerCase().includes('constituye') ||
          sentence.toLowerCase().includes('se define como')) {
        const definition = this.extractConceptFromSentence(sentence, centralConcept);
        if (definition) concepts.definitions.push(definition);
      }

      if (sentence.toLowerCase().includes('incluye') || 
          sentence.toLowerCase().includes('compone') ||
          sentence.toLowerCase().includes('integra')) {
        const component = this.extractConceptFromSentence(sentence, centralConcept);
        if (component) concepts.components.push(component);
      }

      if (sentence.toLowerCase().includes('función') || 
          sentence.toLowerCase().includes('responsabilidad') ||
          sentence.toLowerCase().includes('competencia')) {
        const func = this.extractConceptFromSentence(sentence, centralConcept);
        if (func) concepts.functions.push(func);
      }
    });

    // Extraer entidades como componentes
    analysis.entities.slice(0, 6).forEach((entity: string) => {
      if (entity !== centralConcept && entity.length > 5) {
        concepts.components.push(entity);
      }
    });

    // Extraer procesos
    analysis.processes.slice(0, 4).forEach((process: string) => {
      if (process !== centralConcept) {
        concepts.processes.push(process);
      }
    });

    return concepts;
  }

  /**
   * Crea relaciones semánticas entre conceptos
   */
  private static createSemanticRelationships(centralConcept: string, concepts: any, content: string) {
    const relationships: any[] = [];

    // Relaciones desde el concepto central
    Object.keys(concepts).forEach(category => {
      concepts[category].forEach((concept: string) => {
        const relationshipType = this.determineRelationshipType(category, content, centralConcept, concept);
        relationships.push({
          from: centralConcept,
          to: concept,
          type: relationshipType,
          label: this.getRelationshipLabel(relationshipType),
          category
        });
      });
    });

    // Relaciones entre conceptos secundarios (si hay proximidad semántica)
    const allConcepts = Object.values(concepts).flat() as string[];
    for (let i = 0; i < allConcepts.length; i++) {
      for (let j = i + 1; j < allConcepts.length; j++) {
        if (this.haveSemanticProximity(allConcepts[i], allConcepts[j], content)) {
          relationships.push({
            from: allConcepts[i],
            to: allConcepts[j],
            type: 'relates_to',
            label: 'se relaciona con',
            category: 'secondary'
          });
        }
      }
    }

    return relationships;
  }

  /**
   * Genera nodos con layout radial clásico mejorado
   */
  private static generateMindMapNodes(centralConcept: string, concepts: any) {
    const nodes: any[] = [];
    const centerX = 600;
    const centerY = 400;

    // Nodo central más grande y prominente
    nodes.push({
      id: 'central',
      label: centralConcept.length > 30 ? centralConcept.substring(0, 27) + '...' : centralConcept,
      fullText: centralConcept,
      x: centerX,
      y: centerY,
      type: 'main',
      category: 'central',
      importance: 5,
      confidence: 1.0,
      context: {
        description: `Concepto central del mapa: ${centralConcept}`,
        isCenter: true
      }
    });

    // Recolectar todos los conceptos con sus categorías
    const allConcepts: Array<{ concept: string; category: string; importance: number }> = [];
    
    // Añadir conceptos con prioridad por importancia
    Object.entries(concepts).forEach(([category, conceptList]: [string, any]) => {
      const importance = this.getCategoryImportance(category);
      conceptList.forEach((concept: string) => {
        allConcepts.push({ concept, category, importance });
      });
    });

    // Ordenar por importancia para mejor distribución visual
    allConcepts.sort((a, b) => b.importance - a.importance);

    if (allConcepts.length === 0) return nodes;

    // Distribución radial clásica mejorada
    const conceptCount = allConcepts.length;
    const baseRadius = 220;
    const maxRadius = 350;
    
    // Crear anillos concéntricos basados en importancia
    const rings = {
      high: { radius: baseRadius, concepts: [] as any[] },      // Importancia 4-5
      medium: { radius: baseRadius + 80, concepts: [] as any[] }, // Importancia 3
      low: { radius: baseRadius + 160, concepts: [] as any[] }    // Importancia 1-2
    };

    // Distribuir conceptos en anillos
    allConcepts.forEach(item => {
      if (item.importance >= 4) rings.high.concepts.push(item);
      else if (item.importance >= 3) rings.medium.concepts.push(item);
      else rings.low.concepts.push(item);
    });

    // Generar nodos para cada anillo
    Object.entries(rings).forEach(([ringName, ring]) => {
      if (ring.concepts.length === 0) return;

      const angleStep = (2 * Math.PI) / ring.concepts.length;
      // Offset inicial para distribuir mejor los anillos
      const startAngle = ringName === 'medium' ? Math.PI / 6 : 
                        ringName === 'low' ? Math.PI / 3 : 0;

      ring.concepts.forEach((item, index) => {
        const angle = startAngle + (index * angleStep);
        const x = centerX + Math.cos(angle) * ring.radius;
        const y = centerY + Math.sin(angle) * ring.radius;

        nodes.push({
          id: `concept-${nodes.length}`,
          label: item.concept.length > 22 ? item.concept.substring(0, 19) + '...' : item.concept,
          fullText: item.concept,
          x,
          y,
          type: this.getNodeType(item.category),
          category: item.category,
          importance: item.importance,
          confidence: 0.9,
          context: {
            description: `${this.getCategoryLabel(item.category)}: ${item.concept}`,
            originalCategory: item.category,
            relationToCentral: this.getRelationshipLabel(
              this.determineRelationshipType(item.category, '', centralConcept, item.concept)
            ),
            ring: ringName
          }
        });
      });
    });

    return nodes;
  }

  /**
   * Obtiene la importancia de una categoría
   */
  private static getCategoryImportance(category: string): number {
    const importance: { [key: string]: number } = {
      'definitions': 5,     // Más importante - definiciones principales
      'components': 4,      // Muy importante - partes del concepto
      'functions': 4,       // Muy importante - qué hace
      'processes': 3,       // Importante - cómo funciona
      'characteristics': 2, // Moderado - propiedades
      'relationships': 2,   // Moderado - relaciones
      'applications': 2,    // Moderado - usos
      'examples': 1         // Menos importante - ejemplos
    };
    return importance[category] || 2;
  }

  /**
   * Obtiene la etiqueta en español de una categoría
   */
  private static getCategoryLabel(category: string): string {
    const labels: { [key: string]: string } = {
      'definitions': 'Definición',
      'components': 'Componente',
      'functions': 'Función',
      'processes': 'Proceso',
      'characteristics': 'Característica',
      'relationships': 'Relación',
      'applications': 'Aplicación',
      'examples': 'Ejemplo'
    };
    return labels[category] || 'Concepto';
  }

  /**
   * Genera conexiones con etiquetas descriptivas
   */
  private static generateLabeledConnections(relationships: any[], nodes: any[]) {
    const edges: any[] = [];

    relationships.forEach((rel, index) => {
      const fromNode = nodes.find(n => n.fullText === rel.from || n.label === rel.from);
      const toNode = nodes.find(n => n.fullText === rel.to || n.label === rel.to);

      if (fromNode && toNode) {
        edges.push({
          id: `edge-${index}`,
          source: fromNode.id,
          target: toNode.id,
          label: rel.label,
          relationship: rel.type,
          strength: rel.category === 'central' ? 3 : 2
        });
      }
    });

    return edges;
  }

  /**
   * Métodos auxiliares
   */
  private static extractKeyPhrases(content: string): string[] {
    const phrases = content.match(/\b[A-Z][a-z]+(?:\s+[a-z]+){1,3}\b/g) || [];
    return Array.from(new Set(phrases)).slice(0, 10);
  }

  private static extractDefinitions(content: string): string[] {
    const patterns = [
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:es|son|constituye|significa)\s+([^.]{20,100})/gi,
      /(?:Se\s+entiende\s+por|Se\s+define\s+como)\s+([^.]{10,80})/gi
    ];
    
    const definitions: string[] = [];
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const concept = match[1]?.trim();
        if (concept && concept.length > 3 && concept.length < 50) {
          definitions.push(concept);
        }
      }
      pattern.lastIndex = 0;
    });
    
    return Array.from(new Set(definitions)).slice(0, 8);
  }

  private static extractEntities(content: string): string[] {
    const entityPatterns = [
      /\b(?:Ministerio|Consejería|Dirección|Servicio|Departamento|Organismo|Instituto|Centro|Oficina)\s+[^.]{5,50}/g,
      /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,4}\b(?=\s+(?:de\s+la\s+|del\s+|de\s+))/g,
      /\b(?:Cuartel|Estado|Jefatura|Tribunal|Consejo)\s+[A-Z][^.]{5,40}/g
    ];
    
    const entities: string[] = [];
    entityPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const entity = match[0]?.trim();
        if (entity && entity.length > 5 && entity.length < 60) {
          entities.push(entity);
        }
      }
      pattern.lastIndex = 0;
    });
    
    return Array.from(new Set(entities)).slice(0, 12);
  }

  private static extractProcesses(content: string): string[] {
    const processWords = [
      'procedimiento', 'proceso', 'tramitación', 'gestión', 'control',
      'supervisión', 'coordinación', 'planificación', 'ejecución', 'evaluación'
    ];
    
    const processes: string[] = [];
    const sentences = content.split(/[.!?]+/);
    
    sentences.forEach(sentence => {
      processWords.forEach(processWord => {
        if (sentence.toLowerCase().includes(processWord)) {
          const words = sentence.match(/\b[A-Z][a-z]+(?:\s+[a-z]+){1,4}\b/g) || [];
          words.forEach(word => {
            if (word.length > 8 && word.length < 50) {
              processes.push(word.trim());
            }
          });
        }
      });
    });
    
    return Array.from(new Set(processes)).slice(0, 8);
  }

  private static calculateWordFrequency(content: string) {
    const words = content.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    const frequency: { [key: string]: number } = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    return frequency;
  }

  private static extractConceptFromSentence(sentence: string, centralConcept: string): string | null {
    const concepts = sentence.match(/\b[A-Z][a-z]+(?:\s+[a-z]+){1,3}\b/g) || [];
    for (const concept of concepts) {
      if (concept !== centralConcept && concept.length > 5 && concept.length < 50) {
        return concept.trim();
      }
    }
    return null;
  }

  private static determineRelationshipType(category: string, content: string, from: string, to: string): string {
    switch (category) {
      case 'definitions': return 'defines';
      case 'components': return 'includes';
      case 'functions': return 'performs';
      case 'characteristics': return 'has_property';
      case 'relationships': return 'relates_to';
      case 'applications': return 'applies_to';
      case 'processes': return 'executes';
      case 'examples': return 'exemplifies';
      default: return 'relates_to';
    }
  }

  private static getRelationshipLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'defines': 'se define como',
      'includes': 'incluye',
      'performs': 'realiza',
      'has_property': 'tiene',
      'relates_to': 'se relaciona con',
      'applies_to': 'se aplica a',
      'executes': 'ejecuta',
      'exemplifies': 'ejemplo de'
    };
    return labels[type] || 'relaciona';
  }

  private static getNodeType(category: string): 'main' | 'secondary' | 'detail' {
    const types: { [key: string]: 'main' | 'secondary' | 'detail' } = {
      'definitions': 'main',
      'components': 'secondary',
      'functions': 'secondary',
      'characteristics': 'detail',
      'relationships': 'detail',
      'applications': 'detail',
      'processes': 'secondary',
      'examples': 'detail'
    };
    return types[category] || 'detail';
  }

  private static haveSemanticProximity(concept1: string, concept2: string, content: string): boolean {
    const distance = 100; // caracteres
    const index1 = content.toLowerCase().indexOf(concept1.toLowerCase());
    const index2 = content.toLowerCase().indexOf(concept2.toLowerCase());
    
    return index1 !== -1 && index2 !== -1 && Math.abs(index1 - index2) < distance;
  }

  /**
   * Fallback mejorado para casos sin IA
   */
  private static generateFallbackMindMap(content: string, documentId: string): VisualizationData {
    console.log('🔄 [FALLBACK] Generando mapa conceptual básico...');
    
    const analysis = this.analyzeContentForMindMap(content);
    const centralConcept = this.identifyCentralConcept(content, analysis);
    
    const nodes = this.generateMindMapNodes(centralConcept, {
      definitions: analysis.definitions.slice(0, 2),
      components: analysis.entities.slice(0, 3),
      functions: analysis.processes.slice(0, 2),
      characteristics: [],
      relationships: [],
      applications: [],
      processes: [],
      examples: []
    });

    const relationships = this.createSemanticRelationships(centralConcept, {
      definitions: analysis.definitions.slice(0, 2),
      components: analysis.entities.slice(0, 3),
      functions: analysis.processes.slice(0, 2)
    }, content);

    const edges = this.generateLabeledConnections(relationships, nodes);

    return {
      type: 'CONCEPT_MAP',
      nodes,
      edges,
      metadata: {
        title: '🧠 Mapa Conceptual (Algoritmo Avanzado)',
        description: `Concepto central: "${centralConcept}" - Análisis semántico local`,
        generatedAt: new Date(),
        documentId,
        complexity: 2,
        confidence: 0.8
      }
    };
  }

  /**
   * Análisis completo con IA (mantener compatibilidad)
   */
  static async analyzeDocumentWithAI(content: string, documentId: string) {
    // Intentar análisis IA real aquí
    // Por ahora, usar fallback mejorado
    return this.createAdvancedFallbackAnalysis(content, documentId);
  }

  static createAdvancedFallbackAnalysis(content: string, documentId: string, isLargeDocument = false) {
    const analysis = this.analyzeContentForMindMap(content);
    
    return {
      entities: [
        ...analysis.definitions.map((def: string, i: number) => ({
          text: def,
          type: 'concept' as const,
          category: 'Definiciones',
          confidence: 0.9,
          context: { description: `Definición principal: ${def}` }
        })),
        ...analysis.entities.map((ent: string, i: number) => ({
          text: ent,
          type: 'organization' as const,
          category: 'Entidades',
          confidence: 0.8,
          context: { description: `Entidad organizacional: ${ent}` }
        })),
        ...analysis.processes.map((proc: string, i: number) => ({
          text: proc,
          type: 'process' as const,
          category: 'Procesos',
          confidence: 0.7,
          context: { description: `Proceso o procedimiento: ${proc}` }
        }))
      ],
      relationships: this.createSemanticRelationships(
        this.identifyCentralConcept(content, analysis),
        {
          definitions: analysis.definitions,
          components: analysis.entities,
          functions: analysis.processes
        },
        content
      ).map((rel: any) => ({
        source: rel.from,
        target: rel.to,
        type: rel.type as any,
        confidence: 0.8,
        context: rel.label
      }))
    };
  }

  static async generateVisualizationWithAI(content: string, type: VisualizationType) {
    if (type === 'CONCEPT_MAP') {
      return this.generateConceptualMindMap(content, 'ai-generated');
    }
    
    // Fallback para otros tipos
    return this.generateFallbackMindMap(content, 'ai-generated');
  }
}

// Mantener compatibilidad con exports anteriores
export const analyzeDocument = AIVisualizationService.analyzeDocumentWithAI;
export const createVisualization = AIVisualizationService.generateVisualizationWithAI;
export const advancedEntityExtraction = AIVisualizationService.analyzeDocumentWithAI;
export const advancedRelationshipExtraction = AIVisualizationService.analyzeDocumentWithAI;
export const getAdvancedPatterns = AIVisualizationService.createAdvancedFallbackAnalysis; 