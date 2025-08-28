import { PrismaClient } from '@prisma/client';
import { SubscriptionService } from '../src/services/subscriptionService';

const prisma = new PrismaClient();

async function testFalladasFix() {
  try {
    console.log('🔍 ===== TEST: COMANDO /falladas CON SUSCRIPCIÓN PREMIUM =====');
    
    // Tu user ID de Telegram (del chat que compartiste)
    const telegramuserid = '1871310713';
    
    console.log(`\n📊 PROBANDO CON USUARIO: ${telegramuserid}`);
    
    // 1. Verificar que el usuario existe
    console.log('\n1️⃣ VERIFICANDO USUARIO:');
    const user = await prisma.telegramuser.findUnique({
      where: { telegramuserid }
    });
    
    if (!user) {
      console.log('❌ Usuario no encontrado en BD');
      return;
    }
    
    console.log(`✅ Usuario encontrado: ${user.firstname || 'Sin nombre'} (ID interno: ${user.id})`);
    
    // 2. Verificar suscripción usando el método CORRECTO
    console.log('\n2️⃣ VERIFICANDO SUSCRIPCIÓN (MÉTODO CORREGIDO):');
    const accessResult = await SubscriptionService.canUserAccessFeature(
      telegramuserid, // ✅ CORRECTO: usar telegramuserid, no user.id
      'failed_questions',
      5
    );
    
    console.log(`📋 Resultado verificación:`, {
      allowed: accessResult.allowed,
      reason: accessResult.reason,
      currentPlan: accessResult.currentPlan,
      requiredPlan: accessResult.requiredPlan,
      remainingQuota: accessResult.remainingQuota
    });
    
    if (accessResult.allowed) {
      console.log('✅ ACCESO PERMITIDO - El comando /falladas debería funcionar');
    } else {
      console.log('❌ ACCESO DENEGADO - Revisar suscripción');
      console.log(`   Razón: ${accessResult.reason}`);
    }
    
    // 3. Verificar suscripción directamente en BD
    console.log('\n3️⃣ VERIFICACIÓN DIRECTA EN BD:');
    const directCheck = await prisma.$queryRaw`
      SELECT 
        tu."telegramuserid",
        tu."firstname",
        s.*,
        p."displayname" as "planDisplayName",
        p."name" as "planName",
        p."canusefailedquestions"
      FROM "TelegramUser" tu
      LEFT JOIN "UserSubscription" s ON tu."id" = s."userid"
      LEFT JOIN "SubscriptionPlan" p ON s."planid" = p."id"
      WHERE tu."telegramuserid" = ${telegramuserid}
    ` as any[];
    
    const directResult = directCheck[0];
    
    if (directResult) {
      console.log(`🔍 Datos completos:`, {
        telegramuserid: directResult.telegramuserid,
        firstname: directResult.firstname,
        planName: directResult.planName,
        planDisplayName: directResult.planDisplayName,
        canusefailedquestions: directResult.canusefailedquestions,
        status: directResult.status,
        enddate: directResult.enddate
      });
      
      if (directResult.planName === 'premium' && directResult.canusefailedquestions) {
        console.log('✅ PREMIUM CONFIRMADO - Tiene acceso a preguntas falladas');
      } else if (directResult.planName === 'basic' && directResult.canusefailedquestions) {
        console.log('✅ BÁSICO CONFIRMADO - Tiene acceso a preguntas falladas');
      } else {
        console.log('❌ Sin acceso a preguntas falladas');
      }
    } else {
      console.log('❌ No se encontraron datos de suscripción');
    }
    
    // 4. Simular verificación del comando (como en el webhook)
    console.log('\n4️⃣ SIMULACIÓN VERIFICACIÓN WEBHOOK:');
    console.log('🔐 Simulando verificación de permisos para comandos de estudio...');
    
    const featureType = 'failed_questions';
    const webhookAccessResult = await SubscriptionService.canUserAccessFeature(
      telegramuserid, // ✅ AHORA USA EL ID CORRECTO
      featureType,
      5 // cantidad de preguntas
    );
    
    if (webhookAccessResult.allowed) {
      console.log('✅ WEBHOOK SIMULATION: Permisos verificados - usuario puede acceder a la funcionalidad');
      console.log('🎉 EL COMANDO /falladas DEBERÍA FUNCIONAR AHORA');
    } else {
      console.log('❌ WEBHOOK SIMULATION: Acceso denegado por límites de suscripción');
      console.log(`   Razón: ${webhookAccessResult.reason}`);
    }
    
    console.log('\n🎯 CONCLUSIÓN:');
    if (accessResult.allowed && webhookAccessResult.allowed) {
      console.log('✅ FIX APLICADO CORRECTAMENTE - El comando /falladas debería funcionar');
      console.log('💡 Prueba ahora: /falladas en el chat privado con el bot');
    } else {
      console.log('❌ Aún hay problemas con la verificación');
      console.log('🔧 Revisar configuración de suscripción');
    }
    
  } catch (error) {
    console.error('❌ Error en test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar test
testFalladasFix().catch(console.error); 