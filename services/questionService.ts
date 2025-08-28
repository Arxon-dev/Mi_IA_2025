import { PrismaClient } from '@prisma/client';
import { advancedAnalyticsService } from './advancedAnalyticsService';

const prisma = new PrismaClient();

// Interfaces para tipos de datos
interface Section {
  id: string;
  documentid: string;
  title: string;
  content: string;
  order: number;
  processed: boolean;
  createdat: Date;
  updatedat: Date;
  type: string;
  trial767: string | null;
}

interface Question {
  id: string;
  documentid: string;
  content: string;
  type: string;
  difficulty: string;
  bloomlevel: string | null;
  createdat: Date;
  sectionid: string | null;
  lastscheduledsendat: Date | null;
  sendcount: number;
  lastsuccessfulsendat: Date | null;
  archived: boolean;
  trial764: string | null;
}

interface QuestionWithSection extends Question {
  section: Section | null;
}

export class QuestionService {
  
  /**
   * Obtiene una pregunta por ID
   */
  async getQuestionById(questionId: string): Promise<QuestionWithSection | null> {
    try {
      const question = await prisma.question.findUnique({
        where: { id: questionId }
      });
      
      if (!question) {
        return null;
      }

      // Obtener información de la sección si existe sectionid
      let section: Section | null = null;
      if (question.sectionid) {
        section = await prisma.section.findUnique({
          where: { id: question.sectionid }
        });
      }

      return {
        ...question,
        section
      };
    } catch (error) {
      console.error('Error obteniendo pregunta:', error);
      return null;
    }
  }

  /**
   * Obtiene preguntas aleatorias
   */
  async getRandomQuestions(limit: number = 5): Promise<QuestionWithSection[]> {
    try {
      const questions = await prisma.question.findMany({
        take: limit,
        orderBy: {
          id: 'asc'
        }
      });

      // Obtener información de secciones para las preguntas que tengan sectionid
      const questionsWithSections = await Promise.all(
        questions.map(async (question): Promise<QuestionWithSection> => {
          let section: Section | null = null;
          if (question.sectionid) {
            section = await prisma.section.findUnique({
              where: { id: question.sectionid }
            });
          }
          return {
            ...question,
            section
          };
        })
      );
      
      return questionsWithSections;
    } catch (error) {
      console.error('Error obteniendo preguntas aleatorias:', error);
      return [];
    }
  }

  /**
   * Obtiene preguntas fallidas de un usuario
   */
  async getFailedQuestions(telegramUserId: string, limit: number = 5): Promise<QuestionWithSection[]> {
    try {
      const failedQuestionLinks = await prisma.mdl_local_failed_questions_recovery.findMany({
        where: {
          userid: BigInt(telegramUserId)
        },
        take: limit,
        select: {
          questionid: true
        }
      });

      if (!failedQuestionLinks.length) {
        return [];
      }

      const questionIds = failedQuestionLinks.map(link => String(link.questionid));

      const questions = await prisma.question.findMany({
        where: {
          id: { in: questionIds }
        }
      });

      // Obtener información de secciones para las preguntas que tengan sectionid
      const questionsWithSections = await Promise.all(
        questions.map(async (question): Promise<QuestionWithSection> => {
          let section: Section | null = null;
          if (question.sectionid) {
            section = await prisma.section.findUnique({
              where: { id: question.sectionid }
            });
          }
          return {
            ...question,
            section
          };
        })
      );
      
      return questionsWithSections;
    } catch (error) {
      console.error('Error obteniendo preguntas fallidas:', error);
      return [];
    }
  }

  /**
   * Procesa la respuesta del usuario y registra analytics avanzados
   */
  async processUserResponse(
    telegramUserId: string,
    questionId: string,
    userAnswer: string,
    isCorrect: boolean,
    pointsEarned: number,
    pointsLost: number,
    responseTime?: number
  ): Promise<void> {
    try {
      // Obtener información de la pregunta
      const question = await this.getQuestionById(questionId);
      if (!question) {
        console.error('❌ Pregunta no encontrada:', questionId);
        return;
      }

      // Registrar respuesta para analytics avanzado
      await advancedAnalyticsService.recordUserResponse({
        telegramUserId,
        questionId,
        sectionId: Number(question.sectionid) || 1, // Corregido a lowercase y casteado a Number
        sectionName: question.section?.title || 'General', // Cambio: usar 'title' en lugar de 'name'
        userAnswer,
        correctAnswer: (question as any).correctanswer || '', // Campo no existe en el modelo
        isCorrect,
        responseTime,
        pointsEarned,
        pointsLost
      });

      // Verificar logros después de cada respuesta
      await advancedAnalyticsService.checkAndAwardAchievements(telegramUserId);

      console.log(`✅ Respuesta procesada y analytics registrados para usuario ${telegramUserId}`);
    } catch (error) {
      console.error('❌ Error procesando respuesta:', error);
    }
  }

  /**
   * Inicia una sesión de estudio
   */
  async startStudySession(
    telegramUserId: string,
    sessionType: 'normal' | 'failed_questions' | 'custom_topic' | 'tournament' = 'normal'
  ): Promise<string> {
    try {
      const sessionId = `session_${Date.now()}_${telegramUserId}`;
      
      // Aquí podrías almacenar el ID de sesión en memoria o base de datos
      // para tracking en tiempo real
      
      console.log(`✅ Sesión de estudio iniciada: ${sessionId} para usuario ${telegramUserId}`);
      return sessionId;
    } catch (error) {
      console.error('❌ Error iniciando sesión de estudio:', error);
      return '';
    }
  }

  /**
   * Finaliza una sesión de estudio
   */
  async endStudySession(
    sessionId: string,
    sessionData: {
      telegramUserId: string;
      sessionType: 'normal' | 'failed_questions' | 'custom_topic' | 'tournament';
      questionsAnswered: number;
      correctAnswers: number;
      incorrectAnswers: number;
      totalPointsEarned: number;
      totalPointsLost: number;
      sessionDuration?: number;
    }
  ): Promise<void> {
    try {
      await advancedAnalyticsService.recordStudySession(sessionData);
      
      // Generar recomendaciones basadas en la sesión
      await advancedAnalyticsService.generateRecommendations(sessionData.telegramUserId);
      
      console.log(`✅ Sesión de estudio finalizada: ${sessionId}`);
    } catch (error) {
      console.error('❌ Error finalizando sesión de estudio:', error);
    }
  }

  /**
   * Obtiene recomendaciones personalizadas para un usuario
   */
  async getUserRecommendations(telegramUserId: string) {
    try {
      const recommendations = await prisma.$queryRaw`
        SELECT * FROM mdl_local_telegram_recommendations 
        WHERE telegramuserid = ${telegramUserId} AND isactive = 1
        ORDER BY priority ASC
      ` as any[];
      
      return recommendations;
    } catch (error) {
      console.error('Error obteniendo recomendaciones:', error);
      return [];
    }
  }

  /**
   * Obtiene analytics detallados de un usuario
   */
  async getUserAnalytics(telegramUserId: string) {
    try {
      return await advancedAnalyticsService.getUserAnalytics(telegramUserId);
    } catch (error) {
      console.error('Error obteniendo analytics:', error);
      return null;
    }
  }
}

export const questionService = new QuestionService(); 