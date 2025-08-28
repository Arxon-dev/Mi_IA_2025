import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface UserResponse {
  telegramUserId: string;
  questionId: string;
  sectionId: number;
  sectionName: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  responseTime?: number; // en segundos
  pointsEarned: number;
  pointsLost: number;
}

export interface StudySession {
  telegramUserId: string;
  sessionType: 'normal' | 'failed_questions' | 'custom_topic' | 'tournament';
  questionsAnswered: number;
  correctAnswers: number;
  incorrectAnswers: number;
  totalPointsEarned: number;
  totalPointsLost: number;
  sessionDuration?: number; // en segundos
}

export class AdvancedAnalyticsService {
  
  /**
   * Registra una respuesta individual del usuario
   */
  async recordUserResponse(response: UserResponse): Promise<void> {
    try {
      // Registrar en la tabla de respuestas individuales
      await prisma.$executeRaw`
        INSERT INTO mdl_local_telegram_user_responses 
        (telegramuserid, questionid, sectionid, useranswer, correctanswer, iscorrect, responsetime, points_earned, points_lost, createdat)
        VALUES (${response.telegramUserId}, ${response.questionId}, ${response.sectionId}, ${response.userAnswer}, 
                ${response.correctAnswer}, ${response.isCorrect}, ${response.responseTime || 0}, 
                ${response.pointsEarned}, ${response.pointsLost}, NOW())
      `;

      // Actualizar rendimiento por tema
      await this.updateTopicPerformance(response.telegramUserId, response.sectionId, response.sectionName, response.isCorrect);

      // Actualizar progreso temporal
      await this.updateProgressTimeline(response.telegramUserId, response.isCorrect, response.pointsEarned, response.pointsLost);

      console.log(`✅ Respuesta registrada para usuario ${response.telegramUserId}`);
    } catch (error) {
      console.error('❌ Error registrando respuesta:', error);
    }
  }

  /**
   * Actualiza el rendimiento por tema
   */
  private async updateTopicPerformance(telegramUserId: string, sectionId: number, sectionName: string, isCorrect: boolean): Promise<void> {
    try {
      await prisma.$executeRaw`
        INSERT INTO mdl_local_telegram_user_topic_performance 
        (telegramuserid, sectionid, sectionname, totalquestions, correctanswers, incorrectanswers, accuracy)
        VALUES (${telegramUserId}, ${sectionId}, ${sectionName}, 1, 
                ${isCorrect ? 1 : 0}, ${isCorrect ? 0 : 1}, ${isCorrect ? 100.00 : 0.00})
        ON DUPLICATE KEY UPDATE
          totalquestions = totalquestions + 1,
          correctanswers = correctanswers + ${isCorrect ? 1 : 0},
          incorrectanswers = incorrectanswers + ${isCorrect ? 0 : 1},
          accuracy = (correctanswers + ${isCorrect ? 1 : 0}) / (totalquestions + 1) * 100,
          lastactivity = NOW()
      `;
    } catch (error) {
      console.error('❌ Error actualizando rendimiento por tema:', error);
    }
  }

  /**
   * Actualiza el progreso temporal diario
   */
  private async updateProgressTimeline(telegramUserId: string, isCorrect: boolean, pointsEarned: number, pointsLost: number): Promise<void> {
    try {
      await prisma.$executeRaw`
        INSERT INTO mdl_local_telegram_progress_timeline 
        (telegramuserid, date, questions_answered, correct_answers, incorrect_answers, points_earned, points_lost, accuracy)
        VALUES (${telegramUserId}, CURDATE(), 1, ${isCorrect ? 1 : 0}, ${isCorrect ? 0 : 1}, 
                ${pointsEarned}, ${pointsLost}, ${isCorrect ? 100.00 : 0.00})
        ON DUPLICATE KEY UPDATE
          questions_answered = questions_answered + 1,
          correct_answers = correct_answers + ${isCorrect ? 1 : 0},
          incorrect_answers = incorrect_answers + ${isCorrect ? 0 : 1},
          points_earned = points_earned + ${pointsEarned},
          points_lost = points_lost + ${pointsLost},
          accuracy = (correct_answers + ${isCorrect ? 1 : 0}) / (questions_answered + 1) * 100
      `;
    } catch (error) {
      console.error('❌ Error actualizando progreso temporal:', error);
    }
  }

  /**
   * Registra una sesión de estudio completa
   */
  async recordStudySession(session: StudySession): Promise<void> {
    try {
      await prisma.$executeRaw`
        INSERT INTO mdl_local_telegram_study_sessions 
        (telegramuserid, sessiontype, questions_answered, correct_answers, incorrect_answers, 
         total_points_earned, total_points_lost, session_duration, startedat, endedat)
        VALUES (${session.telegramUserId}, ${session.sessionType}, ${session.questionsAnswered}, 
                ${session.correctAnswers}, ${session.incorrectAnswers}, ${session.totalPointsEarned}, 
                ${session.totalPointsLost}, ${session.sessionDuration || 0}, NOW(), NOW())
      `;

      console.log(`✅ Sesión de estudio registrada para usuario ${session.telegramUserId}`);
    } catch (error) {
      console.error('❌ Error registrando sesión de estudio:', error);
    }
  }

