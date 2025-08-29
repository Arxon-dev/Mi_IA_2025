import { cleanMalformedOptionsJSON } from '../utils/optionsParser';
import { prisma } from '@/lib/prisma';

interface TournamentManager {
  isRunning: boolean;
  start(): void;
  handlePollAnswer(pollAnswer: any): Promise<boolean>;
}

interface TournamentPollAnswer {
  poll_id: string;
  user: {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
  };
  option_ids: number[];
}

export class TournamentService {
  private static instance: TournamentService;
  private tournamentModule: any = null;
  private initialized = false;

  private constructor() {}

  public static getInstance(): TournamentService {
    if (!TournamentService.instance) {
      TournamentService.instance = new TournamentService();
    }
    return TournamentService.instance;
  }

  private calculateDynamicPrizePool(participantCount: number, questionscount: number): number {
    // Fórmula: Base por pregunta + bonus por participante + multiplicador de competitividad
    const basePerQuestion = 5; // 5 puntos base por pregunta
    const participantBonus = participantCount * 10; // 10 puntos adicionales por participante
    const competitivenessMultiplier = participantCount > 10 ? 1.5 : 1.2; // Más atractivo con más gente
    
    const basePrize = (questionscount * basePerQuestion) + participantBonus;
    const finalPrize = Math.round(basePrize * competitivenessMultiplier);
    
    // Mínimo garantizado de 100 puntos para que sea atractivo
    return Math.max(finalPrize, 100);
  }

  private async initializeTournamentModule() {
    if (this.initialized) return;

    try {
      // Tournament module not available - using internal implementation
      this.tournamentModule = {
        createTournamentManager: () => ({
          isRunning: false,
          start: () => {},
          handlePollAnswer: async () => false
        })
      };
      this.initialized = true;
      console.log('✅ Tournament module initialized successfully (internal mode)');
    } catch (error) {
      console.error('❌ Error initializing tournament module:', error);
      // If module doesn't exist, create a basic implementation
      this.tournamentModule = {
        createTournamentManager: () => ({
          isRunning: false,
          start: () => {},
          handlePollAnswer: async () => false
        })
      };
      this.initialized = true;
    }
  }

  public async getTournamentManager(): Promise<TournamentManager | null> {
    await this.initializeTournamentModule();
    
    if (!this.tournamentModule || !this.tournamentModule.createTournamentManager) {
      console.warn('⚠️ Tournament module not available');
      return null;
    }

    try {
      return this.tournamentModule.createTournamentManager();
    } catch (error) {
      console.error('❌ Error creating tournament manager:', error);
      return null;
    }
  }

  public async handleTournamentPollAnswer(pollAnswer: TournamentPollAnswer): Promise<boolean> {
    const manager = await this.getTournamentManager();
    if (!manager) {
      console.warn('⚠️ Tournament manager not available');
      return false;
    }

    try {
      return await manager.handlePollAnswer(pollAnswer);
    } catch (error) {
      console.error('❌ Error handling tournament poll answer:', error);
      return false;
    }
  }

  private normalizeQuestionData(questionData: any, sourceTable: string) {
    const baseQuestion = {
      id: questionData.id,
      question: questionData.question,
      options: questionData.options,
      correctanswerindex: questionData.correctanswerindex,
      category: questionData.category || 'general',
      difficulty: questionData.difficulty || 'medium',
      feedback: questionData.feedback || '',
      bloomlevel: questionData.bloomlevel || 'knowledge'
    };

    // Add source-specific fields
    switch (sourceTable) {
      case 'validQuestion':
        return {
          ...baseQuestion,
          questionnumber: questionData.questionnumber,
          type: questionData.type || 'multiple_choice',
          sectionid: questionData.sectionid,
          documentid: questionData.documentid
        };
      case 'aire':
        return {
          ...baseQuestion,
          questionnumber: questionData.questionnumber,
          type: questionData.type || 'multiple_choice',
          sectionid: questionData.sectionid,
          documentid: questionData.documentid
        };
      case 'examen2018':
        return {
          ...baseQuestion,
          questionnumber: questionData.questionnumber,
          examyear: 2018
        };
      case 'examen2024':
        return {
          ...baseQuestion,
          questionnumber: questionData.questionnumber,
          examyear: 2024
        };
      default:
        return baseQuestion;
    }
  }

