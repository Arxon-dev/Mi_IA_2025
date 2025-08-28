import { NextApiRequest, NextApiResponse } from 'next';
import { DocumentAnalyzer } from '@/lib/visualizations/analysis/documentAnalyzer';
import { FlowchartGenerator } from '@/lib/visualizations/generators/flowchartGenerator';
import { ConceptMapGenerator } from '@/lib/visualizations/generators/conceptMapGenerator';
import { HierarchyGenerator } from '@/lib/visualizations/generators/hierarchyGenerator';
import { VisualizationType } from '@/lib/visualizations/types';
import { prisma } from '@/lib/prisma';

/**
 * API Endpoint: POST /api/documents/[id]/visualize
 * Genera una visualización específica para un documento
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const startTime = Date.now(); // Mover aquí para que esté disponible

  try {
    const { id } = req.query;
    const { content, type, options = {} } = req.body;

    // Validaciones
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'ID de documento requerido' });
    }

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Contenido del documento requerido' });
    }

    if (!type || !isValidVisualizationType(type)) {
      return res.status(400).json({ 
        error: 'Tipo de visualización requerido',
        validTypes: ['FLOWCHART', 'CONCEPT_MAP', 'HIERARCHICAL_SCHEME', 'MIND_MAP']
      });
    }

    console.log(`🎨 Generando visualización ${type} para documento ${id}`);

    // Verificar que el documento existe
    const document = await prisma.document.findUnique({
      where: { id: parseInt(id) }
    });

    if (!document) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    // 1. Analizar el documento
    const analyzer = new DocumentAnalyzer();
    const analysisResult = await analyzer.analyzeDocument(id, content);

    // 2. Generar la visualización según el tipo
    const visualization = await generateVisualizationByType(type, analysisResult);

    // 3. Guardar en la base de datos
    const savedVisualization = await saveVisualizationToDb(
      parseInt(id), 
      type, 
      visualization,
      analysisResult.confidence
    );

    // 4. Respuesta exitosa
    const response = {
      success: true,
      visualizationId: savedVisualization.id,
      data: visualization,
      metadata: {
        documentId: id,
        type,
        generatedAt: new Date().toISOString(),
        analysisConfidence: analysisResult.confidence,
        processingTime: `${Date.now() - startTime}ms`
      }
    };

    console.log(`✅ Visualización ${type} generada para documento ${id}`);
    return res.status(200).json(response);

  } catch (error: any) {
    console.error('❌ Error generando visualización:', error);
    
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}/**
 * Valida si el tipo de visualización es válido
 */
function isValidVisualizationType(type: string): type is VisualizationType {
  return ['FLOWCHART', 'CONCEPT_MAP', 'HIERARCHICAL_SCHEME', 'MIND_MAP'].includes(type);
}

/**
 * Genera la visualización según el tipo especificado
 */
async function generateVisualizationByType(type: VisualizationType, analysis: any) {
  switch (type) {
    case 'FLOWCHART':
      const flowchartGen = new FlowchartGenerator();
      return await flowchartGen.generateFlowchart(analysis);
      
    case 'CONCEPT_MAP':
    case 'MIND_MAP': // Por ahora usar el mismo generador
      const conceptGen = new ConceptMapGenerator();
      return await conceptGen.generateConceptMap(analysis);
      
    case 'HIERARCHICAL_SCHEME':
      const hierarchyGen = new HierarchyGenerator();
      return await hierarchyGen.generateHierarchy(analysis);
      
    default:
      throw new Error(`Tipo de visualización no soportado: ${type}`);
  }
}

/**
 * Guarda la visualización en la base de datos
 */
async function saveVisualizationToDb(documentId: number, type: VisualizationType, data: any, confidence: number) {
  return await prisma.documentVisualization.create({
    data: {
      documentId,
      type: type as any, // Cast para el enum de Prisma
      title: data.metadata.title,
      description: data.metadata.description,
      confidence,
      complexity: data.metadata.complexity,
      data: JSON.stringify(data), // Guardar como JSON
      createdAt: new Date()
    }
  });
}

