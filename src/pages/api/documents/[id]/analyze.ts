import { NextApiRequest, NextApiResponse } from 'next';
import { DocumentAnalyzer } from '@/lib/visualizations/analysis/documentAnalyzer';
import { prisma } from '@/lib/prisma';

/**
 * API Endpoint: POST /api/documents/[id]/analyze
 * Analiza un documento y retorna el análisis completo con recomendaciones
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { id } = req.query;
    const { content } = req.body;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'ID de documento requerido' });
    }

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Contenido del documento requerido' });
    }

    console.log(`🔍 Iniciando análisis del documento ${id}`);

    // Verificar que el documento existe en la base de datos
    const document = await prisma.document.findUnique({
      where: { id: parseInt(id) }
    });

    if (!document) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    // Crear instancia del analizador
    const analyzer = new DocumentAnalyzer();

    // Realizar el análisis
    const analysisResult = await analyzer.analyzeDocument(id, content);

    // Obtener estadísticas adicionales
    const stats = await analyzer.getDocumentStats(content);

    // Respuesta exitosa
    const response = {
      success: true,
      documentId: id,
      analysis: analysisResult,
      stats,
      recommendations: {
        bestVisualization: analysisResult.recommendedVisualizations[0],
        allRecommendations: analysisResult.recommendedVisualizations,
        confidence: analysisResult.confidence,
        reasoning: generateRecommendationReasoning(analysisResult)
      },
      timestamp: new Date().toISOString()
    };

    console.log(`✅ Análisis completado para documento ${id}`);
    return res.status(200).json(response);

  } catch (error: any) {
    console.error('❌ Error en análisis de documento:', error);
    
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Genera un razonamiento legible para las recomendaciones
 */
function generateRecommendationReasoning(analysis: any): string {
  const patterns = analysis.patterns;
  const reasons = [];

  if (patterns.hasProcesses) {
    reasons.push('Se detectaron procesos secuenciales');
  }
  
  if (patterns.hasConcepts && analysis.entities.length > 5) {
    reasons.push(`${analysis.entities.length} conceptos identificados`);
  }
  
  if (patterns.hasHierarchy) {
    reasons.push('Estructura jerárquica presente');
  }
  
  if (analysis.relationships.length > 3) {
    reasons.push(`${analysis.relationships.length} relaciones detectadas`);
  }

  return reasons.length > 0 
    ? `Recomendación basada en: ${reasons.join(', ')}.`
    : 'Recomendación basada en análisis general del contenido.';
}