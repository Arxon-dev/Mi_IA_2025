import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// DELETE /api/admin/tournaments/[id] - Eliminar un torneo
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    console.log(`🗑️ Eliminando torneo con ID: ${id}`);
    
    // Verificar que el torneo existe
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        participants: true,
        questions: true,
      }
    });
    
    if (!tournament) {
      return NextResponse.json(
        { error: 'Torneo no encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar si el torneo está activo
    if (tournament.status === 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'No se puede eliminar un torneo en progreso' },
        { status: 400 }
      );
    }
    
    console.log(`📊 Torneo a eliminar: ${tournament.name}`);
    console.log(`👥 Participantes: ${tournament.participants.length}`);
    console.log(`❓ Preguntas: ${tournament.questions.length}`);
    
    // Eliminar el torneo (Prisma se encarga de las relaciones en cascada)
    await prisma.tournament.delete({
      where: { id }
    });
    
    console.log(`✅ Torneo "${tournament.name}" eliminado correctamente`);
    
    return NextResponse.json({ 
      success: true, 
      message: `Torneo "${tournament.name}" eliminado correctamente`,
      deletedTournament: {
        id: tournament.id,
        name: tournament.name,
        participants: tournament.participants.length,
        questions: tournament.questions.length
      }
    });
  } catch (error) {
    console.error('❌ Error eliminando torneo:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al eliminar el torneo' },
      { status: 500 }
    );
  }
} 