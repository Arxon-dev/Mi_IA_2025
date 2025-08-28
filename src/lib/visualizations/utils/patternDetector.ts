import { DocumentSegment, Entity, Relationship } from '../types';

/**
 * Detector avanzado de patrones en documentos
 */
export class PatternDetector {
  
  /**
   * Detecta patrones avanzados en el documento completo
   */
  static detectAdvancedPatterns(segments: DocumentSegment[], entities: Entity[], relationships: Relationship[]) {
    return {
      // Patrones estructurales
      hasSequentialSteps: this.detectSequentialSteps(segments),
      hasComparisons: this.detectComparisons(segments),
      hasDefinitions: this.detectDefinitions(segments),
      hasCategorizations: this.detectCategorizations(segments),
      
      // Patrones de contenido
      hasInstructions: this.detectInstructions(segments, entities),
      hasProblems: this.detectProblems(segments),
      hasSolutions: this.detectSolutions(segments),
      
      // Patrones de relación
      hasStrongHierarchy: this.detectStrongHierarchy(relationships),
      hasComplexRelations: this.detectComplexRelations(relationships),
      hasCausalChains: this.detectCausalChains(relationships),
      
      // Métricas
      complexityScore: this.calculatePatternComplexity(segments, entities, relationships),
      organizationScore: this.calculateOrganizationScore(segments),
      relationDensity: relationships.length / Math.max(entities.length, 1)
    };
  }

  /**
   * Detecta pasos secuenciales en el contenido
   */
  private static detectSequentialSteps(segments: DocumentSegment[]): boolean {
    const sequentialWords = ['primero', 'segundo', 'tercero', 'luego', 'después', 'paso', 'etapa'];
    let sequentialCount = 0;

    segments.forEach(segment => {
      const hasSequential = sequentialWords.some(word => 
        segment.content.toLowerCase().includes(word)
      );
      if (hasSequential) sequentialCount++;
    });

    return sequentialCount >= 2;
  }

  /**
   * Detecta comparaciones en el contenido
   */
  private static detectComparisons(segments: DocumentSegment[]): boolean {
    const comparisonWords = ['versus', 'comparado', 'diferencia', 'similar', 'mayor', 'menor', 'mejor', 'peor'];
    
    return segments.some(segment => 
      comparisonWords.some(word => segment.content.toLowerCase().includes(word))
    );
  }

  /**
   * Detecta definiciones explícitas
   */
  private static detectDefinitions(segments: DocumentSegment[]): boolean {
    return segments.filter(s => s.type === 'definition').length > 2;
  }

  /**
   * Detecta categorizaciones o clasificaciones
   */
  private static detectCategorizations(segments: DocumentSegment[]): boolean {
    const categorizationWords = ['tipos', 'categorías', 'clases', 'grupos', 'familias'];
    
    return segments.some(segment => 
      categorizationWords.some(word => segment.content.toLowerCase().includes(word))
    );
  }

  /**
   * Detecta instrucciones o procedimientos
   */
  private static detectInstructions(segments: DocumentSegment[], entities: Entity[]): boolean {
    const actionEntities = entities.filter(e => e.type === 'action').length;
    const instructionWords = ['debe', 'realizar', 'ejecutar', 'hacer', 'crear'];
    
    const hasInstructionWords = segments.some(segment => 
      instructionWords.some(word => segment.content.toLowerCase().includes(word))
    );

    return actionEntities > 3 || hasInstructionWords;
  }

  /**
   * Detecta problemas planteados
   */
  private static detectProblems(segments: DocumentSegment[]): boolean {
    const problemWords = ['problema', 'dificultad', 'reto', 'desafío', 'obstáculo'];
    
    return segments.some(segment => 
      problemWords.some(word => segment.content.toLowerCase().includes(word))
    );
  }

  /**
   * Detecta soluciones propuestas
   */
  private static detectSolutions(segments: DocumentSegment[]): boolean {
    const solutionWords = ['solución', 'resolver', 'respuesta', 'alternativa', 'propuesta'];
    
    return segments.some(segment => 
      solutionWords.some(word => segment.content.toLowerCase().includes(word))
    );
  }

  /**
   * Detecta jerarquías fuertes
   */
  private static detectStrongHierarchy(relationships: Relationship[]): boolean {
    const hierarchicalRels = relationships.filter(r => 
      r.type === 'includes' || r.type === 'part_of'
    );
    
    return hierarchicalRels.length > relationships.length * 0.4;
  }

  /**
   * Detecta relaciones complejas
   */
  private static detectComplexRelations(relationships: Relationship[]): boolean {
    return relationships.length > 5 && 
           new Set(relationships.map(r => r.type)).size >= 3;
  }

  /**
   * Detecta cadenas causales
   */
  private static detectCausalChains(relationships: Relationship[]): boolean {
    const causalRels = relationships.filter(r => r.type === 'causes');
    return causalRels.length >= 2;
  }

  /**
   * Calcula el score de complejidad de patrones
   */
  private static calculatePatternComplexity(
    segments: DocumentSegment[], 
    entities: Entity[], 
    relationships: Relationship[]
  ): number {
    let score = 0;
    
    // Factores de complejidad
    score += Math.min(segments.length / 10, 3);
    score += Math.min(entities.length / 8, 3);
    score += Math.min(relationships.length / 5, 4);
    
    return Math.min(score, 10);
  }

  /**
   * Calcula el score de organización del documento
   */
  private static calculateOrganizationScore(segments: DocumentSegment[]): number {
    const headingCount = segments.filter(s => s.type === 'heading').length;
    const listCount = segments.filter(s => s.type === 'list').length;
    const definitionCount = segments.filter(s => s.type === 'definition').length;
    
    let score = 5; // Base
    
    if (headingCount > 2) score += 2;
    if (listCount > 1) score += 1.5;
    if (definitionCount > 1) score += 1.5;
    
    return Math.min(score, 10);
  }
}