import { StudySessionService, STUDY_COMMANDS } from './studySessionService';

// Instancia del servicio de sesiones de estudio
const studySessionService = new StudySessionService();

export class StudyCommandHandler {
  
  /**
   * Manejar comandos de estudio (/constitucion10, /defensanacional5, /falladas5, etc.)
   */
  static async handleStudyCommand(command: string, userid: string): Promise<{ success: boolean; message: string }> {
    try {
      // 🎯 USAR EL PARSER ACTUALIZADO DEL StudySessionService
      const parsed = StudySessionService.parseStudyCommand(command);
      
      if (!parsed) {
        return {
          success: false,
          message: '❌ Formato de comando inválido.\n\n' +
                  '💡 **Ejemplos válidos:**\n' +
                  '• `/constitucion10` - 10 preguntas de Constitución\n' +
                  '• `/defensanacional5` - 5 preguntas de Defensa Nacional\n' +
                  '• `/rjsp20` - 20 preguntas de RJP\n\n' +
                  '🎓 **Preguntas falladas:**\n' +
                  '• `/falladas` - 5 preguntas falladas (todas las materias)\n' +
                  '• `/falladas15` - 15 preguntas falladas específicas\n' +
                  '• `/constitucionfalladas5` - 5 preguntas falladas de Constitución\n' +
                  '• `/pdcfalladas3` - 3 preguntas falladas de PDC\n\n' +
                  '📝 **Comandos disponibles:**\n' +
                  Object.keys(STUDY_COMMANDS).map(cmd => `• \`${cmd}[número]\``).join('\n')
        };
      }

      // Validar número de preguntas
      if (parsed.quantity < 1 || parsed.quantity > 50) {
        return {
          success: false,
          message: '❌ El número de preguntas debe estar entre 1 y 50.\n\n' +
                  '💡 Ejemplo: `/constitucion10` para 10 preguntas\n' +
                  '💡 Ejemplo: `/falladas5` para 5 preguntas de repaso'
        };
      }

      // 🎓 Iniciar sesión de estudio (normal o de preguntas falladas)
      const sessionType = parsed.type || 'normal';
      const result = await studySessionService.startStudySession(
        userid, 
        parsed.subject, 
        parsed.quantity,
        sessionType
      );

      return result;

    } catch (error) {
      console.error('Error manejando comando de estudio:', error);
      return {
        success: false,
        message: '❌ Error interno del sistema'
      };
    }
  }

  /**
   * Manejar comando /stop
   */
  static async handleStopCommand(userid: string): Promise<{ success: boolean; message: string }> {
    try {
      return await studySessionService.stopSession(userid);
    } catch (error) {
      console.error('Error manejando comando /stop:', error);
      return {
        success: false,
        message: '❌ Error cancelando sesión'
      };
    }
  }

  /**
   * Manejar comando /progreso
   */
  static async handleProgressCommand(userid: string): Promise<{ success: boolean; message: string }> {
    try {
      return await studySessionService.getSessionProgress(userid);
    } catch (error) {
      console.error('Error manejando comando /progreso:', error);
      return {
        success: false,
        message: '❌ Error obteniendo progreso'
      };
    }
  }

  /**
   * Procesar respuesta de usuario (número 1-4 para las opciones)
   */
  static async handleUserResponse(userid: string, messageText: string): Promise<boolean> {
    try {
      // Verificar que es un número válido (1-4)
      const selectedNumber = parseInt(messageText.trim());
      
      if (isNaN(selectedNumber) || selectedNumber < 1 || selectedNumber > 4) {
        return false; // No es una respuesta válida a una pregunta
      }

      // Buscar si hay una sesión activa con pregunta pendiente
      const session = await this.getActiveSessionWithPendingQuestion(userid);
      
      if (!session) {
        return false; // No hay sesión activa o pregunta pendiente
      }

      // Convertir a índice 0-based para el procesamiento
      const selectedOption = selectedNumber - 1;
      
      // Procesar la respuesta
      await studySessionService.processPollAnswer(
        session.pendingPollId, 
        userid, 
        selectedOption
      );

      return true; // Respuesta procesada exitosamente

    } catch (error) {
      console.error('Error procesando respuesta de usuario:', error);
      return false;
    }
  }