  public async ensureTournamentManagerRunning(): Promise<TournamentManager | null> {
    const manager = await this.getTournamentManager();
    if (!manager) return null;

    if (!manager.isRunning) {
      try {
        manager.start();
        console.log('✅ Tournament manager started successfully');
      } catch (error) {
        console.error('❌ Error starting tournament manager:', error);
        return null;
      }
    }

    return manager;
  }

  public async isAvailable(): Promise<boolean> {
    const manager = await this.getTournamentManager();
    return manager !== null;
  }

  public async getTournamentList(userid: string) {
    try {
      const tournaments = await prisma.tournament.findMany({
        where: {
          status: {
            in: ['open', 'active', 'upcoming']
          }
        },
        orderBy: { scheduleddate: 'asc' }
      });

      // Agregar count de participantes manualmente para cada tournament
      const tournamentsWithCount = await Promise.all(
        tournaments.map(async (tournament) => {
          const participantCount = await prisma.tournamentparticipant.count({
            where: { tournamentid: tournament.id }
          });
          return {
            ...tournament,
            _count: { participants: participantCount }
          };
        })
      );

      return tournamentsWithCount;
    } catch (error) {
      console.error('❌ Error getting tournament list:', error);
      return [];
    } finally {
      await prisma.$disconnect();
    }
  }

