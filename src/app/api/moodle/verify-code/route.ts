import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ==========================================
// 🎓 API PARA VERIFICACIÓN DE CÓDIGOS MOODLE
// ==========================================

export async function POST(request: NextRequest) {
  try {
    console.log('🔗 ======== VERIFICACIÓN DE CÓDIGO MOODLE ========');
    
    const body = await request.json();
    const { telegramuserid, code } = body;

    if (!telegramuserid || !code) {
      return NextResponse.json({
        success: false,
        message: 'telegramuserid y code son requeridos'
      }, { status: 400 });
    }

    console.log(`🔗 Verificando código ${code} para usuario Telegram: ${telegramuserid}`);

    // 1. Verificar si el usuario ya tiene una vinculación
    const existingLinks = await prisma.$queryRaw<any[]>`
      SELECT * FROM "MoodleUserLink" 
      WHERE "telegramuserid" = ${telegramuserid}
      LIMIT 1
    `;

    if (existingLinks.length > 0) {
      console.log('❌ Usuario ya tiene vinculación existente');
      return NextResponse.json({
        success: false,
        message: 'YA TIENES CUENTA VINCULADA',
        data: existingLinks[0]
      });
    }

    // 2. Buscar el código en la tabla de códigos
    const codeRecords = await prisma.$queryRaw<any[]>`
      SELECT * FROM "MoodleVerificationCode" 
      WHERE "code" = ${code}
      AND "used" = false 
      AND "expiresAt" > NOW()
      LIMIT 1
    `;

    if (codeRecords.length === 0) {
      console.log('❌ Código no válido, expirado o ya usado');
      return NextResponse.json({
        success: false,
        message: 'CÓDIGO NO VÁLIDO, EXPIRADO O YA USADO'
      }, { status: 400 });
    }

    const codeRecord = codeRecords[0];
    console.log(`✅ Código válido encontrado para Moodle User ID: ${codeRecord.moodleUserId}`);

    // 3. Crear la vinculación con datos REALES
    const linkId = crypto.randomUUID();
    const linkedAt = new Date();

    await prisma.$executeRaw`
      INSERT INTO "MoodleUserLink" (
        "id", "telegramuserid", "moodleUserId", "moodleUsername", 
        "moodleEmail", "moodleFullname", "linkedAt"
      ) VALUES (
        ${linkId}, ${telegramuserid}, ${codeRecord.moodleUserId}, 
        ${codeRecord.moodleUsername}, ${codeRecord.moodleEmail}, 
        ${codeRecord.moodleFullname}, ${linkedAt}
      )
    `;

    // 4. Marcar el código como usado
    const usedAt = new Date();
    await prisma.$executeRaw`
      UPDATE "MoodleVerificationCode" 
      SET "used" = true, "usedAt" = ${usedAt}
      WHERE "code" = ${code}
    `;

    console.log('🎉 Vinculación REAL creada exitosamente');

    return NextResponse.json({
      success: true,
      message: '¡VINCULACIÓN EXITOSA!',
      data: {
        moodleUserId: codeRecord.moodleUserId,
        moodleUsername: codeRecord.moodleUsername,
        moodleEmail: codeRecord.moodleEmail,
        moodleFullname: codeRecord.moodleFullname,
        linkedAt: linkedAt
      }
    });

  } catch (error) {
    console.error('❌ Error en verificación de código:', error);
    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor'
    }, { status: 500 });
  }
}

// GET endpoint para testing
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Moodle verification endpoint is working!',
    timestamp: new Date().toISOString()
  });
} 