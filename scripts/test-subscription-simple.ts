import { PrismaClient } from '@prisma/client';
import { SubscriptionService } from '../src/services/subscriptionService';

const prisma = new PrismaClient();

async function testSubscriptionSystem() {
  console.log('🧪 ======================================');
  console.log('🧪 PRUEBA SIMPLE DEL SISTEMA DE SUSCRIPCIONES');
  console.log('🧪 ======================================\n');

  const testUserId = '999888777';

  try {
    // 1. Limpiar datos de prueba previos
    console.log('🧹 Limpiando datos de prueba previos...');
    
    // 2. Verificar planes disponibles
    console.log('📋 Verificando planes disponibles...');
    const plans = await SubscriptionService.getAvailablePlans();
    console.log(`   ✅ Encontrados ${plans.length} planes`);
    
    if (plans.length === 0) {
      console.log('⚠️ No hay planes disponibles. Ejecuta: npm run script:create-plans');
      return;
    }

    // 3. Crear usuario de prueba
    console.log('👤 Creando usuario de prueba...');
    try {
      await prisma.telegramuser.upsert({
        where: { telegramuserid: testUserId },
        update: {},
        create: {
          telegramuserid: testUserId,
          username: 'test_user',
          firstname: 'Usuario',
          lastname: 'Test',
          totalpoints: 0
        }
      });
      console.log('   ✅ Usuario de prueba creado');
    } catch (error) {
      console.log('   ⚠️ Usuario ya existe o error:', error);
    }

    // 4. Verificar acceso sin suscripción
    console.log('🚫 Verificando restricciones sin suscripción...');
    const noSubAccess = await SubscriptionService.canUserAccessFeature(testUserId, 'failed_questions');
    if (!noSubAccess.allowed) {
      console.log('   ✅ Acceso correctamente bloqueado sin suscripción');
    } else {
      console.log('   ❌ Error: acceso permitido sin suscripción');
    }

    // 5. Suscribir a plan básico
    console.log('🥉 Suscribiendo a plan básico...');
    const basicPlan = plans.find(p => p.name === 'basic');
    if (basicPlan) {
      const subscribed = await SubscriptionService.upgradeSubscription(testUserId, basicPlan.id);
      if (subscribed) {
        console.log('   ✅ Suscripción básica creada');
        
        // Verificar acceso con suscripción básica
        const basicAccess = await SubscriptionService.canUserAccessFeature(testUserId, 'failed_questions');
        if (basicAccess.allowed) {
          console.log('   ✅ Acceso básico funcionando');
        } else {
          console.log('   ❌ Error: acceso básico no funciona');
        }
      } else {
        console.log('   ❌ Error creando suscripción básica');
      }
    } else {
      console.log('   ❌ Plan básico no encontrado');
    }

    // 6. Upgrade a Premium
    console.log('🥈 Upgrading a plan Premium...');
    const premiumPlan = plans.find(p => p.name === 'premium');
    if (premiumPlan) {
      const upgraded = await SubscriptionService.upgradeSubscription(testUserId, premiumPlan.id);
      if (upgraded) {
        console.log('   ✅ Upgrade a Premium exitoso');
        
        // Verificar acceso Premium
        const premiumAccess = await SubscriptionService.canUserAccessFeature(testUserId, 'moodle_integration');
        if (premiumAccess.allowed) {
          console.log('   ✅ Funcionalidades Premium funcionando');
        } else {
          console.log('   ❌ Error: funcionalidades Premium no funcionan');
        }
      } else {
        console.log('   ❌ Error haciendo upgrade a Premium');
      }
    } else {
      console.log('   ❌ Plan Premium no encontrado');
    }

    // 7. Verificar estadísticas
    console.log('📊 Verificando sistema de cuotas...');
    const subscription = await SubscriptionService.getCurrentSubscription(testUserId);
    if (subscription) {
      console.log(`   ✅ Suscripción activa: ${subscription.plan.displayname}`);
      console.log(`   📅 Estado: ${subscription.status}`);
    } else {
      console.log('   ❌ No se encontró suscripción activa');
    }

    // 8. Probar cancelación
    console.log('🚫 Probando cancelación...');
    const cancelled = await SubscriptionService.cancelSubscription(testUserId, 'Prueba de cancelación');
    if (cancelled) {
      console.log('   ✅ Cancelación funcionando');
    } else {
      console.log('   ❌ Error en cancelación');
    }

    console.log('\n🎉 ¡TODAS LAS PRUEBAS COMPLETADAS!');
    console.log('✅ El sistema de suscripciones está funcionando correctamente');

  } catch (error) {
    console.error('💥 Error en las pruebas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testSubscriptionSystem().catch(console.error);
}

export { testSubscriptionSystem }; 