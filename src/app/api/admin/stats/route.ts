import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Configuración para forzar renderizado dinámico
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Estadísticas básicas del sistema
    const [
      totalUsers,
      totalQuestions,
      totalDocuments,
      totalResponses
    ] = await Promise.all([
      prisma.telegramuser.count(),
      prisma.question.count(),
      prisma.document.count(),
      prisma.telegramresponse.count() // Corregido: telegramResponse -> telegramresponse
    ]);

    // Verificar estado del sistema
    const systemHealth = {
      database: true, // Si llegamos aquí, la BD funciona
      telegram: true, // TODO: Verificar API de Telegram
      webhook: true,  // TODO: Verificar webhook status
      ai: true       // TODO: Verificar servicios de IA
    };

    // Actividad reciente (opcional - simplificado por ahora)
    const recentActivity = {
      lastQuestion: 'N/A',
      lastResponse: 'N/A', 
      lastUser: 'N/A'
    };

    // Obtener información más detallada si es posible
    try {
      const lastUser = await prisma.telegramuser.findFirst({
        orderBy: { joinedat: 'desc' }, // Corregido: joinedAt -> joinedat
        select: { firstname: true, joinedat: true } // Corregido: joinedAt -> joinedat
      });

      const lastResponse = await prisma.telegramresponse.findFirst({ // Corregido: telegramResponse -> telegramresponse
        orderBy: { answeredat: 'desc' }, // Corregido: answeredAt -> answeredat
        select: { answeredat: true } // Corregido: answeredAt -> answeredat
      });

      const lastQuestion = await prisma.question.findFirst({
        orderBy: { createdat: 'desc' }, // Corregido: createdAt -> createdat
        select: { createdat: true } // Corregido: createdAt -> createdat
      });

      if (lastUser) {
        recentActivity.lastUser = `${lastUser.firstname} (${lastUser.joinedat.toLocaleDateString()})`; // Corregido: joinedAt -> joinedat
      }

      if (lastResponse) {
        recentActivity.lastResponse = lastResponse.answeredat.toLocaleString(); // Corregido: answeredAt -> answeredat
      }

      if (lastQuestion) {
        recentActivity.lastQuestion = lastQuestion.createdat.toLocaleString(); // Corregido: createdAt -> createdat
      }
    } catch (activityError) {
      console.warn('Error getting recent activity:', activityError);
    }

    const stats = {
      totalUsers,
      totalQuestions,
      totalDocuments,
      totalResponses,
      systemHealth,
      recentActivity
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    
    // Devolver estadísticas mínimas en caso de error
    return NextResponse.json({
      totalUsers: 0,
      totalquestions: 0,
      totalDocuments: 0,
      totalResponses: 0,
      systemHealth: {
        database: false,
        telegram: false,
        webhook: false,
        ai: false
      },
      recentActivity: {
        lastQuestion: 'Error',
        lastResponse: 'Error',
        lastUser: 'Error'
      }
    });
  }
}