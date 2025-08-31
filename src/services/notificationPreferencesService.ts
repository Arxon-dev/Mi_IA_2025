import { prisma } from '../lib/prisma';
import { TelegramService } from './telegramService';

/**
 * 🔔 Servicio de Preferencias de Notificaciones
 * 
 * Maneja las preferencias de notificaciones de los usuarios,
 * incluyendo activación/desactivación de alertas inteligentes.
 */
export class NotificationPreferencesService {
  private telegramService: TelegramService;

  constructor() {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN no está configurado en las variables de entorno');
    }
    this.telegramService = new TelegramService(botToken);
  }

  /**
   * 🔧 Activar alertas inteligentes para un usuario
   */
  async enableIntelligentAlerts(userId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      await prisma.usernotificationsettings.upsert({
        where: { userid: userId },
        update: {
          intelligentalertsnotifications: true,
          updatedat: new Date()
        },
        create: {
          id: this.generateId(),
          userid: userId,
          intelligentalertsnotifications: true,
          graduationnotifications: true,
          milestonenotifications: true,
          remindernotifications: true,
          weeklyreportnotifications: true,
          createdat: new Date(),
          updatedat: new Date()
        }
      });

      return {
        success: true,
        message: '✅ <b>Alertas Inteligentes Activadas</b>\n\n🧠 Ahora recibirás notificaciones personalizadas sobre tu rendimiento de estudio.\n\n📊 Te alertaremos sobre:\n• Caídas en tu rendimiento\n• Períodos de inactividad\n• Riesgo de perder rachas\n• Oportunidades de mejora\n• Impulsos motivacionales\n\n⚙️ Puedes desactivarlas en cualquier momento con /alertas_off'
      };
    } catch (error) {
      console.error('❌ Error activando alertas inteligentes:', error);
      return {
        success: false,
        message: '❌ Error al activar las alertas inteligentes. Inténtalo de nuevo.'
      };
    }
  }

  /**
   * 🔕 Desactivar alertas inteligentes para un usuario
   */
  async disableIntelligentAlerts(userId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      await prisma.usernotificationsettings.upsert({
        where: { userid: userId },
        update: {
          intelligentalertsnotifications: false,
          updatedat: new Date()
        },
        create: {
          id: this.generateId(),
          userid: userId,
          intelligentalertsnotifications: false,
          graduationnotifications: true,
          milestonenotifications: true,
          remindernotifications: true,
          weeklyreportnotifications: true,
          createdat: new Date(),
          updatedat: new Date()
        }
      });

      return {
        success: true,
        message: '🔕 <b>Alertas Inteligentes Desactivadas</b>\n\n❌ Ya no recibirás notificaciones automáticas sobre tu rendimiento.\n\n💡 <i>Recuerda que estas alertas te ayudan a mantener un estudio constante y mejorar tu rendimiento.</i>\n\n🔔 Puedes reactivarlas cuando quieras con /alertas_on'
      };
    } catch (error) {
      console.error('❌ Error desactivando alertas inteligentes:', error);
      return {
        success: false,
        message: '❌ Error al desactivar las alertas inteligentes. Inténtalo de nuevo.'
      };
    }
  }

  /**
   * 📊 Obtener estado actual de las preferencias de notificaciones
   */
  async getNotificationStatus(userId: string): Promise<{
    success: boolean;
    message: string;
    settings?: any;
  }> {
    try {
      const settings = await prisma.usernotificationsettings.findUnique({
        where: { userid: userId }
      });

      const user = await prisma.telegramuser.findUnique({
        where: { id: userId },
        select: { firstname: true, username: true }
      });

      const userName = user?.firstname || user?.username || 'Usuario';
      
      if (!settings) {
        return {
          success: true,
          message: `🔔 <b>Estado de Notificaciones - ${userName}</b>\n\n⚙️ <i>No tienes configuraciones personalizadas.</i>\n\n📋 <b>Configuración por defecto:</b>\n✅ Alertas Inteligentes: Activadas\n✅ Notificaciones de Graduación: Activadas\n✅ Notificaciones de Hitos: Activadas\n✅ Recordatorios: Activados\n✅ Reportes Semanales: Activados\n\n🕐 Horario: 8:00 - 22:00\n📊 Máximo diario: 5 notificaciones\n\n💡 Usa /alertas_off para desactivar alertas inteligentes`,
          settings: null
        };
      }

      const intelligentAlertsStatus = settings.intelligentalertsnotifications ? '✅ Activadas' : '❌ Desactivadas';
      const graduationStatus = settings.graduationnotifications ? '✅ Activadas' : '❌ Desactivadas';
      const milestoneStatus = settings.milestonenotifications ? '✅ Activadas' : '❌ Desactivadas';
      const reminderStatus = settings.remindernotifications ? '✅ Activados' : '❌ Desactivados';
      const weeklyStatus = settings.weeklyreportnotifications ? '✅ Activados' : '❌ Desactivados';

      const lastAlert = settings.lastintelligentalertsnotification 
        ? new Date(settings.lastintelligentalertsnotification).toLocaleString('es-ES')
        : 'Nunca';

      return {
        success: true,
        message: `🔔 <b>Estado de Notificaciones - ${userName}</b>\n\n🧠 <b>Alertas Inteligentes:</b> ${intelligentAlertsStatus}\n🎓 <b>Graduación:</b> ${graduationStatus}\n🏆 <b>Hitos:</b> ${milestoneStatus}\n⏰ <b>Recordatorios:</b> ${reminderStatus}\n📊 <b>Reportes Semanales:</b> ${weeklyStatus}\n\n⏰ <b>Horario:</b> ${settings.notificationstarthour}:00 - ${settings.notificationendhour}:00\n📈 <b>Máximo diario:</b> ${settings.maxnotificationsperday} notificaciones\n🕐 <b>Última alerta:</b> ${lastAlert}\n\n⚙️ <b>Comandos:</b>\n• /alertas_on - Activar alertas inteligentes\n• /alertas_off - Desactivar alertas inteligentes\n• /notificaciones - Ver este estado`,
        settings
      };
    } catch (error) {
      console.error('❌ Error obteniendo estado de notificaciones:', error);
      return {
        success: false,
        message: '❌ Error al obtener el estado de las notificaciones. Inténtalo de nuevo.'
      };
    }
  }

  /**
   * 📤 Enviar mensaje de configuración de notificaciones
   */
  async sendNotificationMessage(telegramUserId: string, message: string): Promise<{
    success: boolean;
    method: string;
    message: string;
  }> {
    try {
      const result = await this.telegramService.sendMessage(telegramUserId, message, {
        parse_mode: 'HTML',
        disable_web_page_preview: true
      });

      return {
        success: true,
        method: 'telegram',
        message: 'Mensaje de configuración enviado exitosamente'
      };
    } catch (error) {
      console.error('❌ Error enviando mensaje de configuración:', error);
      return {
        success: false,
        method: 'telegram',
        message: 'Error al enviar mensaje de configuración'
      };
    }
  }

  /**
   * 🔧 Generar ID único
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}

export const notificationPreferencesService = new NotificationPreferencesService();
export default notificationPreferencesService;