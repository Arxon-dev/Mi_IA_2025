import { NextApiRequest, NextApiResponse } from 'next';
import { VisualizationAIService } from '@/lib/ai/visualizationAIService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { content, useAI = true } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Contenido requerido' });
    }

    console.log('🚀 [API] Iniciando generación de mapa conceptual:', {
      contentLength: content.length,
      useAI
    });

    let mapData;
    
    if (useAI) {
      try {
        // Intentar generar con IA
        mapData = await VisualizationAIService.generateConceptMap(content);
        console.log('✅ [API] Mapa conceptual generado con IA exitosamente');
      } catch (aiError) {
        console.warn('⚠️ [API] Error con IA, usando fallback:', aiError);
        // Fallback a análisis simple
        mapData = VisualizationAIService.generateSimpleConceptMap(content);
      }
    } else {
      // Usar análisis simple directamente
      mapData = VisualizationAIService.generateSimpleConceptMap(content);
    }

    const response = {
      success: true,
      data: mapData,
      metadata: {
        generatedAt: new Date().toISOString(),
        useAI,
        processingTime: 0,
        version: '1.0.0'
      }
    };

    console.log('🎉 [API] Respuesta enviada exitosamente:', {
      nodes: mapData.metadata.totalNodes,
      edges: mapData.metadata.totalConnections,
      complexity: mapData.metadata.complexity
    });

    return res.status(200).json(response);

  } catch (error) {
    console.error('❌ [API] Error generando mapa conceptual:', error);
    
    return res.status(500).json({
      error: 'Error interno del servidor',
      message: error instanceof Error ? error.message : 'Error desconocido',
      success: false
    });
  }
} 