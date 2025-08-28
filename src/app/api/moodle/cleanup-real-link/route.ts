import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ==========================================
// 🧹 LIMPIEZA DE VINCULACIÓN REAL HUÉRFANA
// ==========================================

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 ======== LIMPIEZA VINCULACIÓN REAL HUÉRFANA ========');
    
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
        message: 'Confirmación requerida para limpiar vinculación real'
      }, { status: 400 });
    }

    console.log(`🧹 Limpiando vinculación real huérfana para usuario: ${telegramuserid}`);

    // 1. Eliminar vinculaciones de MoodleUserLink
    const deletedLinks = await prisma.$executeRaw`
      DELETE FROM "MoodleUserLink" 
      WHERE "telegramuserid" = ${telegramuserid}
    `;

    // 2. Eliminar códigos de verificación
    const deletedCodes = await prisma.$executeRaw`
      DELETE FROM "MoodleVerificationCode" 
      WHERE "telegramuserid" = ${telegramuserid}
    `;

    // 3. Contar lo que queda
    const remainingLinks = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count FROM "MoodleUserLink" 
      WHERE "telegramuserid" = ${telegramuserid}
    `;

    const remainingCodes = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count FROM "MoodleVerificationCode" 
      WHERE "telegramuserid" = ${telegramuserid}
    `;

    const linksCount = Number(remainingLinks[0]?.count || 0);
    const codesCount = Number(remainingCodes[0]?.count || 0);

    console.log(`✅ Limpieza completada:`);
    console.log(`   - Vinculaciones eliminadas: ${deletedLinks}`);
    console.log(`   - Códigos eliminados: ${deletedCodes}`);
    console.log(`   - Vinculaciones restantes: ${linksCount}`);
    console.log(`   - Códigos restantes: ${codesCount}`);

    return NextResponse.json({
      success: true,
      message: 'Vinculación real huérfana limpiada exitosamente',
      data: {
        deletedLinks: Number(deletedLinks),
        deletedCodes: Number(deletedCodes),
        remainingLinks: linksCount,
        remainingCodes: codesCount,
        cleanupComplete: linksCount === 0 && codesCount === 0,
        readyForNewLinking: true
      }
    });

  } catch (error) {
    console.error('❌ Error limpiando vinculación real:', error);
    return NextResponse.json({
      success: false,
      message: 'Error limpiando vinculación real',
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Limpieza de Vinculación Real Huérfana',
    description: 'Limpia vinculaciones reales que quedaron huérfanas después de reinstalar plugin',
    warning: '⚠️ Solo usar después de reinstalar plugin de Moodle',
    usage: {
      method: 'POST',
      body: {
        telegramuserid: 'ID del usuario de Telegram',
        confirmCleanup: 'true para confirmar limpieza'
      }
    }
  });
} 