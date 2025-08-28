import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { telegramuser, subscriptionplan, usersubscription, paymenttransaction, userquotausage } from '@prisma/client';

export type SubscriptionFeature = 
  | 'questions' 
  | 'failed_questions' 
  | 'advanced_stats' 
  | 'simulations' 
  | 'ai_analysis'
  | 'custom_exams'
  | 'moodle_integration';

export interface FeatureAccessResult {
  allowed: boolean;
  reason?: string;
  upgradeUrl?: string;
  currentPlan?: string;
  requiredPlan?: string;
  remainingQuota?: number;
}

export interface QuotaInfo {
  questions: number | null; // null = ilimitado
  simulations: number | null;
  reports: number | null;
  aiAnalysis: number | null;
}

// Tipo personalizado para plan simulado
interface SimulatedPlan {
  name: string;
  displayname: string;
  canusefailedquestions: boolean;
  canuseadvancedstats: boolean;
  canusesimulations: boolean;
  canuseaianalysis: boolean;
  canusecustomexams: boolean;
  canusemoodleintegration: boolean;
  dailyquestionslimit: number | null;
  maxsimulationsperday: number | null;
  maxreportspermonth?: number | null;
}

export class SubscriptionService {
  
  /**
   * Verificar si un usuario puede acceder a una funcionalidad específica
   */
  static async canUserAccessFeature(
    userid: string, 
    feature: SubscriptionFeature,
    requestedAmount: number = 1
  ): Promise<FeatureAccessResult> {
    try {
      // Buscar usuario y suscripción usando SQL directo (incluyendo canceladas válidas)
      const userResults = await prisma.$queryRaw`
        SELECT 
          tu.*,
          s.*,
          p."name" as "planName",
          p."displayname" as "planDisplayName",
          p."canusefailedquestions",
          p."canuseadvancedstats",
          p."canusesimulations",
          p."canuseaianalysis",
          p."canUseCustomExams",
          p."canusemoodleintegration",
          p."dailyquestionslimit",
          p."maxSimulationsPerDay"
        FROM "TelegramUser" tu
        LEFT JOIN "UserSubscription" s ON tu."id" = s."userid" 
          AND (s."status" = 'active' OR (s."status" = 'cancelled' AND s."enddate" >= NOW()))
        LEFT JOIN "SubscriptionPlan" p ON s."planid" = p."id"
        WHERE tu."telegramuserid" = ${userid}
        ORDER BY s."createdat" DESC
        LIMIT 1
      ` as any[];

      const userResult = userResults[0];
      
      if (!userResult) {
        return {
          allowed: false,
          reason: 'Usuario no encontrado',
        };
      }

      // Si no tiene suscripción activa, está en plan gratuito (muy limitado)
      if (!userResult.planName) {
        return await this.checkFreeUserAccess(feature, requestedAmount);
      }

      // Crear objetos simulados para compatibilidad
      const plan: SimulatedPlan = {
        name: userResult.planName,
        displayname: userResult.planDisplayName,
        canusefailedquestions: userResult.canusefailedquestions,
        canuseadvancedstats: userResult.canuseadvancedstats,
        canusesimulations: userResult.canusesimulations,
        canuseaianalysis: userResult.canuseaianalysis,
        canusecustomexams: userResult.canUseCustomExams,
        canusemoodleintegration: userResult.canusemoodleintegration,
        dailyquestionslimit: userResult.dailyquestionslimit,
        maxsimulationsperday: userResult.maxSimulationsPerDay
      };

      // Verificar si el plan permite la funcionalidad
      const featureAllowed = this.isPlanFeatureEnabled(plan, feature);
      if (!featureAllowed) {
        return {
          allowed: false,
          reason: `Funcionalidad no disponible en plan ${plan.displayname}`,
          currentPlan: plan.displayname,
          requiredPlan: this.getRequiredPlanForFeature(feature),
          upgradeUrl: '/premium'
        };
      }

      // Si es Premium, todo está permitido sin límites
      if (plan.name === 'premium') {
        return { allowed: true };
      }

      // Para plan Básico, verificar cuotas diarias
      if (plan.name === 'basic') {
        return await this.checkBasicPlanQuota(userid, feature, requestedAmount, plan);
      }

      return { allowed: true };

    } catch (error) {
      console.error('Error verificando acceso a funcionalidad:', error);
      return {
        allowed: false,
        reason: 'Error interno verificando permisos'
      };
    }
  }

