import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Configuración para forzar renderizado dinámico
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

// GET /api/admin/tournaments/stats - Obtener estadísticas de torneos
export async function GET() {
  try {
    // Obtener estadísticas reales de la base de datos
    const [
      totalTournaments,
      activeTournaments,
      totalParticipants,
      avgScoreResult
    ] = await Promise.all([
      prisma.tournament.count(),
      prisma.tournament.count({
        where: { status: 'IN_PROGRESS' }
      }),
      prisma.tournamentparticipant.count(),
      prisma.tournamentparticipant.aggregate({
        _avg: { score: true }
      })
    ]);

    const stats = {
      totalTournaments,
      activeTournaments,
      totalParticipants,
      averageScore: Math.round((avgScoreResult._avg.score || 0) * 10) / 10
    };

    console.log('📊 Estadísticas de torneos:', stats);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching tournament stats:', error);
    return NextResponse.json(
      { error: 'Error al obtener las estadísticas' },
      { status: 500 }
    );
  }
}