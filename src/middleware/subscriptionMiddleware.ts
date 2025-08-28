import { SubscriptionService, SubscriptionFeature } from '@/services/subscriptionService';

export interface SubscriptionCheck {
  feature: SubscriptionFeature;
  quotaAmount?: number;
  errorMessage?: string;
}

export interface MiddlewareResult {
  allowed: boolean;
  message?: string;
  requiresUpgrade?: boolean;
  currentPlan?: string;
  requiredPlan?: string;
}

/**
 * Middleware para verificar permisos de suscripción
 */
export class SubscriptionMiddleware {
  
  /**
   * Verificar si un usuario puede ejecutar un comando específico
   */
  static async checkCommandPermission(
    userid: string,
    commandName: string,
    message?: any
  ): Promise<MiddlewareResult> {
    
    // Definir qué comandos requieren qué permisos
    const commandPermissions: Record<string, SubscriptionCheck> = {
      // Comandos que requieren plan Básico o Premium
      '/falladas': {
        feature: 'failed_questions',
        errorMessage: '🥉 Las preguntas falladas requieren plan **Básico** o **Premium**'
      },
      '/falladas5': {
        feature: 'failed_questions',
        errorMessage: '🥉 Las preguntas falladas requieren plan **Básico** o **Premium**'
      },
      '/falladas10': {
        feature: 'failed_questions',
        errorMessage: '🥉 Las preguntas falladas requieren plan **Básico** o **Premium**'
      },
      '/falladas15': {
        feature: 'failed_questions',
        errorMessage: '🥉 Las preguntas falladas requieren plan **Básico** o **Premium**'
      },
      
      // Comandos que requieren plan Premium únicamente
      '/simulacro_adaptativo': {
        feature: 'simulations',
        errorMessage: '🥈 Los simulacros adaptativos requieren plan **Premium**'
      },
      '/analisis_ia': {
        feature: 'ai_analysis',
        errorMessage: '🥈 El análisis con IA requiere plan **Premium**'
      },
      '/stats_avanzadas': {
        feature: 'advanced_stats',
        errorMessage: '🥈 Las estadísticas avanzadas requieren plan **Premium**'
      },
      '/conectar_moodle': {
        feature: 'moodle_integration',
        errorMessage: '🥈 La integración con Moodle requiere plan **Premium**'
      },
      '/simulacro_personalizado': {
        feature: 'simulations',
        errorMessage: '🥈 Los simulacros personalizados requieren plan **Premium**'
      },
      
      // Comandos de simulacros militares premium
      '/simulacro_premium_et': {
        feature: 'simulations',
        errorMessage: '🥈 Los simulacros militares premium requieren plan **Premium**'
      },
      '/simulacro_premium_aire': {
        feature: 'simulations',
        errorMessage: '🥈 Los simulacros militares premium requieren plan **Premium**'
      },
      '/simulacro_premium_armada': {
        feature: 'simulations',
        errorMessage: '🥈 Los simulacros militares premium requieren plan **Premium**'
      },
      
      // Comandos de estudio con límites de cuota
      '/pdc5': {
        feature: 'questions',
        quotaAmount: 5,
        errorMessage: '📚 Has alcanzado tu límite diario de preguntas'
      },
      '/pdc10': {
        feature: 'questions',
        quotaAmount: 10,
        errorMessage: '📚 Has alcanzado tu límite diario de preguntas'
      },
      '/pdc15': {
        feature: 'questions',
        quotaAmount: 15,
        errorMessage: '📚 Has alcanzado tu límite diario de preguntas'
      }
    };

    // Si el comando no requiere permisos especiales, permitir
    if (!commandPermissions[commandName]) {
      return { allowed: true };
    }

    const permission = commandPermissions[commandName];
    
    try {
      // Verificar acceso a la funcionalidad
      const accessResult = await SubscriptionService.canUserAccessFeature(
        userid, 
        permission.feature,
        permission.quotaAmount
      );

      if (accessResult.allowed) {
        return { allowed: true };
      }

      // Si no tiene acceso, generar mensaje de error personalizado
      const upgradeMessage = this.generateUpgradeMessage(
        permission.errorMessage || 'Funcionalidad requiere suscripción',
        accessResult.currentPlan,
        accessResult.requiredPlan,
        accessResult.remainingQuota
      );

      return {
        allowed: false,
        message: upgradeMessage,
        requiresUpgrade: true,
        currentPlan: accessResult.currentPlan,
        requiredPlan: accessResult.requiredPlan
      };

    } catch (error) {
      console.error('Error verificando permisos de suscripción:', error);
      
      // En caso de error, permitir pero registrar el problema
      return { 
        allowed: true,
        message: '⚠️ Error verificando permisos. Contacta con soporte si persiste.'
      };
    }
  }

