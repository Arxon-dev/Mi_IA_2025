import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRetry } from '@/lib/prisma-retry';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { sectionId: string } }
) {
  try {
    const { sectionId } = params;

    console.log(`🧹 [API DELETE /sections/${sectionId}/questions/clear] Eliminando todas las preguntas de la sección`);

    // Verificar que la sección existe
    const section = await prisma.section.findUnique({
      where: { id: sectionId }
    });

    if (!section) {
      console.log(`❌ [API DELETE /sections/${sectionId}/questions/clear] Sección no encontrada`);
      return NextResponse.json(
        { error: 'Sección no encontrada' },
        { status: 404 }
      );
    }

    // Marcar todas las preguntas anteriores como inactivas (SIN ELIMINAR de la BD)
    const updateResult = await withRetry(async () => {
      return await prisma.sectionquestion.updateMany({
        where: {
          sectionid: sectionId,
          isactive: true  // Solo marcar las que están actualmente activas
        },
        data: {
          isactive: false  // Marcar como inactivas, manteniéndolas en la BD
        }
      });
    }, 3, `clearSectionQuestions(${sectionId})`);

    console.log(`✅ [API DELETE /sections/${sectionId}/questions/clear] Marcadas como inactivas ${updateResult.count} preguntas (mantenidas en BD)`);

    return NextResponse.json({
      success: true,
      archivedCount: updateResult.count,
      message: `${updateResult.count} pregunta(s) anterior(es) archivada(s) (mantenidas en BD para historial)`
    });

  } catch (error) {
    console.error(`❌ [API DELETE /sections/${params.sectionId}/questions/clear] Error:`, error);
    return NextResponse.json(
      { error: 'Error interno del servidor al eliminar preguntas de la sección' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 