  public async joinTournament(tournamentId: string, userid: string) {
    try {
      // Check if tournament exists and is open for registration
      const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId }
      });

      // Check if user is already registered
      const existingParticipant = await prisma.tournamentparticipant.findFirst({
        where: {
          tournamentid: tournamentId,
          userid: userid
        }
      });

      if (!tournament) {
        return { success: false, message: 'Tournament not found' };
      }

      if (existingParticipant) {
        return { success: false, message: 'Already registered for this tournament' };
      }

      // Check if tournament is full
      if (tournament.maxparticipants) {
        const participantCount = await prisma.tournamentparticipant.count({
          where: { tournamentid: tournamentId }
        });
        
        if (participantCount >= tournament.maxparticipants) {
          return { success: false, message: 'Tournament is full' };
        }
      }

      // Create participant
      const participant = await prisma.tournamentparticipant.create({
        data: {
          id: `${tournamentId}-${userid}-${Date.now()}`,
          tournamentid: tournamentId,
          userid: userid,
          status: 'registered'
        }
      });

      // Update tournament questions count if needed
      if (tournament.questionscount === 0) {
        await prisma.tournament.update({
          where: { id: tournamentId },
          data: {
            questionscount: 50, // Default questions count
            prizepool: tournament.prizepool || 100
          }
        });
      }

      return { success: true, participant };
    } catch (error) {
      console.error('❌ Error joining tournament:', error);
      return { success: false, message: 'Error joining tournament' };
    } finally {
      await prisma.$disconnect();
    }
  }

  public async leaveTournament(tournamentId: string, userid: string) {
    try {
      await prisma.tournamentparticipant.deleteMany({
        where: {
          tournamentid: tournamentId,
          userid: userid
        }
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Error leaving tournament:', error);
      return { success: false, message: 'Error leaving tournament' };
    } finally {
      await prisma.$disconnect();
    }
  }

  public async getUserTournamentHistory(userid: string) {
    try {
      const participations = await prisma.tournamentparticipant.findMany({
        where: { userid: userid },
        orderBy: { registeredat: 'desc' }
      });

      // Enriquecer cada participación con datos del torneo y respuestas
      const enrichedParticipations = await Promise.all(
        participations.map(async (participation) => {
          // Obtener datos del torneo
          const tournament = await prisma.tournament.findUnique({
            where: { id: participation.tournamentid }
          });

          // Obtener respuestas del torneo
          const responses = await prisma.tournamentresponse.findMany({
            where: { participantid: participation.id },
            orderBy: { questionnumber: 'asc' }
          });

          return {
            ...participation,
            tournament: tournament || {
              id: participation.tournamentid,
              name: 'Torneo Desconocido',
              title: null,
              description: null,
              scheduleddate: new Date(),
              starttime: null,
              endtime: null,
              actualstarttime: null,
              actualendtime: null,
              status: 'UNKNOWN',
              maxparticipants: null,
              questionscount: 0,
              timelimit: 7200,
              prizepool: 0,
              notificationssent: null,
              createdat: new Date(),
              updatedat: new Date(),
              trial794: null
            },
            responses: responses || []
          };
        })
      );

      return enrichedParticipations;
    } catch (error) {
      console.error('❌ Error getting tournament history:', error);
      return [];
    } finally {
      await prisma.$disconnect();
    }
  }

  private async sendNextQuestionIfNeeded(participant: any, prisma: any) {
    try {
      const tournament = participant.tournament;
      const currentQuestionNumber = participant.currentQuestion;
      
      if (currentQuestionNumber > tournament.questionscount) {
        // Tournament completed for this participant
        await this.sendTournamentCompletionMessage(participant, tournament, prisma);
        return;
      }

      // Get next question for this tournament
      const nextQuestion = await prisma.tournamentquestion.findFirst({
        where: {
          tournamentid: tournament.id,
          questionnumber: currentQuestionNumber
        }
      });

      if (!nextQuestion) {
        console.warn(`⚠️ No question found for tournament ${tournament.id}, question ${currentQuestionNumber}`);
        return;
      }

      // Get the actual question data
      let questionData = null;
      
      if (nextQuestion.sourcetable === 'validQuestion') {
        questionData = await prisma.validquestion.findUnique({
          where: { id: nextQuestion.questionId }
        });
      } else if (nextQuestion.sourcetable === 'aire') {
        questionData = await prisma.aire.findUnique({
          where: { id: nextQuestion.questionId }
        });
      } else if (nextQuestion.sourcetable === 'examen2018') {
        questionData = await prisma.examen2018.findUnique({
          where: { id: nextQuestion.questionId }
        });
      } else if (nextQuestion.sourcetable === 'examen2024') {
        questionData = await prisma.examen2024.findUnique({
          where: { id: nextQuestion.questionId }
        });
      }

      if (!questionData) {
        console.warn(`⚠️ Question data not found for ${nextQuestion.sourcetable}:${nextQuestion.questionId}`);
        
        // Try to find an alternative question
        const alternativeQuestion = await this.findAlternativeValidQuestion(
          tournament.id,
          nextQuestion.questionId,
          currentQuestionNumber,
          prisma
        );

        if (alternativeQuestion) {
          questionData = alternativeQuestion;
        } else {
          console.error(`❌ No alternative question found for tournament ${tournament.id}, question ${currentQuestionNumber}`);
          return;
        }
      }

      // Normalize question data
      const normalizedQuestion = this.normalizeQuestionData(questionData, nextQuestion.sourcetable);

      // Parse options
      let options: string[] = [];
      try {
        if (typeof normalizedQuestion.options === 'string') {
          options = cleanMalformedOptionsJSON(normalizedQuestion.options);
        } else if (Array.isArray(normalizedQuestion.options)) {
          options = normalizedQuestion.options;
        }
      } catch (error) {
        console.error('❌ Error parsing question options:', error);
        return;
      }

      if (options.length === 0) {
        console.error('❌ No options found for question');
        return;
      }

             // Send poll to user
       const pollResult = await this.sendTelegramPoll(
        participant.userid,
        normalizedQuestion.question,
        options,
        normalizedQuestion.correctanswerindex,
        currentQuestionNumber,
        tournament.questionscount,
        tournament.name
      );

      if (pollResult.success && pollResult.pollid) {
        // Record the poll in telegrampoll table
        await prisma.telegrampoll.create({
          data: {
            id: `tournament-${pollResult.pollid}-${Date.now()}`,
            pollid: pollResult.pollid,
            questionId: normalizedQuestion.id,
            chatid: participant.userid,
            correctanswerindex: normalizedQuestion.correctanswerindex,
            options: JSON.stringify(options),
            sourcemodel: `tournament-${nextQuestion.sourcetable}`
          }
        });

        console.log(`✅ Tournament question sent to user ${participant.userid}: ${normalizedQuestion.question.substring(0, 50)}...`);
      } else {
        console.error(`❌ Failed to send tournament poll to user ${participant.userid}: ${pollResult.reason}`);
      }
    } catch (error) {
      console.error('❌ Error sending next tournament question:', error);
    }
  }

  private sanitizeForTelegram(text: string): string {
    if (!text) return '';
    
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private async sendTelegramPoll(
    telegramuserid: string,
    questionText: string,
    options: string[],
    correctanswerindex: number,
    currentQuestion: number,
    totalquestions: number,
    tournamentName: string
  ): Promise<{ success: boolean; pollid?: string; reason?: string; questionLength?: number }> {
    
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const MAX_QUESTION_LENGTH = 300;
    
    if (!TELEGRAM_BOT_TOKEN) {
      return { success: false, reason: 'Bot token not configured' };
    }

    try {
      const sanitizedQuestion = this.sanitizeForTelegram(questionText);
      const questionHeader = `🏆 ${tournamentName} | Pregunta ${currentQuestion}/${totalquestions}\n\n`;
      const fullQuestion = `${questionHeader}${sanitizedQuestion}`;
      
      const truncatedQuestion = this.truncatePollQuestion(questionHeader, sanitizedQuestion, MAX_QUESTION_LENGTH);
      
      const pollData = {
        chat_id: telegramuserid,
        question: truncatedQuestion,
        options: options.map(opt => this.sanitizeForTelegram(opt)),
        is_anonymous: false,
        type: 'quiz',
        correct_option_id: correctanswerindex,
        explanation: `Pregunta ${currentQuestion} de ${totalquestions} del torneo "${tournamentName}"`
      };

      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPoll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pollData)
      });

      const result = await response.json();
      
      if (result.ok && result.result?.poll?.id) {
        return { 
          success: true, 
          pollid: result.result.poll.id,
          questionLength: fullQuestion.length
        };
      } else {
        return { 
          success: false, 
          reason: result.description || 'Unknown error',
          questionLength: fullQuestion.length
        };
      }
    } catch (error) {
      console.error('❌ Error sending tournament poll:', error);
      return { success: false, reason: 'Network error' };
    }
  }

  private async sendTournamentCompletionMessage(participant: any, tournament: any, prisma: any): Promise<void> {
    // Implementation for tournament completion message
    console.log(`🏆 Tournament completed for participant ${participant.userid} in tournament ${tournament.name}`);
  }

  private async checkTournamentCompletion(tournamentId: string, prisma: any): Promise<void> {
    // Implementation for checking if tournament is completed
    console.log(`🔍 Checking tournament completion for ${tournamentId}`);
  }

  private async findAlternativeValidQuestion(
    tournamentId: string, 
    currentQuestionId: string,
    questionnumber: number,
    prisma: any
  ): Promise<any | null> {
    try {
      // Try to find from validquestion table
      const alternativeQuestion = await prisma.validquestion.findFirst({
        where: {
          id: { not: currentQuestionId },
          isactive: true
        },
        orderBy: { questionnumber: 'asc' }
      });

      return alternativeQuestion;
    } catch (error) {
      console.error('❌ Error finding alternative question:', error);
      return null;
    }
  }

  private truncatePollQuestion(header: string, question: string, maxLength: number = 300): string {
    const totalLength = header.length + question.length;
    
    if (totalLength <= maxLength) {
      return header + question;
    }
    
    const availableLength = maxLength - header.length - 3; // 3 for "..."
    const truncatedQuestion = question.substring(0, availableLength) + '...';
    
    return header + truncatedQuestion;
  }

  private calculateCurrentStreak(responses: boolean[]): number {
    let streak = 0;
    for (let i = responses.length - 1; i >= 0; i--) {
      if (responses[i]) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }
}

// Crear y exportar una instancia singleton del servicio
const tournamentService = TournamentService.getInstance();

// Exportar la clase TournamentService (ya exportada arriba)
// export class TournamentService { ... }

// Exportar la instancia singleton para compatibilidad con imports existentes
export { tournamentService };

// Exportar como default también
export default tournamentService;