  /**
   * Generar mensaje de upgrade personalizado
   */
  private static generateUpgradeMessage(
    baseMessage: string,
    currentPlan?: string,
    requiredPlan?: string,
    remainingQuota?: number
  ): string {
    let message = `${baseMessage}\n\n`;

    // Información del plan actual
    if (currentPlan) {
      message += `📋 **Plan actual:** ${currentPlan}\n`;
    } else {
      message += `📋 **Plan actual:** Gratuito\n`;
    }

    // Información de cuota si aplica
    if (typeof remainingQuota === 'number') {
      message += `📊 **Cuota restante hoy:** ${remainingQuota} preguntas\n\n`;
    }

    // Recomendación de upgrade
    if (requiredPlan) {
      message += `🚀 **Necesitas:** Plan ${requiredPlan}\n\n`;
    } else {
      message += `🚀 **Solución:** Upgrading a plan de pago\n\n`;
    }

    // Llamadas a la acción
    message += `💰 **OPCIONES DISPONIBLES:**\n`;
    message += `🥉 /basico - Plan Básico (€4.99/mes)\n`;
    message += `🥈 /premium - Plan Premium (€9.99/mes)\n`;
    message += `📋 /planes - Ver comparativa completa\n\n`;
    
    message += `💡 **¿Dudas?** Contacta @Carlos_esp`;

    return message;
  }

  /**
   * Verificar y consumir cuota si el usuario tiene acceso
   */
  static async checkAndConsumeQuota(
    userid: string,
    feature: SubscriptionFeature,
    amount: number = 1
  ): Promise<MiddlewareResult> {
    
    try {
      // Verificar acceso
      const accessResult = await SubscriptionService.canUserAccessFeature(userid, feature, amount);
      
      if (!accessResult.allowed) {
        return {
          allowed: false,
          message: this.generateUpgradeMessage(
            'Has alcanzado tu límite diario',
            accessResult.currentPlan,
            accessResult.requiredPlan,
            accessResult.remainingQuota
          )
        };
      }

      // Si tiene acceso, consumir la cuota (solo para funcionalidades con tracking)
      const trackableFeatures: Array<'questions' | 'failed_questions' | 'simulations' | 'reports' | 'ai_analysis'> = [
        'questions', 'failed_questions', 'simulations', 'ai_analysis'
      ];
      
      if (trackableFeatures.includes(feature as any)) {
        await SubscriptionService.incrementQuotaUsage(userid, feature as any, amount);
      }
      
      return { allowed: true };

    } catch (error) {
      console.error('Error en checkAndConsumeQuota:', error);
      return { 
        allowed: true,
        message: '⚠️ Error procesando cuota. Contacta con soporte si persiste.'
      };
    }
  }

  /**
   * Middleware específico para comandos de estudio
   */
  static async checkStudyCommandPermission(
    userid: string,
    studyCommand: { subject: string; quantity: number },
    isPrivateMessage: boolean = false
  ): Promise<MiddlewareResult> {
    
    // En mensajes privados, siempre verificar suscripción
    if (isPrivateMessage) {
      return await this.checkAndConsumeQuota(userid, 'questions', studyCommand.quantity);
    }

    // En el canal público, permitir uso básico pero con límites
    // (Los usuarios gratuitos pueden usar el canal público)
    return { allowed: true };
  }

