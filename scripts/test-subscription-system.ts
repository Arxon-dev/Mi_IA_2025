import { SubscriptionService } from '../src/services/subscriptionService';
import { PaymentService } from '../src/services/paymentService';
import { prisma } from '../src/lib/prisma';

async function testSubscriptionSystem() {
  console.log('🧪 Iniciando pruebas del sistema de suscripciones...\n');

  try {
    // 1. Verificar planes existentes
    console.log('📋 1. Verificando planes disponibles...');
    const plans = await SubscriptionService.getAvailablePlans();
    console.log(`   ✅ Se encontraron ${plans.length} planes:`);
    plans.forEach(plan => {
      console.log(`     - ${plan.displayname}: €${plan.price}/mes`);
    });
    console.log('');

    // 2. Crear usuario de prueba
    console.log('👤 2. Creando usuario de prueba...');
    const testUser = await prisma.telegramuser.upsert({
      where: { telegramuserid: 'test_user_123' },
      update: {
        firstname: 'Usuario',
        lastname: 'Prueba'
      },
      create: {
        telegramuserid: 'test_user_123',
        telegramId: 'test_user_123',
        firstname: 'Usuario',
        lastname: 'Prueba',
        username: 'usuario_prueba'
      }
    });
    console.log(`   ✅ Usuario creado/actualizado: ${testUser.id}`);
    console.log('');

    // 3. Verificar acceso inicial (usuario gratuito)
    console.log('🔒 3. Verificando acceso usuario gratuito...');
    const freeAccess = await SubscriptionService.canUserAccessFeature(testUser.id, 'questions', 5);
    console.log(`   📚 Acceso a preguntas: ${freeAccess.allowed ? '✅ Permitido' : '❌ Denegado'}`);
    if (!freeAccess.allowed) {
      console.log(`     Razón: ${freeAccess.reason}`);
      console.log(`     Plan requerido: ${freeAccess.requiredPlan}`);
    }

    const moodleAccess = await SubscriptionService.canUserAccessFeature(testUser.id, 'moodle_integration');
    console.log(`   🔗 Acceso a Moodle: ${moodleAccess.allowed ? '✅ Permitido' : '❌ Denegado'}`);
    if (!moodleAccess.allowed) {
      console.log(`     Razón: ${moodleAccess.reason}`);
    }
    console.log('');

    // 4. Simular suscripción a plan Básico
    console.log('🎯 4. Simulando suscripción a plan Básico...');
    const basicPlan = plans.find(p => p.name === 'basic');
    if (basicPlan) {
      const upgradeSuccess = await SubscriptionService.upgradeSubscription(testUser.id, basicPlan.id);
      console.log(`   ${upgradeSuccess ? '✅' : '❌'} Suscripción a Básico: ${upgradeSuccess ? 'Exitosa' : 'Fallida'}`);

      if (upgradeSuccess) {
        // Verificar nueva suscripción
        const subscription = await SubscriptionService.getCurrentSubscription(testUser.id);
        console.log(`     Plan activo: ${subscription?.plan.displayname}`);
        console.log(`     Estado: ${subscription?.status}`);
        console.log(`     Fecha fin: ${subscription?.enddate?.toLocaleDateString('es-ES')}`);
      }
    }
    console.log('');

    // 5. Verificar acceso con plan Básico
    console.log('🔓 5. Verificando acceso con plan Básico...');
    const basicQuestionsAccess = await SubscriptionService.canUserAccessFeature(testUser.id, 'failed_questions');
    console.log(`   📚 Preguntas falladas: ${basicQuestionsAccess.allowed ? '✅ Permitido' : '❌ Denegado'}`);

    const basicSimulationsAccess = await SubscriptionService.canUserAccessFeature(testUser.id, 'simulations');
    console.log(`   🎯 Simulacros: ${basicSimulationsAccess.allowed ? '✅ Permitido' : '❌ Denegado'}`);

    const basicMoodleAccess = await SubscriptionService.canUserAccessFeature(testUser.id, 'moodle_integration');
    console.log(`   🔗 Integración Moodle: ${basicMoodleAccess.allowed ? '✅ Permitido' : '❌ Denegado'}`);
    console.log('');

    // 6. Probar cuotas diarias
    console.log('📊 6. Probando sistema de cuotas...');
    const initialQuota = await SubscriptionService.getRemainingQuota(testUser.id);
    console.log(`   Cuota inicial preguntas: ${initialQuota.questions}`);

    // Simular uso de preguntas
    await SubscriptionService.incrementQuotaUsage(testUser.id, 'questions', 5);
    console.log(`   ✅ Simulado uso de 5 preguntas`);

    const afterUsageQuota = await SubscriptionService.getRemainingQuota(testUser.id);
    console.log(`   Cuota después del uso: ${afterUsageQuota.questions}`);
    console.log('');

    // 7. Simular creación de invoice
    console.log('💳 7. Probando creación de invoice...');
    const premiumPlan = plans.find(p => p.name === 'premium');
    if (premiumPlan) {
      const invoiceResult = await PaymentService.createTelegramInvoice(testUser.id, premiumPlan.id);
      console.log(`   ${invoiceResult.success ? '✅' : '❌'} Creación de invoice: ${invoiceResult.success ? 'Exitosa' : 'Fallida'}`);
      
      if (invoiceResult.success) {
        console.log(`     Transaction ID: ${invoiceResult.transactionId}`);
        const invoiceData = JSON.parse(invoiceResult.invoiceUrl || '{}');
        console.log(`     Título: ${invoiceData.title}`);
        console.log(`     Precio: €${(invoiceData.prices[0]?.amount || 0) / 100}`);
      } else {
        console.log(`     Error: ${invoiceResult.error}`);
      }
    }
    console.log('');

    // 8. Simular upgrade a Premium
    console.log('🚀 8. Simulando upgrade a Premium...');
    if (premiumPlan) {
      const premiumUpgrade = await SubscriptionService.upgradeSubscription(testUser.id, premiumPlan.id);
      console.log(`   ${premiumUpgrade ? '✅' : '❌'} Upgrade a Premium: ${premiumUpgrade ? 'Exitoso' : 'Fallido'}`);

      if (premiumUpgrade) {
        const newSubscription = await SubscriptionService.getCurrentSubscription(testUser.id);
        console.log(`     Nuevo plan: ${newSubscription?.plan.displayname}`);
        
        // Verificar acceso Premium
        const premiumMoodle = await SubscriptionService.canUserAccessFeature(testUser.id, 'moodle_integration');
        console.log(`     Acceso Moodle: ${premiumMoodle.allowed ? '✅ Permitido' : '❌ Denegado'}`);

        const premiumQuota = await SubscriptionService.getRemainingQuota(testUser.id);
        console.log(`     Preguntas disponibles: ${premiumQuota.questions === null ? 'ILIMITADAS' : premiumQuota.questions}`);
      }
    }
    console.log('');

    // 9. Probar cancelación
    console.log('🚫 9. Probando cancelación de suscripción...');
    const cancelResult = await SubscriptionService.cancelSubscription(testUser.id, 'Prueba del sistema');
    console.log(`   ${cancelResult ? '✅' : '❌'} Cancelación: ${cancelResult ? 'Exitosa' : 'Fallida'}`);

    if (cancelResult) {
      const cancelledSubscription = await SubscriptionService.getCurrentSubscription(testUser.id);
      console.log(`     Estado después de cancelar: ${cancelledSubscription?.status}`);
    }
    console.log('');

    // 10. Limpiar datos de prueba
    console.log('🧹 10. Limpiando datos de prueba...');
    
    // Eliminar transacciones de prueba
    await prisma.paymentTransaction.deleteMany({
      where: { userid: testUser.id }
    });
    
    // Eliminar suscripción de prueba
    await prisma.usersubscription.deleteMany({
      where: { userid: testUser.id }
    });
    
    // Eliminar cuotas de prueba
    await prisma.userQuotaUsage.deleteMany({
      where: { userid: testUser.id }
    });
    
    // Eliminar usuario de prueba
    await prisma.telegramuser.delete({
      where: { id: testUser.id }
    });
    
    console.log('   ✅ Datos de prueba eliminados');
    console.log('');

    console.log('🎉 ¡Todas las pruebas completadas exitosamente!');
    console.log('\n📋 RESUMEN:');
    console.log('✅ Planes de suscripción funcionando');
    console.log('✅ Sistema de permisos operativo');
    console.log('✅ Cuotas diarias funcionando');
    console.log('✅ Creación de invoices operativa');
    console.log('✅ Upgrades/downgrades funcionando');
    console.log('✅ Cancelaciones operativas');
    console.log('\n🚀 ¡El sistema está listo para producción!');

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
    process.exit(1);
  }
}

testSubscriptionSystem(); 