  /**
   * Verificar si un comando es un comando de estudio válido (incluyendo preguntas falladas)
   */
  static isStudyCommand(command: string): boolean {
    // 🎯 USAR EL PARSER ACTUALIZADO que maneja tanto comandos normales como de falladas
    const parsed = StudySessionService.parseStudyCommand(command);
    return parsed !== null;
  }



  /**
   * Obtener sesión activa con pregunta pendiente
   */
  private static async getActiveSessionWithPendingQuestion(userid: string): Promise<{ pendingPollId: string } | null> {
    try {
      // Importar Prisma aquí para evitar dependencias circulares
      const { prisma } = await import('@/lib/prisma');

      const session = await prisma.userstudysession.findFirst({
        where: { userid, status: 'active' },
        include: {
          responses: {
            where: { answeredAt: null },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });

      if (!session || session.responses.length === 0) {
        return null;
      }

      return {
        pendingPollId: session.responses[0].pollid
      };

    } catch (error) {
      console.error('Error obteniendo sesión activa:', error);
      return null;
    }
  }

  /**
   * Generar mensaje de ayuda para comandos de estudio
   */
  static getHelpMessage(): string {
    return `📚 **SESIONES DE ESTUDIO PRIVADAS**\n\n` +
      `🎯 **Comandos normales:**\n` +
      `• \`/constitucion[N]\` - Preguntas de Constitución\n` +
      `• \`/defensanacional[N]\` - Preguntas de Defensa Nacional\n` +
      `• \`/rjsp[N]\` - Preguntas de RJP (RJSP)\n` +
      `• \`/emad[N]\` - Preguntas de EMAD\n` +
      `• \`/et[N]\` - Preguntas de ET\n` +
      `• \`/armada[N]\` - Preguntas de Armada\n` +
      `• \`/aire[N]\` - Preguntas de Aire\n` +
      `• \`/igualdad[N]\` - Preguntas de Igualdad\n` +
      `• Y 17 materias más...\n\n` +
      `🎓 **Comandos de REPASO (preguntas falladas):**\n` +
      `• \`/falladas\` - 5 preguntas falladas (todas las materias)\n` +
      `• \`/falladas[N]\` - N preguntas falladas específicas\n` +
      `• \`/constitucionfalladas[N]\` - N preguntas falladas de Constitución\n` +
      `• \`/pdcfalladas[N]\` - N preguntas falladas de PDC\n` +
      `• \`/airefalladas[N]\` - N preguntas falladas de Aire\n` +
      `• Y todas las materias con 'falladas'...\n\n` +
      `📊 **Ejemplos:**\n` +
      `• \`/constitucion10\` - 10 preguntas de Constitución\n` +
      `• \`/defensanacional5\` - 5 preguntas de Defensa Nacional\n` +
      `• \`/falladas\` - 5 preguntas de repaso general\n` +
      `• \`/constitucionfalladas3\` - 3 preguntas falladas de Constitución\n\n` +
      `🏆 **Sistema de graduación:**\n` +
      `• Una pregunta "gradúa" tras 3 aciertos consecutivos\n` +
      `• Las preguntas graduadas no aparecen más en /falladas\n` +
      `• ¡Perfecto para reforzar conocimientos débiles!\n\n` +
      `⚡ **Control de sesión:**\n` +
      `• \`/stop\` - Cancelar sesión actual\n` +
      `• \`/progreso\` - Ver progreso actual\n\n` +
      `🎮 **Cómo funciona:**\n` +
      `1. Envía un comando (ej: \`/constitucion10\` o \`/falladas\`)\n` +
      `2. Responde cada pregunta con 1, 2, 3 o 4\n` +
      `3. Tienes 1 minuto por pregunta\n` +
      `4. Ve tu progreso y estadísticas finales\n\n` +
      `💡 **¡Las preguntas no se repiten hasta completar todas!**`;
  }
}

export { StudyCommandHandler as studyCommandHandler };