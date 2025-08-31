import { prisma } from '../lib/prisma';
// Evitar dependencia circular - usar lazy loading
// import { NotificationService } from './notificationService';

// Tipos para el sistema de alertas inteligentes
type AlertType = 
  | 'PERFORMANCE_DROP'
  | 'INACTIVITY_WARNING'
  | 'RESPONSE_TIME_INCREASE'
  | 'STREAK_BREAK_RISK'
  | 'DIFFICULTY_REGRESSION'
  | 'MOTIVATIONAL_BOOST'
  | 'STUDY_FREQUENCY_DROP';

interface PerformanceMetrics {
  accuracyTrend: number; // Tendencia de precisión (-1 a 1)
  studyFrequency: number; // Preguntas por día promedio
  averageResponseTime: number; // Tiempo promedio de respuesta en segundos
  currentStreak: number; // Racha actual de días activos
  difficultyProgression: number; // Progresión en dificultad
  engagementScore: number; // Puntuación de engagement (0-100)
}

interface AlertRule {
  id: string;
  type: AlertType;
  condition: (metrics: PerformanceMetrics, historical: PerformanceMetrics) => boolean;
  message: (userName: string, metrics: PerformanceMetrics, historical?: PerformanceMetrics) => string;
  cooldown: number; // Tiempo en horas antes de poder enviar otra alerta del mismo tipo
  priority: 'low' | 'medium' | 'high';
}

interface UserAlert {
  userId: string;
  type: AlertType;
  message: string;
  metrics: PerformanceMetrics;
  scheduledFor: Date;
  sent: boolean;
}

/**
 * 🧠 Servicio de Alertas Inteligentes
 * 
 * Monitoriza el rendimiento del usuario y envía notificaciones personalizadas
 * cuando detecta patrones que requieren intervención o motivación.
 */
export class IntelligentAlertsService {
  private alertRules: AlertRule[] = [];
  private notificationService: any = null; // Lazy loading

  constructor() {
    this.initializeAlertRules();
  }

  /**
   * 🔄 Obtener instancia de NotificationService con lazy loading
   */
  private async getNotificationService() {
    if (!this.notificationService) {
      const { NotificationService } = await import('./notificationService');
      this.notificationService = new NotificationService();
    }
    return this.notificationService;
  }

