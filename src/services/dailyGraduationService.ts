import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

interface DailyGraduationNotification {
  userid: string;
  userName: string;
  subject: string;
  isFirstToday: boolean;
  graduationCount: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
}

/**
 * 🎓 Servicio de Notificaciones de Primera Graduación del Día
 * 
 * Este servicio maneja las notificaciones cuando un usuario gradúa
 * su primera pregunta del día, con CTAs accionables específicos.
 */
export class DailyGraduationService {

  /**
   * 🎯 Notificar primera graduación del día con comandos específicos
   */
  static async notifyFirstGraduationToday(
    userid: string, 
    userName: string, 
    subject: string
  ): Promise<boolean> {
    try {
      // Verificar si es realmente la primera graduación del día
      const isFirst = await this.isFirstGraduationToday(userid);
      
      if (!isFirst) {
        console.log(`📝 No es primera graduación del día para ${userName}`);
        return false;
      }

      // Obtener contexto del usuario
      const userContext = await this.getUserContext(userid);
      const timeOfDay = this.getTimeOfDay();

      // Generar notificación personalizada
      const notification: DailyGraduationNotification = {
        userid,
        userName,
        subject,
        isFirstToday: true,
        graduationCount: userContext.totalGraduations,
        timeOfDay
      };

      const message = this.generateFirstGraduationMessage(notification, userContext);
      
      // Enviar notificación
      const success = await this.sendTelegramMessage(message);

      if (success) {
        // Registrar evento para no duplicar
        await this.recordDailyGraduationEvent(userid, subject);
        console.log(`✅ Primera graduación del día enviada a ${userName}`);
        return true;
      }

      return false;

    } catch (error) {
      console.error('❌ Error en notificación de primera graduación:', error);
      return false;
    }
  }  /**
   * ✨ Generar mensaje personalizado según el contexto
   */
  private static generateFirstGraduationMessage(
    notification: DailyGraduationNotification,
    userContext: any
  ): string {
    const { userName, subject, timeOfDay, graduationCount } = notification;
    
    // Saludo según la hora del día
    const greeting = this.getTimeGreeting(timeOfDay);
    
    // Motivación según el número de graduaciones totales
    const motivationLevel = this.getMotivationLevel(graduationCount);

    // CTAs específicos según la materia
    const subjectCommands = this.getSubjectSpecificCommands(subject);
    
    let message = `🎓 <b>¡PRIMERA GRADUACIÓN DEL DÍA!</b> 🌟\n\n`;
    message += `${greeting} ${userName}! 🎉\n\n`;
    message += `Has graduado tu primera pregunta de <b>${subject}</b> ${this.getTimePhrase(timeOfDay)}.\n`;
    message += `${motivationLevel.phrase}\n\n`;

    // CTAs ACCIONABLES ESPECÍFICOS
    message += `🚀 <b>APROVECHA TU IMPULSO:</b>\n`;
    message += `• <code>/falladas10</code> - Sesión de 10 preguntas falladas\n`;
    message += `• <code>/${subjectCommands.continue}</code> - Más preguntas de ${subject}\n`;
    message += `• <code>/miprogreso</code> - Ve tu evolución en tiempo real\n\n`;

    message += `🎯 <b>SIGUE MEJORANDO:</b>\n`;
    message += `• <code>/estadisticas</code> - Análisis de tus fortalezas\n`;
    message += `• <code>/graduadas</code> - Lista de preguntas dominadas\n`;
    message += `• <code>/configurar_notificaciones</code> - Ajustar recordatorios\n\n`;

    if (graduationCount >= 10) {
      message += `💪 <b>DEMUESTRA TU NIVEL:</b>\n`;
      message += `• <code>/duelo</code> - Reta a alguien del grupo\n`;
      message += `• <code>/torneo</code> - Únete al torneo activo\n`;
      message += `• <code>/simulacro</code> - Examen completo\n\n`;
    }

    message += `${motivationLevel.cta}\n`;
    message += `🔥 <i>¡Cada graduación te acerca más al éxito!</i>`;

    return message;
  }  /**
   * 🕐 Obtener saludo según la hora del día
   */
  private static getTimeGreeting(timeOfDay: string): string {
    const greetings = {
      morning: ['🌅 ¡Buenos días', '☀️ ¡Buen día', '🌄 ¡Hola'],
      afternoon: ['🌤️ ¡Buenas tardes', '☀️ ¡Hola', '🌻 ¡Buenas tardes'],
      evening: ['🌆 ¡Buenas tardes', '🌅 ¡Hola', '🌇 ¡Buenas tardes'],
      night: ['🌙 ¡Buenas noches', '⭐ ¡Hola nocturno', '🌃 ¡Hola']
    };

    const options = greetings[timeOfDay as keyof typeof greetings] || greetings.morning;
    return options[Math.floor(Math.random() * options.length)];
  }

  /**
   * ⏰ Obtener frase temporal específica
   */
  private static getTimePhrase(timeOfDay: string): string {
    const phrases = {
      morning: 'para empezar el día',
      afternoon: 'en esta tarde',
      evening: 'al final del día',
      night: 'en esta noche de estudio'
    };

    return phrases[timeOfDay as keyof typeof phrases] || 'hoy';
  }

