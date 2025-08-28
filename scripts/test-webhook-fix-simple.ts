import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testWebhookFix() {
  try {
    console.log('🔍 ===== TEST: VERIFICACIÓN DIRECTA DE SUSCRIPCIÓN (WEBHOOK FIX) =====');
    
    // Tu user ID de Telegram (del chat que compartiste)
    const userid = '1871310713';
    
    console.log(`\n📊 PROBANDO CON USUARIO: ${userid}`);
    
    // Simular la verificación exacta que ahora hace el webhook
    console.log('\n1️⃣ VERIFICACIÓN DIRECTA DE SUSCRIPCIÓN (NUEVA LÓGICA):');
    
    const subscriptionCheck = await prisma.$queryRaw`
      SELECT 
        tu."telegramuserid",
        tu."firstname",
        s."status",
        s."enddate",
        p."name" as "planName",
        p."displayname" as "planDisplayName",
        p."canusefailedquestions"
      FROM "TelegramUser" tu
      LEFT JOIN "UserSubscription" s ON tu."id" = s."userid" AND s."status" = 'active' AND s."enddate" >= NOW()
      LEFT JOIN "SubscriptionPlan" p ON s."planid" = p."id"
      WHERE tu."telegramuserid" = ${userid}
      LIMIT 1
    ` as any[];

    const userSubscription = subscriptionCheck[0];
    
    console.log('📋 Datos obtenidos:', {
      telegramuserid: userSubscription?.telegramuserid,
      firstname: userSubscription?.firstname,
      planName: userSubscription?.planName,
      planDisplayName: userSubscription?.planDisplayName,
      canusefailedquestions: userSubscription?.canusefailedquestions,
      status: userSubscription?.status,
      enddate: userSubscription?.enddate
    });
    
    // Simular la lógica exacta del webhook para comandos falladas
    const featureType = 'failed_questions';
    let accessResult: { allowed: boolean; reason?: string; currentPlan?: string; requiredPlan?: string };
    
    console.log('\n2️⃣ EVALUACIÓN DE ACCESO:');
    
    if (!userSubscription) {
      accessResult = {
        allowed: false,
        reason: 'Usuario no encontrado'
      };
      console.log('❌ Usuario no encontrado en la consulta');
    } else if (!userSubscription.planName) {
      // Usuario sin suscripción (plan gratuito)
      accessResult = {
        allowed: false,
        reason: 'Las preguntas falladas requieren suscripción',
        currentPlan: 'Gratuito',
        requiredPlan: 'Básico'
      };
      console.log('❌ Usuario sin suscripción activa');
    } else if (featureType === 'failed_questions' && !userSubscription.canusefailedquestions) {
      // Plan que no incluye preguntas falladas
      accessResult = {
        allowed: false,
        reason: 'Tu plan no incluye acceso a preguntas falladas',
        currentPlan: userSubscription.planDisplayName,
        requiredPlan: 'Básico'
      };
      console.log('❌ Plan no incluye preguntas falladas');
    } else {
      // Todo correcto
      accessResult = { allowed: true };
      console.log(`✅ Acceso autorizado: Usuario ${userSubscription.firstname} con plan ${userSubscription.planDisplayName}`);
    }
    
    console.log('\n3️⃣ RESULTADO FINAL:');
    console.log('📊 Access Result:', accessResult);
    
    if (accessResult.allowed) {
      console.log('🎉 ¡ÉXITO! El comando /falladas DEBERÍA FUNCIONAR AHORA');
      console.log('💡 El usuario puede proceder con la sesión de estudio');
    } else {
      console.log('❌ ACCESO DENEGADO');
      console.log(`   Razón: ${accessResult.reason}`);
      console.log(`   Plan actual: ${accessResult.currentPlan || 'Desconocido'}`);
      console.log(`   Plan requerido: ${accessResult.requiredPlan || 'Desconocido'}`);
    }
    
    console.log('\n🎯 CONCLUSIÓN:');
    if (accessResult.allowed) {
      console.log('✅ FIX WEBHOOK APLICADO CORRECTAMENTE');
      console.log('📱 Prueba ahora: /falladas en el chat privado con el bot');
      console.log('🔄 El webhook debería usar esta nueva lógica de verificación');
    } else {
      console.log('❌ La verificación directa indica que hay problemas con la suscripción');
      console.log('🔧 Revisar datos de suscripción en la base de datos');
    }
    
  } catch (error) {
    console.error('❌ Error en test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar test
testWebhookFix().catch(console.error); 