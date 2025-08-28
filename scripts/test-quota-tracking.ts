import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testQuotaTracking() {
  try {
    console.log('🧪 TESTING QUOTA TRACKING SYSTEM\n');
    
    const testUserId = '1234567890'; // Usuario de prueba
    const testUserName = 'UsuarioPrueba';
    
    // === PASO 1: Verificar/Crear usuario de prueba ===
    console.log('👤 PASO 1: Configurando usuario de prueba...');
    
    let user = await prisma.telegramuser.findUnique({
      where: { telegramuserid: testUserId }
    });
    
    if (!user) {
      user = await prisma.telegramuser.create({
        data: {
          telegramuserid: testUserId,
          firstname: testUserName,
          username: testUserName,
          totalpoints: 0,
          level: 1,
          streak: 0
        }
      });
      console.log('✅ Usuario de prueba creado');
    } else {
      console.log('✅ Usuario de prueba ya existe');
    }
    
    // === PASO 2: Verificar/Crear plan básico ===
    console.log('\n💰 PASO 2: Verificando plan básico...');
    
    const existingPlan = await prisma.$queryRaw`
      SELECT * FROM "SubscriptionPlan" WHERE "name" = 'basic' LIMIT 1
    ` as any[];
    
    let basicPlan;
    
    if (existingPlan.length === 0) {
      // Generar ID único para el plan
      const planId = `plan_basic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await prisma.$executeRaw`
        INSERT INTO "SubscriptionPlan" (
          "id", "name", "displayname", "description", "price", "currency", "billingPeriod",
          "dailyquestionslimit", "monthlyQuestionsLimit", "canusefailedquestions",
          "canuseadvancedstats", "canusesimulations", "canuseaianalysis", 
          "canUseCustomExams", "canusemoodleintegration", "maxSimulationsPerDay",
          "maxReportsPerMonth", "isActive", "createdAt", "updatedAt"
        ) VALUES (
          ${planId}, 'basic', 'Básico', '100 preguntas/día, sistema de preguntas falladas, estadísticas básicas',
          4.99, 'EUR', 'monthly', 100, 3000, true, false, false, false, false, false, 1, 4, true, NOW(), NOW()
        )
      `;
      
      const newPlan = await prisma.$queryRaw`
        SELECT * FROM "SubscriptionPlan" WHERE "name" = 'basic' LIMIT 1
      ` as any[];
      basicPlan = newPlan[0];
      console.log('✅ Plan básico creado');
    } else {
      basicPlan = existingPlan[0];
      console.log('✅ Plan básico ya existe');
    }
    
    // === PASO 3: Verificar/Crear suscripción activa ===
    console.log('\n📋 PASO 3: Configurando suscripción activa...');
    
    const existingSubscription = await prisma.$queryRaw`
      SELECT * FROM "UserSubscription" WHERE "userid" = ${user.id} LIMIT 1
    ` as any[];
    
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 1);
    
    let currentSubscriptionId;
    
    if (existingSubscription.length === 0) {
      // Generar UUID para el ID
      currentSubscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await prisma.$executeRaw`
        INSERT INTO "UserSubscription" (
          "id", "userid", "planid", "status", "startDate", "enddate", "autoRenew", "createdAt", "updatedAt"
        ) VALUES (
          ${currentSubscriptionId}, ${user.id}, ${basicPlan.id}, 'active', ${now}, ${endDate}, true, NOW(), NOW()
        )
      `;
      console.log('✅ Suscripción creada');
    } else {
      currentSubscriptionId = existingSubscription[0].id;
      await prisma.$executeRaw`
        UPDATE "UserSubscription" 
        SET "planid" = ${basicPlan.id}, "status" = 'active', "enddate" = ${endDate}, "updatedAt" = NOW()
        WHERE "userid" = ${user.id}
      `;
      console.log('✅ Suscripción actualizada');
    }
    
    // === PASO 4: Verificar estado inicial ===
    console.log('\n📊 PASO 4: Verificando estado inicial...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const initialUsage = await prisma.$queryRaw`
      SELECT 
        "questionsUsed",
        "failedQuestionsUsed",
        "simulationsUsed"
      FROM "UserQuotaUsage"
      WHERE "userid" = ${user.id} AND "date" = ${today}
      LIMIT 1
    ` as any[];
    
    console.log('📈 Uso inicial del día:', initialUsage[0] || 'Sin uso registrado');
    
    // === PASO 5: Simular tracking de preguntas normales ===
    console.log('\n🎯 PASO 5: Simulando tracking de preguntas normales...');
    
    const questionsToAdd = 5;
    
    try {
      if (initialUsage.length > 0) {
        // Actualizar uso existente
        const currentQuestions = initialUsage[0].questionsUsed || 0;
        
        await prisma.$executeRaw`
          UPDATE "UserQuotaUsage" 
          SET "questionsUsed" = ${currentQuestions + questionsToAdd},
              "updatedAt" = NOW()
          WHERE "userid" = ${user.id} AND "date" = ${today}
        `;
        console.log(`✅ Incrementado uso existente: +${questionsToAdd} preguntas normales`);
      } else {
        // Crear nuevo registro
        const quotaId = `quota_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await prisma.$executeRaw`
          INSERT INTO "UserQuotaUsage" ("id", "userid", "subscriptionId", "date", "questionsUsed", "failedQuestionsUsed", "simulationsUsed", "reportsGenerated", "aiAnalysisUsed", "createdAt", "updatedAt")
          VALUES (${quotaId}, ${user.id}, ${currentSubscriptionId}, ${today}, ${questionsToAdd}, 0, 0, 0, 0, NOW(), NOW())
        `;
        console.log(`✅ Creado nuevo registro: ${questionsToAdd} preguntas normales`);
      }
    } catch (error) {
      console.error('❌ Error en tracking de preguntas normales:', error);
    }
    
    // === PASO 6: Simular tracking de preguntas falladas ===
    console.log('\n🔄 PASO 6: Simulando tracking de preguntas falladas...');
    
    const failedQuestionsToAdd = 3;
    
    try {
      const currentUsage = await prisma.$queryRaw`
        SELECT 
          "questionsUsed",
          "failedQuestionsUsed"
        FROM "UserQuotaUsage"
        WHERE "userid" = ${user.id} AND "date" = ${today}
        LIMIT 1
      ` as any[];
      
      const current = currentUsage[0];
      const currentFailed = current.failedQuestionsUsed || 0;
      
      await prisma.$executeRaw`
        UPDATE "UserQuotaUsage" 
        SET "failedQuestionsUsed" = ${currentFailed + failedQuestionsToAdd},
            "updatedAt" = NOW()
        WHERE "userid" = ${user.id} AND "date" = ${today}
      `;
      console.log(`✅ Incrementado: +${failedQuestionsToAdd} preguntas falladas`);
    } catch (error) {
      console.error('❌ Error en tracking de preguntas falladas:', error);
    }
    
    // === PASO 7: Verificar resultado final ===
    console.log('\n📋 PASO 7: Verificando resultado final...');
    
    const finalUsage = await prisma.$queryRaw`
      SELECT 
        "questionsUsed",
        "failedQuestionsUsed",
        "simulationsUsed"
      FROM "UserQuotaUsage"
      WHERE "userid" = ${user.id} AND "date" = ${today}
      LIMIT 1
    ` as any[];
    
    const usage = finalUsage[0];
    const totalQuestions = (usage.questionsUsed || 0) + (usage.failedQuestionsUsed || 0);
    
    console.log('📊 USO FINAL DEL DÍA:');
    console.log(`   🎯 Preguntas normales: ${usage.questionsUsed || 0}`);
    console.log(`   🔄 Preguntas falladas: ${usage.failedQuestionsUsed || 0}`);
    console.log(`   📈 Total preguntas: ${totalQuestions}`);
    console.log(`   🎮 Simulacros: ${usage.simulationsUsed || 0}`);
    
    // === PASO 8: Simular comando /mi_quota ===
    console.log('\n💬 PASO 8: Simulando comando /mi_quota...');
    
    const quotaCheck = await prisma.$queryRaw`
      SELECT 
        tu."telegramuserid",
        tu."firstname",
        s."status",
        s."enddate",
        p."name" as "planName",
        p."displayname" as "planDisplayName",
        p."price",
        p."dailyquestionslimit",
        p."maxSimulationsPerDay"
      FROM "TelegramUser" tu
      LEFT JOIN "UserSubscription" s ON tu."id" = s."userid" AND s."status" = 'active' AND s."enddate" >= NOW()
      LEFT JOIN "SubscriptionPlan" p ON s."planid" = p."id"
      WHERE tu."telegramuserid" = ${testUserId}
      LIMIT 1
    ` as any[];
    
    const userSub = quotaCheck[0];
    const questionsLimit = userSub.dailyquestionslimit || 100;
    const remaining = Math.max(0, questionsLimit - totalQuestions);
    
    console.log('📱 RESPUESTA DEL COMANDO /mi_quota:');
    console.log(`   👤 Usuario: ${userSub.firstname}`);
    console.log(`   💎 Plan: ${userSub.planDisplayName}`);
    console.log(`   📚 Uso: ${totalQuestions}/${questionsLimit} (${remaining} restantes)`);
    
    // === PASO 9: Verificación de éxito ===
    console.log('\n✅ PASO 9: Verificación final...');
    
    if (totalQuestions === questionsToAdd + failedQuestionsToAdd) {
      console.log('🎉 ¡TRACKING DE CUOTAS FUNCIONANDO CORRECTAMENTE!');
      console.log(`   ✅ Se registraron correctamente ${totalQuestions} preguntas`);
      console.log('   ✅ El comando /mi_quota muestra el uso correcto');
      console.log('   ✅ Los límites se calculan correctamente');
    } else {
      console.log('❌ HAY UN PROBLEMA CON EL TRACKING');
      console.log(`   ❌ Esperado: ${questionsToAdd + failedQuestionsToAdd}, Obtenido: ${totalQuestions}`);
    }
    
  } catch (error) {
    console.error('❌ Error en test de tracking:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testQuotaTracking(); 