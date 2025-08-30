import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
      where: { id }
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
    // Obtener participantes por separado
    const participantsCount = await prisma.tournamentparticipant.count({
      where: { tournamentid: id }
    });
    console.log(`👥 Participantes activos: ${participantsCount}`);
    
    // Actualizar el estado del torneo a COMPLETED
    const updatedTournament = await prisma.tournament.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        actualendtime: new Date(),
        endTime: new Date()
      }
    });
    
    // Actualizar participantes que aún estén activos
    await prisma.tournamentparticipant.updateMany({
      where: {
        tournamentid: id,
        status: 'IN_PROGRESS'
      },
      data: {
        status: 'COMPLETED',
        completedat: new Date()
      }
    });
    
    // Calcular posiciones finales basadas en puntuación
    const participants = await prisma.tournamentparticipant.findMany({
      where: { tournamentid: id },
      orderBy: [
        { score: 'desc' },
        { correctanswers: 'desc' },
        { completedat: 'asc' }
      ],
      // include removed for MySQL compatibility
    });
    
    // Asignar posiciones finales y calcular puntos ganados
    for (let i = 0; i < participants.length; i++) {
      const finalPosition = i + 1;
      const pointsEarned = Math.max(0, 100 - (i * 10)); // 1er=100, 2do=90, 3ro=80, etc.
      
      await prisma.tournamentparticipant.update({
        where: { id: participants[i].id },
        data: { 
          finalPosition,
          pointsearned
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
        
        console.log(`💰 Usuario ${participants[i].userid}: +${pointsEarned} puntos transferidos (posición ${finalPosition})`);
        
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
              chat_id: participants[i].userid,
              text: notificationMessage,
              parse_mode: 'HTML'
            })
          });
        } catch (notifError) {
          console.error(`❌ Error enviando notificación a usuario ${participants[i].userid}:`, notifError);
        }
      }
    }
    
    console.log(`✅ Torneo "${tournament.name}" finalizado correctamente`);
    console.log(`🏆 Ganador: Usuario ${participants[0]?.userid || 'N/A'} con ${participants[0]?.score || 0} puntos`);
    
    return NextResponse.json({ 
      success: true, 
      message: `Torneo "${tournament.name}" finalizado correctamente`,
      tournamentId: id,
      status: 'COMPLETED',
      participants: participants.length,
      winner: participants[0] ? {
        userid: participants[0].userid,
        score: participants[0].score,
        correctAnswers: participants[0].correctanswers
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