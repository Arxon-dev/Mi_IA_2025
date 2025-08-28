import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ==========================================
// 🔍 API PARA DIAGNÓSTICO DE VINCULACIÓN
// ==========================================

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 ======== DIAGNÓSTICO DE VINCULACIÓN ========');
    
    const body = await request.json();
    const { telegramuserid } = body;

    if (!telegramuserid) {
      return NextResponse.json({
        success: false,
        message: 'telegramuserid requerido'
      }, { status: 400 });
    }

    console.log(`🔍 Diagnosticando vinculación para usuario: ${telegramuserid}`);

    // 1. Verificar usuario de Telegram existe
    const telegramUser = await prisma.telegramuser.findUnique({
      where: { telegramuserid },
      select: {
        telegramuserid: true,
        username: true,
        firstname: true,
        totalpoints: true,
        level: true
      }
    });

    // 2. Buscar vinculaciones en MoodleUserLink (usando raw query)
    let moodleLinks: any[] = [];
    try {
      moodleLinks = await prisma.$queryRaw<any[]>`
        SELECT "id", "telegramuserid", "moodleUserId", "moodleUsername", 
               "moodleEmail", "moodleFullname", "linkedAt", "isActive"
        FROM "MoodleUserLink" 
        WHERE "telegramuserid" = ${telegramuserid}
        ORDER BY "linkedAt" DESC
      `;
    } catch (error) {
      console.log('⚠️ Tabla MoodleUserLink no existe o error:', error);
    }

    // 3. Buscar códigos de verificación (si existen)
    let verificationCodes: any[] = [];
    try {
      verificationCodes = await prisma.$queryRaw<any[]>`
        SELECT "id", "code", "telegramuserid", "expiresAt", "used", "createdAt"
        FROM "MoodleVerificationCode" 
        WHERE "telegramuserid" = ${telegramuserid}
        ORDER BY "createdAt" DESC
        LIMIT 5
      `;
    } catch (error) {
      console.log('⚠️ Tabla MoodleVerificationCode no existe o error:', error);
    }

    // 4. Buscar actividades de Moodle (usando raw query)
    let moodleActivities: any[] = [];
    try {
      moodleActivities = await prisma.$queryRaw<any[]>`
        SELECT "id", "moodleUserId", "telegramuserid", "questionCorrect", 
               "subject", "difficulty", "processedAt"
        FROM "MoodleActivity" 
        WHERE "telegramuserid" = ${telegramuserid}
        ORDER BY "processedAt" DESC
        LIMIT 5
      `;
    } catch (error) {
      console.log('⚠️ Tabla MoodleActivity no existe o error:', error);
    }

    // 5. Tabla local_telegram_verification está en MySQL (Moodle)
    const moodleVerificationTable: any[] = [];
    // Nota: Esta tabla existe en MySQL, no en PostgreSQL
    // Para consultar esta tabla necesitaríamos conectar a MySQL directamente
    console.log('🔍 Verificación MySQL omitida (tabla en base de datos separada)');

    // 6. Análisis del estado
    const diagnosis = {
      telegramUser: telegramUser || null,
      hasLinks: moodleLinks.length > 0,
      linksCount: moodleLinks.length,
      links: moodleLinks,
      verificationCodes,
      moodleActivities,
      moodleVerificationTable,
      analysis: {
        telegramExists: !!telegramUser,
        hasActiveLinks: moodleLinks.some(link => link.isactive),
        hasSimulatedLinks: moodleLinks.some(link => 
          link.moodleUserId?.startsWith('moodle_user_') || 
          link.moodleEmail?.includes('@moodle.com')
        ),
        hasRealMoodleVerification: false, // Tabla en MySQL, no consultada desde PostgreSQL
        hasActivities: moodleActivities.length > 0
      }
    };

    console.log('✅ Diagnóstico completado:', diagnosis.analysis);

    return NextResponse.json({
      success: true,
      message: 'Diagnóstico completado',
      data: diagnosis
    });

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
    return NextResponse.json({
      success: false,
      message: 'Error interno en diagnóstico',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET para testing
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Diagnóstico de vinculación endpoint is working!',
    usage: 'POST con { "telegramuserid": "tu_id" }',
    timestamp: new Date().toISOString()
  });
} 