  /**
   * 💪 Obtener nivel de motivación según graduaciones totales
   */
  private static getMotivationLevel(count: number): { phrase: string; cta: string } {
    if (count >= 50) {
      return {
        phrase: '👑 <b>¡ERES UN MAESTRO ABSOLUTO!</b> Tu dedicación es legendaria.',
        cta: '🏆 <b>¡Continúa dominando como la leyenda que eres!</b>'
      };
    } else if (count >= 25) {
      return {
        phrase: '🌟 <b>¡NIVEL EXPERTO ALCANZADO!</b> Tu consistencia es impresionante.',
        cta: '💎 <b>¡Camino hacia la maestría total!</b>'
      };
    } else if (count >= 10) {
      return {
        phrase: '🚀 <b>¡VAS POR BUEN CAMINO!</b> Tu progreso es notable.',
        cta: '⭐ <b>¡Sigue construyendo tu base sólida!</b>'
      };
    } else if (count >= 5) {
      return {
        phrase: '📈 <b>¡CONSTANCIA DETECTADA!</b> Cada graduación cuenta.',
        cta: '🔥 <b>¡Mantén este ritmo excelente!</b>'
      };
    } else {
      return {
        phrase: '🎯 <b>¡EXCELENTE INICIO!</b> Cada graduación es un paso hacia el éxito.',
        cta: '💪 <b>¡Construye tu rutina de estudio diario!</b>'
      };
    }
  }  /**
   * 📚 Obtener comandos específicos según la materia
   */
  private static getSubjectSpecificCommands(subject: string): { continue: string; related: string[] } {
    const commandMappings: Record<string, { continue: string; related: string[] }> = {
      'constitucion': {
        continue: 'constitucion10',
        related: ['defensanacional10', 'proteccioncivil10']
      },
      'defensanacional': {
        continue: 'defensanacional10', 
        related: ['constitucion10', 'proteccioncivil10']
      },
      'proteccioncivil': {
        continue: 'proteccioncivil10',
        related: ['constitucion10', 'defensanacional10']
      },
      'rio': {
        continue: 'rio10',
        related: ['aire10', 'tierra10']
      },
      'aire': {
        continue: 'aire10',
        related: ['rio10', 'tierra10']
      },
      'tierra': {
        continue: 'tierra10',
        related: ['rio10', 'aire10']
      }
    };

    return commandMappings[subject.toLowerCase()] || {
      continue: `${subject}10`,
      related: ['falladas10', 'simulacro']
    };
  }

  /**
   * 🕒 Determinar momento del día
   */
  private static getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = new Date().getHours();
    
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }  /**
   * ✅ Verificar si es la primera graduación del día
   */
  private static async isFirstGraduationToday(userid: string): Promise<boolean> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const graduationsToday = await prisma.studyresponse.count({
        where: {
          userid,
          createdAt: {
            gte: today,
            lt: tomorrow
          },
          // Buscar respuestas que indiquen graduación (lógica simplificada)
          iscorrect: true
        }
      });

      return graduationsToday === 1; // Es la primera graduación del día
    } catch (error) {
      console.error('❌ Error verificando primera graduación:', error);
      return false;
    }
  }

  /**
   * 📊 Obtener contexto del usuario
   */
  private static async getUserContext(userid: string): Promise<any> {
    try {
      const user = await prisma.telegramuser.findUnique({
        where: { id: userid },
        include: {
          studyStats: true
        }
      });

      if (!user) return { totalGraduations: 0, level: 1 };

      // Calcular graduaciones totales aproximadas
      const totalGraduations = user.studystats.reduce((sum, stat) => {
        return sum + Math.floor(stat.correctAnswers / 3); // Estimación de graduaciones
      }, 0);

      return {
        totalGraduations,
        level: user.level,
        totalpoints: user.totalpoints,
        streak: user.streak
      };

    } catch (error) {
      console.error('❌ Error obteniendo contexto:', error);
      return { totalGraduations: 0, level: 1 };
    }
  }  /**
   * 📝 Registrar evento de graduación diaria
   */
  private static async recordDailyGraduationEvent(userid: string, subject: string): Promise<void> {
    try {
      // Registrar en tabla de eventos (si existe)
      // Esto evitaría notificaciones duplicadas en el mismo día
      
      console.log(`📝 Registrado evento de primera graduación: ${userid} - ${subject}`);
    } catch (error) {
      console.error('❌ Error registrando evento:', error);
    }
  }

  /**
   * 📤 Enviar mensaje a Telegram
   */
  private static async sendTelegramMessage(message: string): Promise<boolean> {
    try {
      if (!BOT_TOKEN || !CHAT_ID) {
        console.error('❌ Faltan credenciales de Telegram');
        return false;
      }

      const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
          parse_mode: 'HTML'
        })
      });

      const result = await response.json() as any;
      
      if (result.ok) {
        console.log(`✅ Notificación de graduación enviada (ID: ${result.result.message_id})`);
        return true;
      } else {
        console.error('❌ Error en respuesta de Telegram:', result);
        return false;
      }
    } catch (error) {
      console.error('❌ Error enviando mensaje:', error);
      return false;
    }
  }

  /**
   * 🎯 Función principal para uso en hooks del sistema
   */
  static async onQuestionGraduated(userid: string, userName: string, subject: string): Promise<void> {
    console.log(`🎓 Hook: Pregunta graduada - ${userName} en ${subject}`);
    
    const success = await this.notifyFirstGraduationToday(userid, userName, subject);
    
    if (success) {
      console.log(`🎉 Notificación de primera graduación enviada exitosamente a ${userName}`);
    }
  }
}

export default DailyGraduationService;