import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [API DEBUG] Solicitud recibida en analytics-advanced');
    
    const { telegramUserId } = await request.json();
    console.log('🔍 [API DEBUG] telegramUserId recibido:', telegramUserId);

    if (!telegramUserId) {
      console.error('❌ [API ERROR] Telegram User ID no proporcionado');
      return NextResponse.json({ error: 'Telegram User ID requerido' }, { status: 400 });
    }

    console.log('🔍 [API DEBUG] Obteniendo analytics para usuario:', telegramUserId);
    
    // Obtener analytics del usuario
    const analytics = await getUserAdvancedAnalytics(telegramUserId);
    console.log('🔍 [API DEBUG] Analytics obtenidos:', analytics ? 'Éxito' : 'Falló');

    if (!analytics) {
      console.error('❌ [API ERROR] No se pudieron obtener analytics');
      return NextResponse.json({ error: 'No se pudieron obtener analytics' }, { status: 500 });
    }

    console.log('🔍 [API DEBUG] Enviando respuesta exitosa');
    return NextResponse.json({ success: true, analytics });
  } catch (error) {
    console.error('❌ [API ERROR] Error en analytics avanzado:', error);
    console.error('❌ [API ERROR] Stack trace:', error.stack);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

async function getUserAdvancedAnalytics(telegramUserId: string) {
  try {
    console.log('🔍 [DB DEBUG] Iniciando consultas de base de datos para:', telegramUserId);
    
    // Información básica del usuario
    console.log('🔍 [DB DEBUG] Consultando información del usuario...');
    const userInfo = await prisma.telegramuser.findUnique({
      where: { telegramuserid: telegramUserId }
    });
    console.log('🔍 [DB DEBUG] Usuario encontrado:', userInfo ? 'Sí' : 'No');

    // Rendimiento por temas
    console.log('🔍 [DB DEBUG] Consultando rendimiento por temas...');
    const topicPerformance = await prisma.$queryRaw`
      SELECT * FROM mdl_local_telegram_user_topic_performance 
      WHERE telegramuserid = ${telegramUserId}
      ORDER BY accuracy ASC
    ` as any[];
    console.log('🔍 [DB DEBUG] Temas encontrados:', topicPerformance.length);

    // Progreso temporal (últimas 4 semanas)
    console.log('🔍 [DB DEBUG] Consultando progreso temporal...');
    const timeline = await prisma.$queryRaw`
      SELECT * FROM mdl_local_telegram_progress_timeline 
      WHERE telegramuserid = ${telegramUserId}
      AND date >= DATE_SUB(CURDATE(), INTERVAL 28 DAY)
      ORDER BY date ASC
    ` as any[];
    console.log('🔍 [DB DEBUG] Registros de timeline:', timeline.length);

    // Recomendaciones activas
    console.log('🔍 [DB DEBUG] Consultando recomendaciones...');
    const recommendations = await prisma.$queryRaw`
      SELECT * FROM mdl_local_telegram_recommendations 
      WHERE telegramuserid = ${telegramUserId} AND isactive = 1
      ORDER BY priority ASC
    ` as any[];
    console.log('🔍 [DB DEBUG] Recomendaciones encontradas:', recommendations.length);

    // Logros recientes
    console.log('🔍 [DB DEBUG] Consultando logros...');
    const achievements = await prisma.$queryRaw`
      SELECT * FROM mdl_local_telegram_achievements 
      WHERE telegramuserid = ${telegramUserId}
      ORDER BY earnedat DESC
      LIMIT 5
    ` as any[];
    console.log('🔍 [DB DEBUG] Logros encontrados:', achievements.length);

    // Sesiones de estudio recientes
    console.log('🔍 [DB DEBUG] Consultando sesiones de estudio...');
    const studySessions = await prisma.$queryRaw`
      SELECT * FROM mdl_local_telegram_study_sessions 
      WHERE telegramuserid = ${telegramUserId}
      ORDER BY startedat DESC
      LIMIT 5
    ` as any[];
    console.log('🔍 [DB DEBUG] Sesiones encontradas:', studySessions.length);

    const result = {
      userInfo,
      topicPerformance,
      timeline,
      recommendations,
      achievements,
      studySessions
    };
    
    console.log('🔍 [DB DEBUG] Analytics compilados exitosamente');
    return result;
  } catch (error) {
    console.error('❌ [DB ERROR] Error obteniendo analytics:', error);
    console.error('❌ [DB ERROR] Stack trace:', error.stack);
    return null;
  }
}