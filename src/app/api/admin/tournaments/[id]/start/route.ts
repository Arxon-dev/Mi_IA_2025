import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { TournamentService } from '@/services/tournamentService';

const prisma = new PrismaClient();

// POST /api/admin/tournaments/[id]/start - Iniciar un torneo
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    console.log(`🚀 Iniciando torneo con ID: ${id}`);
    
    // Verificar que el torneo existe y está en estado correcto
    const tournament = await prisma.tournament.findUnique({
      where: { id }
      // NOTA: Eliminar include porque tournament no tiene relaciones definidas en el esquema
    });
    
    if (!tournament) {
      return NextResponse.json(
        { error: 'Torneo no encontrado' },
        { status: 404 }
      );
    }
    
    if (tournament.status !== 'SCHEDULED') {
      return NextResponse.json(
        { error: 'El torneo no está en estado programado' },
        { status: 400 }
      );
    }
    
    // Verificar participantes por separado
    const participants = await prisma.tournamentparticipant.findMany({
      where: { tournamentid: id }
    });
    
    if (participants.length === 0) {
      return NextResponse.json(
        { error: 'No hay participantes registrados en el torneo' },
        { status: 400 }
      );
    }
    
    // Verificar preguntas por separado
    const questions = await prisma.tournamentquestion.findMany({
      where: { tournamentid: id }
    });
    
    console.log(`📊 Iniciando torneo: ${tournament.name}`);
    console.log(`👥 Participantes registrados: ${participants.length}`);
    console.log(`❓ Preguntas disponibles: ${questions.length}`);
    
    // Actualizar el estado del torneo a IN_PROGRESS
    const updatedTournament = await prisma.tournament.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        actualstarttime: new Date(),
        starttime: new Date()  // Corregido: starttime en lugar de startTime
      }
    });
    
    // Actualizar participantes a estado IN_PROGRESS
    await prisma.tournamentparticipant.updateMany({
      where: {
        tournamentid: id,  // Corregido: tournamentid en lugar de tournamentId
        status: 'REGISTERED'
      },
      data: {
        status: 'IN_PROGRESS',
        startedat: new Date()  // Corregido: startedat en lugar de startedAt
      }
    });
    
    console.log(`✅ Torneo "${tournament.name}" iniciado correctamente`);
    console.log(`⏰ Duración: ${tournament.timelimit / 60} minutos`);
    
    // *** CLAVE: Activar el sistema de preguntas automático ***
    try {
      console.log(`🎯 Activando sistema de preguntas automático para torneo ${id}...`);
      const tournamentManager = await TournamentService.getInstance().ensureTournamentManagerRunning();
      
      if (tournamentManager) {
        console.log(`✅ Sistema de preguntas automático activado`);
        console.log(`🚀 El torneo enviará preguntas automáticamente a los participantes`);
      } else {
        console.warn(`⚠️ Sistema de preguntas no disponible - modo manual requerido`);
      }
    } catch (error) {
      console.error('❌ Error activando sistema de preguntas:', error);
      // No fallar si el sistema de preguntas falla, pero registrar el error
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Torneo "${tournament.name}" iniciado correctamente`,
      tournamentId: id,
      status: 'IN_PROGRESS',
      participants: participants.length,
      questions: questions.length,
      startTime: updatedTournament.actualstarttime,
      duration: tournament.timelimit,
      automaticQuestions: true
    });
  } catch (error) {
    console.error('❌ Error iniciando torneo:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al iniciar el torneo' },
      { status: 500 }
    );
  }
}