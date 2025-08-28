import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ==========================================
// 🧹 API PARA LIMPIEZA SEGURA DE VINCULACIÓN SIMULADA
// ==========================================

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 ======== LIMPIEZA SEGURA DE VINCULACIÓN SIMULADA ========');
    
    const body = await request.json();
    const { telegramuserid, confirmCleanup } = body;

    if (!telegramuserid) {
      return NextResponse.json({
        success: false,
        message: 'telegramuserid requerido'
      }, { status: 400 });
    }

    if (!confirmCleanup) {
      return NextResponse.json({
        success: false,
        message: 'Confirmación requerida. Usa confirmCleanup: true'
      }, { status: 400 });
    }

    console.log(`🧹 Iniciando limpieza para usuario: ${telegramuserid}`);

    // 1. VERIFICAR QUE EXISTE LA VINCULACIÓN SIMULADA ESPECÍFICA
    const simulatedLinks = await prisma.$queryRaw<any[]>`
      SELECT "id", "telegramuserid", "moodleUserId", "moodleUsername", "moodleEmail"
      FROM "MoodleUserLink" 
      WHERE "telegramuserid" = ${telegramuserid}
      AND (
        "moodleUserId" LIKE 'moodle_user_%' OR 
        "moodleEmail" LIKE '%@moodle.com'
      )
    `;

    if (simulatedLinks.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No se encontraron vinculaciones simuladas para eliminar'
      });
    }

    console.log(`🔍 Vinculaciones simuladas encontradas:`, simulatedLinks);

    // 2. ELIMINAR ÚNICAMENTE LAS VINCULACIONES SIMULADAS ESPECÍFICAS
    const deleteResult = await prisma.$executeRaw`
      DELETE FROM "MoodleUserLink" 
      WHERE "telegramuserid" = ${telegramuserid}
      AND (
        "moodleUserId" LIKE 'moodle_user_%' OR 
        "moodleEmail" LIKE '%@moodle.com'
      )
    `;

    console.log(`✅ Vinculaciones simuladas eliminadas: ${deleteResult}`);

    // 3. LIMPIAR CÓDIGOS DE VERIFICACIÓN EXPIRADOS/USADOS (OPCIONAL)
    const expiredCodesResult = await prisma.$executeRaw`
      DELETE FROM "MoodleVerificationCode" 
      WHERE "telegramuserid" = ${telegramuserid}
      AND ("used" = true OR "expiresAt" < NOW())
    `;

    console.log(`🧹 Códigos expirados/usados eliminados: ${expiredCodesResult}`);

    // 4. VERIFICAR QUE LA LIMPIEZA FUE EXITOSA
    const remainingLinks = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count
      FROM "MoodleUserLink" 
      WHERE "telegramuserid" = ${telegramuserid}
    `;

    const linkCount = remainingLinks[0]?.count || 0;

    // 5. VERIFICAR CÓDIGOS ACTIVOS RESTANTES
    const activeCodesResult = await prisma.$queryRaw<any[]>`
      SELECT "id", "code", "expiresAt", "used"
      FROM "MoodleVerificationCode" 
      WHERE "telegramuserid" = ${telegramuserid}
      AND "used" = false 
      AND "expiresAt" > NOW()
      ORDER BY "createdAt" DESC
    `;

    const cleanupSummary = {
      simulatedLinksRemoved: simulatedLinks.length,
      expiredCodesRemoved: Number(expiredCodesResult),
      remainingActiveLinks: Number(linkCount),
      remainingActiveCodes: activeCodesResult.length,
      activeCodes: activeCodesResult,
      cleanupComplete: Number(linkCount) === 0,
      readyForRealLinking: Number(linkCount) === 0
    };

    console.log('✅ Limpieza completada:', cleanupSummary);

    return NextResponse.json({
      success: true,
      message: '🧹 Limpieza de vinculaciones simuladas completada exitosamente',
      data: cleanupSummary,
      nextSteps: {
        status: cleanupSummary.cleanupComplete ? 'ready' : 'partial',
        message: cleanupSummary.cleanupComplete 
          ? '✅ Listo para crear vinculación real con Moodle'
          : '⚠️ Quedan algunas vinculaciones activas (revisar si son reales)',
        instructions: [
          '1. Accede a tu plataforma Moodle real',
          '2. Ve a tu perfil de usuario', 
          '3. Busca la sección "Integración con Telegram"',
          '4. Genera un código de verificación REAL',
          '5. Usa ese código con /codigo_moodle en Telegram'
        ]
      }
    });

  } catch (error) {
    console.error('❌ Error en limpieza:', error);
    return NextResponse.json({
      success: false,
      message: 'Error interno en limpieza',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET para información
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Limpieza de vinculaciones simuladas endpoint',
    usage: 'POST con { "telegramuserid": "tu_id", "confirmCleanup": true }',
    warning: '⚠️ Solo elimina vinculaciones simuladas (moodle_user_* y *@moodle.com)',
    timestamp: new Date().toISOString()
  });
} 