  /**
   * Genera recomendaciones personalizadas para un usuario
   */
  async generateRecommendations(telegramUserId: string): Promise<void> {
    try {
      // Limpiar recomendaciones anteriores
      await prisma.$executeRaw`
        DELETE FROM mdl_local_telegram_recommendations 
        WHERE telegramuserid = ${telegramUserId} AND recommendationtype = 'practice_topic'
      `;

      // Buscar temas con bajo rendimiento
      const weakTopics = await prisma.$queryRaw`
        SELECT sectionid, sectionname, accuracy, totalquestions
        FROM mdl_local_telegram_user_topic_performance
        WHERE telegramuserid = ${telegramUserId} 
        AND accuracy < 70.00 
        AND totalquestions >= 5
        ORDER BY accuracy ASC
        LIMIT 3
      ` as any[];

      // Crear recomendaciones
      for (const topic of weakTopics) {
        await prisma.$executeRaw`
          INSERT INTO mdl_local_telegram_recommendations 
          (telegramuserid, recommendationtype, sectionid, priority, reason)
          VALUES (${telegramUserId}, 'practice_topic', ${topic.sectionid}, 1, 
                  ${`Tu precisión en "${topic.sectionname}" es del ${topic.accuracy}%. Necesitas practicar más.`})
        `;
      }

      console.log(`✅ Recomendaciones generadas para usuario ${telegramUserId}`);
    } catch (error) {
      console.error('❌ Error generando recomendaciones:', error);
    }
  }

  /**
   * Verifica y otorga logros
   */
  async checkAndAwardAchievements(telegramUserId: string): Promise<void> {
    try {
      // Verificar logros existentes
      const existingAchievements = await prisma.$queryRaw`
        SELECT achievementtype FROM mdl_local_telegram_achievements 
        WHERE telegramuserid = ${telegramUserId}
      ` as any[];

      const existingTypes = existingAchievements.map(a => a.achievementtype);

      // Logro: Topic Master (dominio de un tema)
      if (!existingTypes.includes('topic_master')) {
        const topicMaster = await prisma.$queryRaw`
          SELECT sectionname, accuracy FROM mdl_local_telegram_user_topic_performance
          WHERE telegramuserid = ${telegramUserId} AND accuracy >= 90.00 AND totalquestions >= 10
          LIMIT 1
        ` as any[];

        if (topicMaster.length > 0) {
          await prisma.$executeRaw`
            INSERT INTO mdl_local_telegram_achievements 
            (telegramuserid, achievementtype, achievementname, achievementdescription)
            VALUES (${telegramUserId}, 'topic_master', 'Maestro del Tema', 
                    ${`¡Dominas completamente "${topicMaster[0].sectionname}" con ${topicMaster[0].accuracy}% de precisión!`})
          `;
        }
      }

      // Logro: Streak Master (racha de aciertos)
      if (!existingTypes.includes('streak_master')) {
        const user = await prisma.telegramuser.findUnique({
          where: { telegramuserid: telegramUserId }
        });

        if (user && user.beststreak >= 10) {
          await prisma.$executeRaw`
            INSERT INTO mdl_local_telegram_achievements 
            (telegramuserid, achievementtype, achievementname, achievementdescription)
            VALUES (${telegramUserId}, 'streak_master', 'Maestro de Rachas', 
                    '¡Lograste una racha de 10 aciertos consecutivos!')
          `;
        }
      }

      console.log(`✅ Logros verificados para usuario ${telegramUserId}`);
    } catch (error) {
      console.error('❌ Error verificando logros:', error);
    }
  }

  /**
   * Obtiene analytics detallados de un usuario
   */
  async getUserAnalytics(telegramUserId: string) {
    try {
      const analytics = {
        topicPerformance: await prisma.$queryRaw`
          SELECT * FROM mdl_local_telegram_user_topic_performance 
          WHERE telegramuserid = ${telegramUserId}
          ORDER BY accuracy ASC
        ` as any[],
        
        timeline: await prisma.$queryRaw`
          SELECT * FROM mdl_local_telegram_progress_timeline 
          WHERE telegramuserid = ${telegramUserId}
          AND date >= DATE_SUB(CURDATE(), INTERVAL 28 DAY)
          ORDER BY date ASC
        ` as any[],
        
        recommendations: await prisma.$queryRaw`
          SELECT * FROM mdl_local_telegram_recommendations 
          WHERE telegramuserid = ${telegramUserId} AND isactive = 1
          ORDER BY priority ASC
        ` as any[],
        
        achievements: await prisma.$queryRaw`
          SELECT * FROM mdl_local_telegram_achievements 
          WHERE telegramuserid = ${telegramUserId}
          ORDER BY earnedat DESC
          LIMIT 10
        ` as any[],
        
        studySessions: await prisma.$queryRaw`
          SELECT * FROM mdl_local_telegram_study_sessions 
          WHERE telegramuserid = ${telegramUserId}
          ORDER BY startedat DESC
          LIMIT 10
        ` as any[]
      };

      return analytics;
    } catch (error) {
      console.error('❌ Error obteniendo analytics:', error);
      return null;
    }
  }

  /**
   * Obtiene estadísticas globales del sistema
   */
  async getGlobalAnalytics() {
    try {
      const stats = {
        totalUsers: await prisma.telegramuser.count(),
        
        activeUsers: await prisma.$queryRaw`
          SELECT COUNT(DISTINCT telegramuserid) as active 
          FROM mdl_local_telegram_user_responses 
          WHERE createdat >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ` as any[],
        
        popularTopics: await prisma.$queryRaw`
          SELECT sectionname, COUNT(*) as total_questions
          FROM mdl_local_telegram_user_responses 
          GROUP BY sectionid, sectionname
          ORDER BY total_questions DESC
          LIMIT 5
        ` as any[],
        
        difficultTopics: await prisma.$queryRaw`
          SELECT sectionname, AVG(accuracy) as avg_accuracy
          FROM mdl_local_telegram_user_topic_performance 
          WHERE totalquestions >= 10
          GROUP BY sectionid, sectionname
          ORDER BY avg_accuracy ASC
          LIMIT 5
        ` as any[]
      };

      return stats;
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas globales:', error);
      return null;
    }
  }
}

export const advancedAnalyticsService = new AdvancedAnalyticsService(); 