  /**
   * Verificar acceso para usuarios gratuitos (sin suscripción)
   */
  private static async checkFreeUserAccess(
    feature: SubscriptionFeature, 
    requestedAmount: number
  ): Promise<FeatureAccessResult> {
    // Los usuarios gratuitos solo pueden ver preguntas del canal público
    if (feature === 'questions') {
      return {
        allowed: false,
        reason: 'Las preguntas privadas requieren suscripción',
        requiredPlan: 'Básico',
        upgradeUrl: '/basico'
      };
    }

    return {
      allowed: false,
      reason: `La funcionalidad requiere suscripción`,
      requiredPlan: this.getRequiredPlanForFeature(feature),
      upgradeUrl: feature === 'moodle_integration' ? '/premium' : '/basico'
    };
  }

  /**
   * Verificar cuotas para plan Básico
   */
  private static async checkBasicPlanQuota(
    userid: string,
    feature: SubscriptionFeature,
    requestedAmount: number,
    plan: SimulatedPlan
  ): Promise<FeatureAccessResult> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Obtener uso actual del día
    const todayUsage = await prisma.userquotausage.findFirst({
      where: {
        userid: userid,
        date: today
      }
    });

          const currentUsage = todayUsage || {
        questionsused: 0,
        failedquestionsused: 0,
        simulationsused: 0,
        reportsgenerated: 0,
        aianalysisused: 0
      };

    // Verificar límites según funcionalidad
    switch (feature) {
      case 'questions':
      case 'failed_questions':
        const totalQuestionsUsed = currentUsage.questionsused + currentUsage.failedquestionsused;
        const limit = plan.dailyquestionslimit || 100;
        if (totalQuestionsUsed + requestedAmount > limit) {
          // 🔔 Enviar notificación de límite alcanzado (import dinámico para evitar dependencias circulares)
          this.sendQuotaLimitNotificationAsync(userid, 'questions', totalQuestionsUsed, limit);
          
                      return {
              allowed: false,
              reason: `Límite diario alcanzado (${limit} preguntas/día)`,
              currentPlan: plan.displayname,
              requiredPlan: 'Premium',
              remainingQuota: Math.max(0, limit - totalQuestionsUsed),
              upgradeUrl: '/premium'
            };
        }
        break;

      case 'simulations':
        const simulationsLimit = plan.maxsimulationsperday || 1;
        if (currentUsage.simulationsused + requestedAmount > simulationsLimit) {
          return {
            allowed: false,
            reason: `Límite diario de simulacros alcanzado (${simulationsLimit}/día)`,
            currentPlan: plan.displayname,
            requiredPlan: 'Premium',
            remainingQuota: Math.max(0, simulationsLimit - currentUsage.simulationsused),
            upgradeUrl: '/premium'
          };
        }
        break;

      case 'advanced_stats':
      case 'ai_analysis':
      case 'custom_exams':
      case 'moodle_integration':
        return {
          allowed: false,
          reason: `Funcionalidad solo disponible en Premium`,
          currentPlan: plan.displayname,
          requiredPlan: 'Premium',
          upgradeUrl: '/premium'
        };
    }