  /**
   * Middleware para comandos de simulacros
   */
  static async checkSimulationPermission(
    userid: string,
    simulationType: 'basic' | 'adaptive' | 'custom' = 'basic'
  ): Promise<MiddlewareResult> {
    
    let feature: SubscriptionFeature;
    let errorMessage: string;

    switch (simulationType) {
      case 'adaptive':
      case 'custom':
        feature = 'simulations';
        errorMessage = '🥈 Los simulacros avanzados requieren plan **Premium**';
        break;
      default:
        // Simulacros básicos requieren al menos plan Básico
        feature = 'simulations';
        errorMessage = '🥉 Los simulacros requieren plan **Básico** o **Premium**';
        break;
    }

    return await this.checkCommandPermission(userid, `/simulacro_${simulationType}`);
  }

  /**
   * Verificar si un usuario puede enviar un mensaje en privado
   */
  static async canSendPrivateMessage(userid: string): Promise<boolean> {
    try {
      const accessResult = await SubscriptionService.canUserAccessFeature(userid, 'questions');
      return accessResult.allowed;
    } catch (error) {
      console.error('Error verificando acceso a mensajes privados:', error);
      return false; // En caso de error, no permitir mensajes privados
    }
  }

  /**
   * Obtener mensaje de bienvenida personalizado según suscripción
   */
  static async getWelcomeMessage(userid: string): Promise<string> {
    try {
      const subscription = await SubscriptionService.getCurrentSubscription(userid);
      
      if (!subscription || subscription.status !== 'active') {
        return `🎉 <b>¡BIENVENIDO A OPOMELILLA!</b> 🎉

¡Hola! Te has registrado exitosamente en el plan **GRATUITO**.

🎁 <b>LO QUE PUEDES HACER GRATIS:</b>
✅ Participar en el canal público
✅ Responder preguntas del grupo
✅ Ver ranking y estadísticas básicas
✅ Participar en duelos

🚀 <b>¿QUIERES MÁS?</b>
💰 /planes - Ver planes de suscripción
🥉 /basico - Plan Básico €4.99/mes (100 preguntas/día + falladas)
🥈 /premium - Plan Premium €9.99/mes (ilimitado + Moodle + IA)

💡 <b>TIP:</b> Los suscriptores tienen acceso a preguntas privadas ilimitadas y funciones exclusivas.`;
      }

      const plan = subscription.plan;
      const daysRemaining = subscription.enddate ? 
        Math.ceil((new Date(subscription.enddate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

      return `🎉 <b>¡BIENVENIDO DE VUELTA!</b> 🎉

✅ <b>Plan activo:</b> ${plan.displayname}
📅 <b>Renovación en:</b> ${daysRemaining} días

🎯 <b>TUS BENEFICIOS ACTIVOS:</b>
${plan.canusefailedquestions ? '✅' : '❌'} Sistema de preguntas falladas
${plan.canuseadvancedstats ? '✅' : '❌'} Estadísticas avanzadas
${plan.canusesimulations ? '✅' : '❌'} Simulacros personalizados
${plan.canuseaianalysis ? '✅' : '❌'} Análisis con IA
${plan.canusemoodleintegration ? '✅' : '❌'} Integración Moodle

🚀 <b>COMANDOS DISPONIBLES:</b>
📚 Comandos de estudio privados (/pdc5, /pdc10, etc.)
📊 /mi_plan - Ver estado detallado
💰 /facturas - Ver historial de pagos

¡Disfruta de tu suscripción Premium! 💎`;

    } catch (error) {
      console.error('Error generando mensaje de bienvenida:', error);
      return `🎉 <b>¡BIENVENIDO A OPOMELILLA!</b> 🎉

¡Hola! Te has registrado exitosamente.

🚀 Usa /help para ver todos los comandos disponibles.`;
    }
  }
} 