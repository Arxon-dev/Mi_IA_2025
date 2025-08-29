import { prisma } from '@/lib/prisma';

export class SubscriptionPlanService {
  
  /**
   * Obtener o crear plan de suscripción
   */
  static async getOrCreatePlan(planName: 'basic' | 'premium') {
    try {
      console.log(`🔍 Buscando plan ${planName}...`);
      
      // ✅ CORREGIR: Buscar SIN filtro isactive primero
      let plan = await prisma.subscriptionplan.findFirst({
        where: { 
          name: planName
          // ❌ Quitar: isactive: true
        }
      });
  
      if (plan) {
        console.log(`✅ Plan ${planName} encontrado:`, plan.id);
        return plan;
      }
  
      // Solo crear si realmente no existe
      console.log(`🆕 Creando plan ${planName}...`);
      const planData = this.getPlanData(planName);
      
      plan = await prisma.subscriptionplan.create({
        data: {
          id: require('crypto').randomUUID(),
          ...planData,
          createdat: new Date(),
          updatedat: new Date()
        }
      });
      
      console.log(`✅ Plan ${planName} creado exitosamente:`, plan.id);
      return plan;
      
    } catch (error: any) {
      if (error.code === 'P2002') {
        // Si hay conflicto, buscar el plan existente
        console.log(`🔄 Plan ${planName} ya existe, buscando...`);
        
        const existingPlan = await prisma.subscriptionplan.findFirst({
          where: { name: planName }
        });
        
        if (existingPlan) {
          console.log(`✅ Plan ${planName} encontrado después del conflicto:`, existingPlan.id);
          return existingPlan;
        }
      }
      
      console.error('❌ Error obteniendo/creando plan:', error);
      throw error;
    }
  }

  /**
   * Obtener datos del plan según el tipo
   */
  private static getPlanData(planName: 'basic' | 'premium') {
    if (planName === 'basic') {
      return {
        name: 'basic',
        displayname: 'Básico',
        description: '100 preguntas/día, sistema de preguntas falladas, estadísticas básicas',
        price: 4.99,
        currency: 'EUR',
        billingperiod: 'monthly', // ✅ CORREGIDO: era billingPeriod
        dailyquestionslimit: 100,
        monthlyquestionslimit: 3000, // ✅ CORREGIDO: era monthlyQuestionsLimit
        canusefailedquestions: true,
        canuseadvancedstats: false,
        canusesimulations: true,
        canuseaianalysis: false,
        canusecustomexams: false, // ✅ CORREGIDO: era canUseCustomExams
        canusemoodleintegration: false,
        maxsimulationsperday: 1, // ✅ CORREGIDO: era maxSimulationsPerDay
        maxreportspermonth: 4, // ✅ CORREGIDO: era maxReportsPerMonth
        isactive: true
      };
    } else {
      return {
        name: 'premium',
        displayname: 'Premium',
        description: 'Preguntas ilimitadas, integración Moodle, estadísticas avanzadas, simulacros personalizados, análisis IA',
        price: 9.99,
        currency: 'EUR',
        billingperiod: 'monthly', // ✅ CORREGIDO: era billingPeriod
        dailyquestionslimit: null, // ilimitado
        monthlyquestionslimit: null, // ✅ CORREGIDO: era monthlyQuestionsLimit
        canusefailedquestions: true,
        canuseadvancedstats: true,
        canusesimulations: true,
        canuseaianalysis: true,
        canusecustomexams: true, // ✅ CORREGIDO: era canUseCustomExams
        canusemoodleintegration: true,
        maxsimulationsperday: null, // ✅ CORREGIDO: era maxSimulationsPerDay
        maxreportspermonth: null, // ✅ CORREGIDO: era maxReportsPerMonth
        isactive: true
      };
    }
  }

  /**
   * Inicializar planes básicos si no existen
   */
  static async initializePlans() {
    try {
      console.log('🎯 Inicializando planes de suscripción...');
      
      await this.getOrCreatePlan('basic');
      await this.getOrCreatePlan('premium');
      
      console.log('✅ Planes de suscripción inicializados');
      
    } catch (error) {
      console.error('❌ Error inicializando planes:', error);
      throw error;
    }
  }

  /**
   * Obtener plan por ID
   */
  static async getPlanById(planId: string) {
    try {
      const plan = await prisma.$queryRaw`
        SELECT * FROM \`subscriptionplan\` 
        WHERE \`id\` = ${planId}
        LIMIT 1
      ` as any[];

      return plan && plan.length > 0 ? plan[0] : null;
    } catch (error) {
      console.error('❌ Error obteniendo plan por ID:', error);
      return null;
    }
  }
}