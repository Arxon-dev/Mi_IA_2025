import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/admin/tournaments/[id]/stop - Detener un torneo
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    console.log(`🛑 Deteniendo torneo con ID: ${id}`);
    
    // Verificar que el torneo existe y está activo
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
    
    if (tournament.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'El torneo no está en progreso' },
        { status: 400 }
      );
    }
    
    console.log(`📊 Finalizando torneo: ${tournament.name}`);
    console.log(`👥 Participantes activos: ${tournament.participants.length}`);
    
    // Actualizar el estado del torneo a COMPLETED
    const updatedTournament = await prisma.tournament.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        actualEndTime: new Date(),
        endTime: new Date()
      }
    });
    
    // Actualizar participantes que aún estén activos
    await prisma.tournamentParticipant.updateMany({
      where: {
        tournamentId: id,
        status: 'IN_PROGRESS'
      },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });
    
    // Calcular posiciones finales basadas en puntuación
    const participants = await prisma.tournamentParticipant.findMany({
      where: { tournamentId: id },
      orderBy: [
        { score: 'desc' },
        { correctAnswers: 'desc' },
        { completedAt: 'asc' }
      ],
      // include removed for MySQL compatibility
    });
    
    // Asignar posiciones finales y calcular puntos ganados
    for (let i = 0; i < participants.length; i++) {
      const finalPosition = i + 1;
      const pointsEarned = Math.max(0, 100 - (i * 10)); // 1er=100, 2do=90, 3ro=80, etc.
      
      await prisma.tournamentParticipant.update({
        where: { id: participants[i].id },
        data: { 
          finalPosition,
          pointsEarned
        }
      });

      // ✅ NUEVA FUNCIONALIDAD: Transferir puntos al perfil del usuario
      if (pointsEarned > 0) {
        await prisma.telegramuser.update({
          where: { id: participants[i].userid },
          data: { 
            totalpoints: { increment: pointsEarned }
          }
        });
        
        console.log(`💰 ${participants[i].user.firstname}: +${pointsEarned} puntos transferidos (posición ${finalPosition})`);
        
        // Enviar notificación individual de puntos ganados
        const notificationMessage = `🎉 ¡FELICIDADES! 🎉

🏆 Torneo: ${tournament.name}
📊 Posición final: ${finalPosition}° lugar

💰 Has ganado ${pointsEarned} puntos!
✅ Ya se agregaron a tu cuenta total.

👑 ${finalPosition <= 3 ? 'Estás en el podium!' : '¡Excelente participación!'}

💡 Usa /stats para ver tus puntos totales`;

        // Enviar notificación via Telegram
        try {
          await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: participants[i].user.telegramuserid,
              text: notificationMessage,
              parse_mode: 'HTML'
            })
          });
        } catch (notifError) {
          console.error(`❌ Error enviando notificación a ${participants[i].user.firstname}:`, notifError);
        }
      }
    }
    
    console.log(`✅ Torneo "${tournament.name}" finalizado correctamente`);
    console.log(`🏆 Ganador: ${participants[0]?.user.firstname || 'N/A'} con ${participants[0]?.score || 0} puntos`);
    
    return NextResponse.json({ 
      success: true, 
      message: `Torneo "${tournament.name}" finalizado correctamente`,
      tournamentId: id,
      status: 'COMPLETED',
      participants: participants.length,
      winner: participants[0] ? {
        name: participants[0].user.firstname,
        score: participants[0].score,
        correctAnswers: participants[0].correctAnswers
      } : null
    });
  } catch (error) {
    console.error('❌ Error deteniendo torneo:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al detener el torneo' },
      { status: 500 }
    );
  }
} 