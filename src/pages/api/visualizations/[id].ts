import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

/**
 * API Endpoint: /api/visualizations/[id]
 * GET: Obtiene una visualización específica
 * PUT: Actualiza una visualización existente
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'ID de visualización requerido' });
  }

  const visualizationId = parseInt(id);

  try {
    if (req.method === 'GET') {
      return await handleGetVisualization(visualizationId, res);
    } 
    
    if (req.method === 'PUT') {
      return await handleUpdateVisualization(visualizationId, req.body, res);
    }

    return res.status(405).json({ error: 'Método no permitido' });

  } catch (error: any) {
    console.error('❌ Error en endpoint de visualización:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
}

/**
 * Maneja la obtención de una visualización
 */
async function handleGetVisualization(id: number, res: NextApiResponse) {
  const visualization = await prisma.documentVisualization.findUnique({
    where: { id },
    include: {
      document: {
        select: { id: true, title: true, type: true }
      },
      usages: {
        take: 10,
        orderBy: { viewedAt: 'desc' }
      }
    }
  });

  if (!visualization) {
    return res.status(404).json({ error: 'Visualización no encontrada' });
  }

  // Registrar la visualización como vista
  await prisma.visualizationUsage.create({
    data: {
      visualizationId: id,
      action: 'VIEW',
      viewedAt: new Date()
    }
  });

  const response = {
    success: true,
    visualization: {
      ...visualization,
      data: JSON.parse(visualization.data), // Parsear el JSON guardado
      viewCount: visualization.usages.length
    }
  };

  return res.status(200).json(response);
}/**
 * Maneja la actualización de una visualización
 */
async function handleUpdateVisualization(id: number, body: any, res: NextApiResponse) {
  const { title, description, data, settings } = body;

  // Verificar que la visualización existe
  const existingVisualization = await prisma.documentVisualization.findUnique({
    where: { id }
  });

  if (!existingVisualization) {
    return res.status(404).json({ error: 'Visualización no encontrada' });
  }

  // Actualizar la visualización
  const updatedVisualization = await prisma.documentVisualization.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(description && { description }),
      ...(data && { data: JSON.stringify(data) }),
      updatedAt: new Date()
    }
  });

  // Registrar la actualización
  await prisma.visualizationUsage.create({
    data: {
      visualizationId: id,
      action: 'UPDATE',
      viewedAt: new Date()
    }
  });

  return res.status(200).json({
    success: true,
    visualization: {
      ...updatedVisualization,
      data: JSON.parse(updatedVisualization.data)
    }
  });
}