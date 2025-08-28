import { DocumentAnalysisResult, VisualizationType, DocumentSegment } from '../types';
import { NLPProcessor } from './nlpProcessor';
import { segmentDocument, detectPatterns } from '../utils/textUtils';

/**
 * Analizador principal de documentos
 * Orquesta el proceso completo de análisis y determina las mejores visualizaciones
 */
export class DocumentAnalyzer {
  private nlpProcessor: NLPProcessor;

  constructor() {
    this.nlpProcessor = new NLPProcessor();
  }

  /**
   * Analiza un documento completo y retorna los resultados estructurados
   */
  async analyzeDocument(documentId: string, content: string): Promise<DocumentAnalysisResult> {
    try {
      console.log(`🔍 Iniciando análisis del documento ${documentId}`);

      // 1. Segmentar el documento
      const segments = await this.segmentAndEnrichDocument(content);
      
      // 2. Extraer entidades globales
      const entities = await this.nlpProcessor.extractEntities(content);
      
      // 3. Identificar relaciones entre segmentos
      const relationships = await this.nlpProcessor.extractRelationships(segments);
      
      // 4. Analizar patrones del documento
      const patterns = this.analyzeDocumentPatterns(content, segments);
      
      // 5. Recomendar tipos de visualización
      const recommendedVisualizations = this.recommendVisualizations(patterns, entities, relationships);
      
      // 6. Calcular confianza del análisis
      const confidence = this.calculateAnalysisConfidence(segments, entities, relationships);

      console.log(`✅ Análisis completado. Confianza: ${confidence.toFixed(2)}`);

      return {
        documentId,
        segments,
        entities,
        relationships,
        patterns,
        recommendedVisualizations,
        confidence
      };

    } catch (error) {
      console.error(`❌ Error analizando documento ${documentId}:`, error);
      throw new Error(`Error en análisis de documento: ${error.message}`);
    }
  }

  /**
   * Segmenta el documento y enriquece cada segmento con entidades
   */
  private async segmentAndEnrichDocument(content: string): Promise<DocumentSegment[]> {
    const segments = segmentDocument(content);
    
    // Enriquecer cada segmento con sus entidades específicas
    for (const segment of segments) {
      try {
        segment.entities = await this.nlpProcessor.extractEntities(segment.content);
        
        // Filtrar entidades por relevancia mínima
        segment.entities = segment.entities.filter(entity => entity.confidence > 0.5);
        
      } catch (error) {
        console.warn(`⚠️ Error procesando segmento ${segment.id}:`, error.message);
        segment.entities = [];
      }
    }

    return segments;
  }

  /**
   * Analiza los patrones globales del documento
   */
  private analyzeDocumentPatterns(content: string, segments: DocumentSegment[]) {
    const globalPatterns = detectPatterns(content);
    
    // Analizar distribución de patrones por segmento
    const segmentPatterns = segments.map(segment => detectPatterns(segment.content));
    
    // Calcular prevalencia de cada patrón
    const processSegments = segmentPatterns.filter(p => p.hasProcesses).length;
    const hierarchySegments = segmentPatterns.filter(p => p.hasHierarchy).length;
    const causalSegments = segmentPatterns.filter(p => p.hasCausalRelations).length;
    const decisionSegments = segmentPatterns.filter(p => p.hasDecisions).length;
    
    return {
      hasProcesses: globalPatterns.hasProcesses || processSegments > segments.length * 0.3,
      hasConcepts: segments.some(s => s.entities && s.entities.length > 2),
      hasHierarchy: globalPatterns.hasHierarchy || hierarchySegments > segments.length * 0.2,
      hasComparisons: decisionSegments > segments.length * 0.2,
      
      // Métricas adicionales
      processPrevalence: processSegments / segments.length,
      hierarchyPrevalence: hierarchySegments / segments.length,
      causalPrevalence: causalSegments / segments.length,
      decisionPrevalence: decisionSegments / segments.length
    };
  }

  /**
   * Recomienda los tipos de visualización más apropiados
   */
  private recommendVisualizations(patterns: any, entities: any[], relationships: any[]): VisualizationType[] {
    const recommendations: { type: VisualizationType; score: number }[] = [];

    // Evaluar FLOWCHART
    let flowchartScore = 0;
    if (patterns.hasProcesses) flowchartScore += 40;
    if (patterns.processPrevalence > 0.3) flowchartScore += 30;
    if (patterns.hasComparisons) flowchartScore += 20;
    if (relationships.some(r => r.type === 'follows')) flowchartScore += 10;
    
    if (flowchartScore > 20) {
      recommendations.push({ type: 'FLOWCHART', score: flowchartScore });
    }

    // Evaluar CONCEPT_MAP
    let conceptScore = 0;
    if (patterns.hasConcepts) conceptScore += 35;
    if (entities.length > 5) conceptScore += 25;
    if (relationships.length > 3) conceptScore += 25;
    if (patterns.causalPrevalence > 0.2) conceptScore += 15;
    
    if (conceptScore > 15) {
      recommendations.push({ type: 'CONCEPT_MAP', score: conceptScore });
    }

    // Evaluar HIERARCHICAL_SCHEME
    let hierarchyScore = 0;
    if (patterns.hasHierarchy) hierarchyScore += 45;
    if (patterns.hierarchyPrevalence > 0.2) hierarchyScore += 30;
    if (relationships.some(r => r.type === 'includes' || r.type === 'part_of')) hierarchyScore += 20;
    if (entities.some(e => e.type === 'organization')) hierarchyScore += 5;
    
    if (hierarchyScore > 20) {
      recommendations.push({ type: 'HIERARCHICAL_SCHEME', score: hierarchyScore });
    }

    // Evaluar MIND_MAP (siempre una opción para documentos con múltiples conceptos)
    if (entities.length > 3) {
      const mindMapScore = Math.min(30 + entities.length * 2, 70);
      recommendations.push({ type: 'MIND_MAP', score: mindMapScore });
    }

    // Ordenar por score y retornar top 3
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(r => r.type);
  }

  /**
   * Calcula la confianza del análisis realizado
   */
  private calculateAnalysisConfidence(segments: DocumentSegment[], entities: any[], relationships: any[]): number {
    let confidence = 0.5; // Base

    // Factores que aumentan confianza
    if (segments.length > 3) confidence += 0.1;
    if (entities.length > 5) confidence += 0.15;
    if (relationships.length > 2) confidence += 0.1;
    
    // Calidad de entidades (confianza promedio)
    if (entities.length > 0) {
      const avgEntityConfidence = entities.reduce((sum, e) => sum + e.confidence, 0) / entities.length;
      confidence += avgEntityConfidence * 0.2;
    }

    // Factores que reducen confianza
    if (segments.length < 2) confidence -= 0.2;
    if (entities.length === 0) confidence -= 0.3;

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * Obtiene estadísticas rápidas del documento
   */
  async getDocumentStats(content: string) {
    const segments = segmentDocument(content);
    const patterns = detectPatterns(content);
    const structure = await this.nlpProcessor.analyzeDocumentStructure(content);
    
    return {
      segmentCount: segments.length,
      estimatedReadingTime: Math.ceil(content.split(' ').length / 200), // minutos
      complexityScore: structure.complexityScore,
      patterns,
      topics: structure.topics.slice(0, 5), // Top 5 temas
      readabilityScore: structure.readabilityScore
    };
  }
} 