    return { allowed: true };
  }

  /**
   * Verificar si un plan tiene habilitada una funcionalidad
   */
  private static isPlanFeatureEnabled(plan: SimulatedPlan, feature: SubscriptionFeature): boolean {
    switch (feature) {
      case 'questions':
      case 'failed_questions':
        return plan.canusefailedquestions;
      case 'advanced_stats':
        return plan.canuseadvancedstats;
      case 'simulations':
        return plan.canusesimulations;
      case 'ai_analysis':
        return plan.canuseaianalysis;
      case 'custom_exams':
        return plan.canusecustomexams;
      case 'moodle_integration':
        return plan.canusemoodleintegration;
      default:
        return false;
    }
  }

  /**
   * Obtener el plan mínimo requerido para una funcionalidad
   */
  private static getRequiredPlanForFeature(feature: SubscriptionFeature): string {
    switch (feature) {
      case 'questions':
      case 'failed_questions':
        return 'Básico';
      case 'advanced_stats':
      case 'simulations':
      case 'ai_analysis':
      case 'custom_exams':
      case 'moodle_integration':
        return 'Premium';
      default:
        return 'Básico';
    }
  }

  /**
   * Incrementar el uso de cuota para una funcionalidad
   */
  static async incrementQuotaUsage(
    telegramuserid: string, 
    type: 'questions' | 'failed_questions' | 'simulations' | 'reports' | 'ai_analysis',
    amount: number = 1
  ): Promise<void> {
    try {
      const user = await prisma.telegramuser.findUnique({
        where: { telegramuserid: telegramuserid }
      });

      if (!user) {
        // Usuario no encontrado, no hacer tracking
        return;
      }

      // Buscar suscripción activa del usuario
      const subscription = await prisma.usersubscription.findUnique({
        where: { userid: user.id }
      });

      if (!subscription) {
        // Usuario sin suscripción, no hacer tracking
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Buscar registro existente
      const existingUsage = await prisma.userquotausage.findFirst({
        where: {
          userid: user.id,
          date: today
        }
      });

      if (existingUsage) {
        // Actualizar registro existente
        await prisma.userquotausage.update({
          where: {
            id: existingUsage.id
          },
          data: {
            [this.getUsageField(type)]: {
              increment: amount
            },
            updatedat: new Date()
          }
        });
      } else {
        // Crear nuevo registro
        await prisma.userquotausage.create({
          data: {
            id: require('crypto').randomUUID(),
            userid: user.id,
            subscriptionid: subscription.id,
            date: today,
            [this.getUsageField(type)]: amount,
            createdat: new Date(),
            updatedat: new Date()
          }
        });
      }

    } catch (error) {
      console.error('Error incrementando cuota de uso:', error);
      // No lanzar error para no bloquear la funcionalidad
    }
  }

  /**
   * Mapear tipo de uso a campo de BD
   */
  private static getUsageField(type: string): string {
    const mapping: Record<string, string> = {
      'questions': 'questionsused',
      'failed_questions': 'failedquestionsused',
      'simulations': 'simulationsused',
      'reports': 'reportsgenerated',
      'ai_analysis': 'aianalysisused'
    };
    return mapping[type] || 'questionsused';
  }

  /**
   * Obtener suscripción actual del usuario
   */
  static async getCurrentSubscription(userid: string): Promise<usersubscription | null> {
    try {
      return await prisma.usersubscription.findFirst({
        where: { 
          userid: userid,
          OR: [
            { status: 'active' },
            { 
              status: 'cancelled',
              enddate: {
                gte: new Date() // Canceladas pero aún válidas
              }
            }
          ]
        },
        orderBy: {
          createdat: 'desc' // La más reciente primero
        }
      });
    } catch (error) {
      console.error('Error obteniendo suscripción actual:', error);
      return null;
    }
  }

  /**
   * Obtener estadísticas de uso del usuario
   */
  static async getUsageStats(userid: string, date?: Date): Promise<userquotausage | null> {
    try {
      const targetDate = date || new Date();
      targetDate.setHours(0, 0, 0, 0);

      return await prisma.userquotausage.findFirst({
        where: {
          userid: userid,
          date: targetDate
        }
      });
    } catch (error) {
      console.error('Error obteniendo estadísticas de uso:', error);
      return null;
    }
  }

  /**
   * Obtener información de cuota del usuario (alias para getRemainingQuota)
   */
  static async getUserQuota(userid: string): Promise<QuotaInfo> {
    return await this.getRemainingQuota(userid);
  }

  /**
   * Obtener cuota restante del usuario
   */
  static async getRemainingQuota(userid: string): Promise<QuotaInfo> {
    try {
      const subscription = await this.getCurrentSubscription(userid);
      
      // Verificar si la suscripción es válida (activa o cancelada pero no expirada)
      if (!subscription || 
          (subscription.status !== 'active' && 
           (subscription.status !== 'cancelled' || !subscription.enddate || subscription.enddate < new Date()))) {
        return {
          questions: 0,
          simulations: 0,
          reports: 0,
          aiAnalysis: 0
        };
      }

      // Obtener el plan por separado
      const plan = await prisma.subscriptionplan.findUnique({
        where: { id: subscription.planid }
      });

      if (!plan) {
        return {
          questions: 0,
          simulations: 0,
          reports: 0,
          aiAnalysis: 0
        };
      }

      // Si es Premium, todo ilimitado
      if (plan.name === 'premium') {
        return {
          questions: null,
          simulations: null,
          reports: null,
          aiAnalysis: null
        };
      }

      // Para plan Básico, calcular restante
      const usage = await this.getUsageStats(userid);
      const usedQuestions = (usage?.questionsused || 0) + (usage?.failedquestionsused || 0);
      const usedSimulations = usage?.simulationsused || 0;
      const usedReports = usage?.reportsgenerated || 0;
      const usedAI = usage?.aianalysisused || 0;

      return {
        questions: Math.max(0, (plan.dailyquestionslimit || 100) - usedQuestions),
        simulations: Math.max(0, (plan.maxsimulationsperday || 1) - usedSimulations),
        reports: Math.max(0, (plan.maxreportspermonth || 4) - usedReports),
        aiAnalysis: plan.canuseaianalysis ? null : 0
      };

    } catch (error) {
      console.error('Error calculando cuota restante:', error);
      return {
        questions: 0,
        simulations: 0,
        reports: 0,
        aiAnalysis: 0
      };
    }
  }

  /**
   * Actualizar suscripción del usuario
   */
  static async upgradeSubscription(userid: string, newPlanId: string): Promise<boolean> {
    try {
      const user = await prisma.telegramuser.findUnique({
        where: { id: userid }
      });

      if (!user) {
        return false;
      }

      const newPlan = await prisma.subscriptionplan.findUnique({
        where: { id: newPlanId }
      });

      if (!newPlan) {
        return false;
      }

      const now = new Date();
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + 1); // 1 mes desde ahora

      // Buscar suscripción existente
      const existingSubscription = await prisma.usersubscription.findUnique({
        where: { userid: userid }
      });

      if (existingSubscription) {
        // Actualizar suscripción existente
        await prisma.usersubscription.update({
          where: { id: existingSubscription.id },
          data: {
            planid: newPlanId,
            status: 'active',
            startdate: now,
            enddate: endDate,
            updatedat: now
          }
        });
      } else {
        // Crear nueva suscripción
        await prisma.usersubscription.create({
          data: {
            id: require('crypto').randomUUID(),
            userid: userid,
            planid: newPlanId,
            status: 'active',
            startdate: now,
            enddate: endDate,
            updatedat: now
          }
        });
      }

      return true;

    } catch (error) {
      console.error('Error actualizando suscripción:', error);
      return false;
    }
  }

  /**
   * Cancelar suscripción del usuario
   */
  static async cancelSubscription(userid: string, reason?: string): Promise<boolean> {
    try {
      const subscription = await prisma.usersubscription.findUnique({
        where: { userid: userid }
      });

      if (!subscription) {
        return false;
      }

      await prisma.usersubscription.update({
        where: { id: subscription.id },
        data: {
          status: 'cancelled',
          autorenew: false,
          cancelreason: reason,
          updatedat: new Date()
        }
      });

      return true;

    } catch (error) {
      console.error('Error cancelando suscripción:', error);
      return false;
    }
  }

  /**
   * Renovar suscripción
   */
  static async renewSubscription(subscriptionId: string): Promise<boolean> {
    try {
      const subscription = await prisma.usersubscription.findUnique({
        where: { id: subscriptionId }
      });

      if (!subscription) {
        return false;
      }

      const now = new Date();
      const newEndDate = new Date(subscription.enddate || now);
      newEndDate.setMonth(newEndDate.getMonth() + 1);

      await prisma.usersubscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'active',
          enddate: newEndDate,
          lastpaymentdate: now,
          nextpaymentdate: newEndDate,
          updatedat: now
        }
      });

      return true;

    } catch (error) {
      console.error('Error renovando suscripción:', error);
      return false;
    }
  }

  /**
   * Obtener todos los planes disponibles
   */
  static async getAvailablePlans(): Promise<subscriptionplan[]> {
    try {
      return await prisma.subscriptionplan.findMany({
        where: { isactive: true },
        orderBy: { price: 'asc' }
      });
    } catch (error) {
      console.error('Error obteniendo planes:', error);
      return [];
    }
  }

  /**
   * Crear planes iniciales si no existen
   */
  // ❌ ELIMINAR ESTA FUNCIÓN COMPLETA (líneas 628-694)
  // static async createInitialPlans(): Promise<void> {
  //   ... toda la función
  // }

  /**
   * 🔔 Enviar notificación de límite de quota de forma asíncrona (FASE 2)
   */
  private static sendQuotaLimitNotificationAsync(
    userid: string, 
    limitType: 'questions' | 'simulations', 
    currentUsage: number, 
    limit: number
  ): void {
    // Import dinámico para evitar dependencias circulares
    import('@/services/subscriptionNotificationService').then(({ SubscriptionNotificationService }) => {
      SubscriptionNotificationService.sendQuotaLimitNotification(userid, limitType, currentUsage, limit)
        .catch(error => console.error('❌ Error enviando notificación de límite:', error));
    }).catch(error => console.error('❌ Error importando servicio de notificaciones:', error));
  }
}