  /**
   * 🔧 Inicializar reglas de alertas
   */
  private initializeAlertRules(): void {
    this.alertRules = [
      {
        id: 'performance_drop',
        type: 'PERFORMANCE_DROP',
        condition: (current, historical) => {
          return current.accuracyTrend < -0.15 && historical.accuracyTrend > 0;
        },
        message: (userName, metrics) => 
          `📉 <b>${userName}</b>, he notado que tu precisión ha bajado un ${Math.abs(metrics.accuracyTrend * 100).toFixed(1)}% en tus sesiones de estudio y participación en el grupo.

` +
          `💪 ¡No te desanimes! Todos tenemos días difíciles. ¿Qué tal si repasas las preguntas falladas?

` +
          `🎯 Usa <code>/falladas10</code> para practicar tus errores más recientes.`,
        cooldown: 12, // 12 horas
        priority: 'high'
      },
      {
        id: 'inactivity_warning',
        type: 'INACTIVITY_WARNING',
        condition: (current, historical) => {
          return current.studyFrequency < 5 && historical.studyFrequency > 15;
        },
        message: (userName, metrics, historical) => 
          `⏰ <b>${userName}</b>, hace tiempo que no te veo por aquí...

` +
          `📚 Tu actividad (estudio + grupo) ha bajado de ${historical?.studyFrequency?.toFixed(0) || 'N/A'} a ${metrics.studyFrequency.toFixed(0)} preguntas por día.

` +
          `🚀 ¡Vamos! Solo 10 minutos al día pueden marcar la diferencia. ¿Empezamos con <code>/random10</code>?`,
        cooldown: 24, // 24 horas
        priority: 'medium'
      },
      {
        id: 'response_time_increase',
        type: 'RESPONSE_TIME_INCREASE',
        condition: (current, historical) => {
          return current.averageResponseTime > historical.averageResponseTime * 1.5 && 
                 current.averageResponseTime > 45; // Más de 45 segundos
        },
        message: (userName, metrics) => 
          `⏱️ <b>${userName}</b>, veo que estás tardando más en responder las preguntas tanto en sesiones como en el grupo.

` +
          `🤔 Tu tiempo promedio ha aumentado a ${metrics.averageResponseTime.toFixed(0)} segundos.

` +
          `💡 ¿Necesitas repasar algún tema específico? Usa <code>/temas</code> para ver las opciones disponibles.`,
        cooldown: 8, // 8 horas
        priority: 'low'
      },
      {
        id: 'streak_break_risk',
        type: 'STREAK_BREAK_RISK',
        condition: (current, historical) => {
          const now = new Date();
          const lastActivity = new Date(); // Se calculará desde la base de datos
          const hoursSinceLastActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);
          return current.currentStreak > 3 && hoursSinceLastActivity > 20;
        },
        message: (userName, metrics) => 
          `🔥 <b>${userName}</b>, ¡cuidado con tu racha de ${metrics.currentStreak} días!\n\n` +
          `⚠️ Llevas más de 20 horas sin actividad. No dejes que se rompa ahora.\n\n` +
          `🎯 Una pregunta rápida: <code>/random1</code> ¡y mantienes tu racha viva!`,
        cooldown: 6, // 6 horas
        priority: 'high'
      },
      {
        id: 'motivational_boost',
        type: 'MOTIVATIONAL_BOOST',
        condition: (current, historical) => {
          return current.accuracyTrend > 0.1 && current.studyFrequency > historical.studyFrequency * 1.2;
        },
        message: (userName, metrics) => 
          `🚀 <b>${userName}</b>, ¡estás en racha! Tu rendimiento ha mejorado un ${(metrics.accuracyTrend * 100).toFixed(1)}% en sesiones y grupo.

` +
          `📈 Además, estás muy activo con ${metrics.studyFrequency.toFixed(0)} preguntas por día.

` +
          `🏆 ¡Sigue así! ¿Te animas con un desafío? Prueba <code>/dificil20</code>`,
        cooldown: 48, // 48 horas
        priority: 'low'
      },
      {
        id: 'study_frequency_drop',
        type: 'STUDY_FREQUENCY_DROP',
        condition: (current, historical) => {
          return current.studyFrequency < historical.studyFrequency * 0.5 && 
                 historical.studyFrequency > 10;
        },
        message: (userName, metrics, historical) => 
          `📊 <b>${userName}</b>, he notado un cambio en tu rutina de estudio y participación.

` +
          `📉 Tu actividad total ha pasado de ${historical?.studyFrequency.toFixed(0) || 'N/A'} a ${metrics.studyFrequency.toFixed(0)} preguntas por día.

` +
          `🎯 ¿Todo bien? Recuerda que la constancia es clave. ¡Vamos paso a paso!`,
        cooldown: 18, // 18 horas
        priority: 'medium'
      }
    ];
  }

  /**
   * 📊 Calcular métricas de rendimiento para un usuario
   */
  async calculatePerformanceMetrics(userId: string, days: number = 7): Promise<PerformanceMetrics> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

      // Obtener respuestas combinadas de sesiones de estudio y grupo de Telegram
      const responses = await prisma.$queryRaw`
        SELECT 
          userid,
          questionid,
          iscorrect,
          responsetime,
          answeredat,
          'study' as source,
          subject
        FROM studyresponse 
        WHERE userid = ${userId} 
          AND answeredat >= ${startDate} 
          AND answeredat <= ${endDate}
          AND answeredat IS NOT NULL
        
        UNION ALL
        
        SELECT 
          userid,
          questionid,
          iscorrect,
          responsetime,
          answeredat,
          'telegram' as source,
          NULL as subject
        FROM telegramresponse 
        WHERE userid = ${userId} 
          AND answeredat >= ${startDate} 
          AND answeredat <= ${endDate}
        
        ORDER BY answeredat ASC
      ` as any[];

      if (responses.length === 0) {
        return {
          accuracyTrend: 0,
          studyFrequency: 0,
          averageResponseTime: 0,
          currentStreak: 0,
          difficultyProgression: 0,
          engagementScore: 0
        };
      }

      // Calcular tendencia de precisión
      const accuracyTrend = this.calculateAccuracyTrend(responses);

      // Calcular frecuencia de estudio
      const studyFrequency = responses.length / days;

      // Calcular tiempo promedio de respuesta
      const responseTimes = responses
        .filter(r => r.responsetime && r.responsetime > 0)
        .map(r => r.responsetime!);
      const averageResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
        : 0;

      // Calcular racha actual
      const currentStreak = await this.calculateCurrentStreak(userId);

      // Calcular progresión de dificultad
      const difficultyProgression = this.calculateDifficultyProgression(responses);

      // Calcular puntuación de engagement
      const engagementScore = this.calculateEngagementScore({
        accuracyTrend,
        studyFrequency,
        averageResponseTime,
        currentStreak,
        difficultyProgression
      });

      return {
        accuracyTrend,
        studyFrequency,
        averageResponseTime,
        currentStreak,
        difficultyProgression,
        engagementScore
      };

    } catch (error) {
      console.error('❌ Error calculando métricas de rendimiento:', error);
      return {
        accuracyTrend: 0,
        studyFrequency: 0,
        averageResponseTime: 0,
        currentStreak: 0,
        difficultyProgression: 0,
        engagementScore: 0
      };
    }
  }

  /**
   * 📈 Calcular tendencia de precisión usando regresión lineal simple
   */
  private calculateAccuracyTrend(responses: any[]): number {
    if (responses.length < 5) return 0;

    // Agrupar por día y calcular precisión diaria
    const dailyAccuracy: { [key: string]: { correct: number; total: number } } = {};
    
    responses.forEach(response => {
      const day = response.answeredat.toISOString().split('T')[0];
      if (!dailyAccuracy[day]) {
        dailyAccuracy[day] = { correct: 0, total: 0 };
      }
      dailyAccuracy[day].total++;
      if (response.iscorrect) {
        dailyAccuracy[day].correct++;
      }
    });

    const days = Object.keys(dailyAccuracy).sort();
    if (days.length < 3) return 0;

    const accuracyPoints = days.map((day, index) => ({
      x: index,
      y: dailyAccuracy[day].correct / dailyAccuracy[day].total
    }));

    // Regresión lineal simple
    const n = accuracyPoints.length;
    const sumX = accuracyPoints.reduce((sum, point) => sum + point.x, 0);
    const sumY = accuracyPoints.reduce((sum, point) => sum + point.y, 0);
    const sumXY = accuracyPoints.reduce((sum, point) => sum + point.x * point.y, 0);
    const sumXX = accuracyPoints.reduce((sum, point) => sum + point.x * point.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    // Normalizar la pendiente a un rango de -1 a 1
    return Math.max(-1, Math.min(1, slope * 10));
  }

  /**
   * 🔥 Calcular racha actual de días activos
   */
  private async calculateCurrentStreak(userId: string): Promise<number> {
    try {
      const user = await prisma.telegramuser.findUnique({
        where: { id: userId },
        select: { currentstreak: true }
      });

      return user?.currentstreak || 0;
    } catch (error) {
      console.error('❌ Error calculando racha actual:', error);
      return 0;
    }
  }

  /**
   * 📊 Calcular progresión de dificultad
   */
  private calculateDifficultyProgression(responses: any[]): number {
    if (responses.length < 10) return 0;

    // Dividir respuestas en dos mitades
    const midPoint = Math.floor(responses.length / 2);
    const firstHalf = responses.slice(0, midPoint);
    const secondHalf = responses.slice(midPoint);

    // Calcular precisión de cada mitad
    const firstHalfAccuracy = firstHalf.filter(r => r.iscorrect).length / firstHalf.length;
    const secondHalfAccuracy = secondHalf.filter(r => r.iscorrect).length / secondHalf.length;

    // Si la precisión se mantiene o mejora, hay progresión positiva
    return secondHalfAccuracy - firstHalfAccuracy;
  }

  /**
   * 🎯 Calcular puntuación de engagement
   */
  private calculateEngagementScore(metrics: Omit<PerformanceMetrics, 'engagementScore'>): number {
    let score = 50; // Base score

    // Frecuencia de estudio (0-30 puntos)
    score += Math.min(30, metrics.studyFrequency * 2);

    // Tendencia de precisión (0-20 puntos)
    score += metrics.accuracyTrend * 20;

    // Racha actual (0-20 puntos)
    score += Math.min(20, metrics.currentStreak * 2);

    // Progresión de dificultad (0-15 puntos)
    score += metrics.difficultyProgression * 15;

    // Tiempo de respuesta (penalización por lentitud)
    if (metrics.averageResponseTime > 60) {
      score -= Math.min(15, (metrics.averageResponseTime - 60) / 10);
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 🔍 Verificar si se debe enviar una alerta
   */
  async checkForAlerts(userId: string): Promise<UserAlert[]> {
    try {
      const currentMetrics = await this.calculatePerformanceMetrics(userId, 7);
      const historicalMetrics = await this.calculatePerformanceMetrics(userId, 30);
      
      const alerts: UserAlert[] = [];

      for (const rule of this.alertRules) {
        // Verificar si ya se envió una alerta de este tipo recientemente
        const recentAlert = await this.getRecentAlert(userId, rule.type, rule.cooldown);
        if (recentAlert) continue;

        // Verificar condición
        if (rule.condition(currentMetrics, historicalMetrics)) {
          const user = await prisma.telegramuser.findUnique({
            where: { id: userId },
            select: { firstname: true, username: true }
          });

          const userName = user?.firstname || user?.username || 'Usuario';
          const message = rule.message(userName, currentMetrics, historicalMetrics);

          alerts.push({
            userId,
            type: rule.type,
            message,
            metrics: currentMetrics,
            scheduledFor: new Date(),
            sent: false
          });
        }
      }

      return alerts;
    } catch (error) {
      console.error('❌ Error verificando alertas:', error);
      return [];
    }
  }

  /**
   * 🔍 Obtener alerta reciente del mismo tipo
   */
  private async getRecentAlert(userId: string, type: AlertType, cooldownHours: number): Promise<boolean> {
    try {
      const cutoffTime = new Date(Date.now() - (cooldownHours * 60 * 60 * 1000));
      
      const recentAlert = await prisma.notificationevent.findFirst({
        where: {
          userid: userId,
          type: type as any,
          createdat: {
            gte: cutoffTime
          }
        }
      });

      return !!recentAlert;
    } catch (error) {
      console.error('❌ Error verificando alertas recientes:', error);
      return false;
    }
  }

  /**
   * 📤 Enviar alertas a usuarios
   */
  async sendAlert(alert: UserAlert): Promise<boolean> {
    try {
      // Obtener información del usuario y sus preferencias de notificaciones
      const user = await prisma.telegramuser.findUnique({
        where: { id: alert.userId },
        select: { telegramuserid: true, firstname: true, username: true }
      });

      if (!user) {
        console.error(`❌ Usuario no encontrado: ${alert.userId}`);
        return false;
      }

      // Verificar preferencias de notificaciones del usuario
      const notificationSettings = await prisma.usernotificationsettings.findUnique({
        where: { userid: alert.userId },
        select: { 
          intelligentalertsnotifications: true,
          notificationstarthour: true,
          notificationendhour: true,
          maxnotificationsperday: true
        }
      });

      // Si el usuario tiene desactivadas las alertas inteligentes, no enviar
      if (notificationSettings && !notificationSettings.intelligentalertsnotifications) {
        console.log(`⏭️ Usuario ${user.firstname || user.username} tiene desactivadas las alertas inteligentes`);
        return false;
      }

      // Verificar horario permitido para notificaciones
      const currentHour = new Date().getHours();
      const startHour = notificationSettings?.notificationstarthour || 8;
      const endHour = notificationSettings?.notificationendhour || 22;
      
      if (currentHour < startHour || currentHour > endHour) {
        console.log(`⏰ Fuera del horario permitido para ${user.firstname || user.username} (${startHour}:00-${endHour}:00)`);
        return false;
      }

      // Verificar límite diario de notificaciones
      const maxDaily = notificationSettings?.maxnotificationsperday || 5;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const dailyCount = await prisma.notificationevent.count({
        where: {
          userid: alert.userId,
          createdat: {
            gte: today
          },
          type: {
            in: ['PERFORMANCE_DROP', 'INACTIVITY_WARNING', 'RESPONSE_TIME_INCREASE', 
                 'STREAK_BREAK_RISK', 'MOTIVATIONAL_BOOST', 'STUDY_FREQUENCY_DROP']
          }
        }
      });

      if (dailyCount >= maxDaily) {
        console.log(`📊 Usuario ${user.firstname || user.username} ha alcanzado el límite diario de notificaciones (${maxDaily})`);
        return false;
      }

      // Enviar notificación usando lazy loading para evitar dependencia circular
      const { NotificationService } = await import('./notificationService');
      const result = await NotificationService.sendQuizResponse(
        user.telegramuserid,
        alert.message,
        {
          parseMode: 'HTML',
          userName: user.firstname || user.username || 'Usuario'
        }
      );

      if (result.success) {
        // Registrar la alerta en la base de datos
        await prisma.notificationevent.create({
          data: {
            id: this.generateId(),
            userid: alert.userId,
            type: alert.type as any,
            eventdata: JSON.stringify(alert.metrics),
            triggercontext: JSON.stringify({ alertRule: alert.type }),
            scheduledfor: alert.scheduledFor,
            sent: true,
            sentat: new Date(),
            success: true,
            messagecontent: alert.message,
            updatedat: new Date()
          }
        });

        // Actualizar timestamp de última alerta inteligente en configuración del usuario
        await prisma.usernotificationsettings.upsert({
          where: { userid: alert.userId },
          update: {
            lastintelligentalertsnotification: new Date(),
            updatedat: new Date()
          },
          create: {
            id: this.generateId(),
            userid: alert.userId,
            intelligentalertsnotifications: true,
            graduationnotifications: true,
            milestonenotifications: true,
            remindernotifications: true,
            weeklyreportnotifications: true,
            lastintelligentalertsnotification: new Date(),
            createdat: new Date(),
            updatedat: new Date()
          }
        });

        console.log(`✅ Alerta ${alert.type} enviada a ${user.firstname || user.username}`);
        return true;
      } else {
        console.error(`❌ Error enviando alerta ${alert.type}:`, result.message);
        return false;
      }
    } catch (error) {
      console.error('❌ Error enviando alerta:', error);
      return false;
    }
  }

  /**
   * 🔄 Procesar alertas para todos los usuarios activos
   */
  async processAlertsForAllUsers(): Promise<{
    usersProcessed: number;
    alertsSent: number;
    errors: number;
    alertsByType?: Record<string, number>;
  }> {
    try {
      console.log('🔍 Iniciando procesamiento de alertas inteligentes...');

      // Obtener usuarios activos en los últimos 7 días
      const activeUsers = await prisma.telegramuser.findMany({
        where: {
          lastactivity: {
            gte: new Date(Date.now() - (7 * 24 * 60 * 60 * 1000))
          }
        },
        select: { id: true, firstname: true, username: true },
        take: 100 // Procesar máximo 100 usuarios por vez
      });

      console.log(`📊 Procesando alertas para ${activeUsers.length} usuarios activos`);

      let alertsSent = 0;
      let errors = 0;
      const alertsByType: Record<string, number> = {};

      for (const user of activeUsers) {
        try {
          const alerts = await this.checkForAlerts(user.id);
          
          for (const alert of alerts) {
            const sent = await this.sendAlert(alert);
            if (sent) {
              alertsSent++;
              alertsByType[alert.type] = (alertsByType[alert.type] || 0) + 1;
            } else {
              errors++;
            }
            
            // Pequeña pausa entre envíos para evitar spam
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error(`❌ Error procesando usuario ${user.id}:`, error);
          errors++;
        }
      }

      const result = {
        usersProcessed: activeUsers.length,
        alertsSent,
        errors,
        alertsByType
      };

      console.log(`✅ Procesamiento completado. ${alertsSent} alertas enviadas.`);
      return result;
    } catch (error) {
      console.error('❌ Error procesando alertas para todos los usuarios:', error);
      return {
        usersProcessed: 0,
        alertsSent: 0,
        errors: 1,
        alertsByType: {}
      };
    }
  }

  /**
   * 🔧 Generar ID único
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * 📊 Obtener estadísticas del sistema de alertas
   */
  async getAlertStats(): Promise<any> {
    try {
      const last24Hours = new Date(Date.now() - (24 * 60 * 60 * 1000));
      const last7Days = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));

      const stats = await prisma.notificationevent.groupBy({
        by: ['type'],
        where: {
          createdat: {
            gte: last7Days
          }
        },
        _count: {
          id: true
        }
      });

      const alertsLast24h = await prisma.notificationevent.count({
        where: {
          createdat: {
            gte: last24Hours
          },
          type: {
            in: ['PERFORMANCE_DROP', 'INACTIVITY_WARNING', 'RESPONSE_TIME_INCREASE', 
                 'STREAK_BREAK_RISK', 'MOTIVATIONAL_BOOST', 'STUDY_FREQUENCY_DROP']
          }
        }
      });

      return {
        alertsByType: stats,
        alertsLast24Hours: alertsLast24h,
        totalAlertRules: this.alertRules.length
      };
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas de alertas:', error);
      return null;
    }
  }
}

// Exportar solo la clase para evitar inicialización inmediata
// export const intelligentAlertsService = new IntelligentAlertsService();
// export default intelligentAlertsService;