import { v4 as uuidv4 } from 'uuid';
import { cleanMalformedOptionsJSON } from '../utils/optionsParser';
import { prisma } from '@/lib/prisma';

interface SimulacroQuestion {
  id: string;
  questionnumber: number;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  category: string | null;
  difficulty: string | null;
}

interface SimulacroResult {
  id: string;
  status: string;
  startedat: Date;
  completedat: Date | null;
  timeElapsed: number;
  currentQuestionIndex: number;
  finalScore: number;
  finalPercentage: number;
  passed: boolean;
  totalquestions: number;
  timelimit: number;
  averageresponsetime: number | null;
}

export class SimulacroService {
  
  /**
   * Verificar si el usuario puede iniciar un simulacro
   */
  static async canStartSimulacro(telegramuserid: string): Promise<{ canStart: boolean; reason?: string }> {
    try {
      // Buscar usuario
      const user = await prisma.telegramuser.findUnique({
        where: { telegramuserid }
      });
      
      if (!user) {
        return { canStart: false, reason: 'Usuario no registrado' };
      }
      
      // Verificar si tiene un simulacro activo
      const activeSimulacro = await prisma.simulacro.findFirst({
        where: {
          userid: user.id.toString(),
          status: 'in_progress'
        }
      });
      
      if (activeSimulacro) {
        return { canStart: false, reason: 'Ya tienes un simulacro en progreso' };
      }
      
      return { canStart: true };
      
    } catch (error) {
      console.error('Error verificando si puede iniciar simulacro:', error);
      return { canStart: false, reason: 'Error interno' };
    }
  }
  
  /**
   * Iniciar un nuevo simulacro
   */
  static async startSimulacro(telegramuserid: string): Promise<{ simulacro: any; firstQuestion: SimulacroQuestion } | null> {
    try {
      // Verificar si puede iniciar
      const canStart = await this.canStartSimulacro(telegramuserid);
      if (!canStart.canStart) {
        throw new Error(canStart.reason);
      }
      
      // Buscar usuario
      const user = await prisma.telegramuser.findUnique({
        where: { telegramuserid }
      });
      
      if (!user) {
        throw new Error('Usuario no encontrado');
      }
      
      // Obtener 100 preguntas aleatorias del examen
      const allQuestions = await prisma.examenoficial2018.findMany({
        where: { isactive: true },
        orderBy: { questionnumber: 'asc' }
      });
      
      if (allQuestions.length < 100) {
        throw new Error('No hay suficientes preguntas disponibles');
      }
      
      // Crear el simulacro
      const simulacro = await prisma.simulacro.create({
        data: {
          id: uuidv4(),
          userid: user.id.toString(),
          status: 'in_progress',
          timelimit: 10800, // 180 minutos
          totalquestions: 100,
          currentquestionindex: 0,
          updatedat: new Date(),
          examtype: 'simulacro'
        }
      });
      
      // Crear todas las respuestas del simulacro con las preguntas en orden
      for (let i = 0; i < 100; i++) {
        const question = allQuestions[i];
        await prisma.simulacroresponse.create({
          data: {
            id: uuidv4(),
            simulacroid: simulacro.id,
            questionid: question.id,
            questionnumber: i + 1,
            questioncategory: question.category,
            questiondifficulty: question.difficulty,
            answeredat: null,
            selectedoption: null,
            iscorrect: null,
            responsetime: null,
            skipped: false,
            examtype: 'simulacro'
          }
        });
      }
      
      // Obtener la primera pregunta
      const firstQuestion = allQuestions[0];
      
      // Utilizar la función mejorada para parsear opciones
      const parsedOptions = cleanMalformedOptionsJSON(firstQuestion.options);
      // Mezclar aleatoriamente las opciones y actualizar el índice correcto
      const shuffledOptions = [...parsedOptions];
      const correctIndex = firstQuestion.correctanswerindex;
      const correctOption = shuffledOptions[correctIndex];
      for (let i = shuffledOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
      }
      const newCorrectIndex = shuffledOptions.findIndex(opt => opt === correctOption);
      return {
        simulacro,
        firstQuestion: {
          id: firstQuestion.id,
          questionnumber: firstQuestion.questionnumber,
          question: firstQuestion.question,
          options: shuffledOptions,
          correctAnswerIndex: newCorrectIndex,
          category: firstQuestion.category,
          difficulty: firstQuestion.difficulty
        }
      };
      
    } catch (error) {
      console.error('Error iniciando simulacro:', error);
      return null;
    }
  }
  
  /**
   * Obtener simulacro activo del usuario
   */
  static async getActiveSimulacro(telegramuserid: string): Promise<any | null> {
    try {
      const user = await prisma.telegramuser.findUnique({
        where: { telegramuserid }
      });
      
      if (!user) return null;
      
      const simulacro = await prisma.simulacro.findFirst({
        where: {
          userid: user.id.toString(),
          status: 'in_progress'
        }
      });
      
      return simulacro;
      
    } catch (error) {
      console.error('Error obteniendo simulacro activo:', error);
      return null;
    }
  }
  
  /**
   * Obtener la pregunta actual del simulacro
   */
  static async getCurrentQuestion(simulacroId: string): Promise<SimulacroQuestion | null> {
    try {
      const simulacro = await prisma.simulacro.findUnique({
        where: { id: simulacroId }
      });
      
      if (!simulacro || simulacro.status !== 'in_progress') {
        return null;
      }
      
      // Obtener la respuesta sin contestar con menor número de pregunta
      const nextResponse = await prisma.simulacroresponse.findFirst({
        where: {
          simulacroid: simulacroId,
          answeredat: null,
          skipped: false
        },
        orderBy: {
          questionnumber: 'asc'
        }
      });
      
      if (!nextResponse) {
        return null;
      }
      
      // Obtener la pregunta por separado
      const question = await prisma.examenoficial2018.findUnique({
        where: { id: nextResponse.questionid }
      });
      
      if (!question) {
        throw new Error('Pregunta no encontrada');
      }
      
      // Utilizar la función mejorada para parsear opciones
      const parsedOptions = cleanMalformedOptionsJSON(question.options);
      
      // Mezclar aleatoriamente las opciones y actualizar el índice correcto
      const shuffledOptions = [...parsedOptions];
      const correctIndex = question.correctanswerindex;
      const correctOption = shuffledOptions[correctIndex];
      for (let i = shuffledOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
      }
      const newCorrectIndex = shuffledOptions.findIndex(opt => opt === correctOption);
      return {
        id: question.id,
        questionnumber: nextResponse.questionnumber,
        question: question.question || '',
        options: shuffledOptions,
        correctAnswerIndex: newCorrectIndex,
        category: nextResponse.questioncategory,
        difficulty: nextResponse.questiondifficulty
      };
      
    } catch (error) {
      console.error('Error obteniendo pregunta actual:', error);
      return null;
    }
  }
  
  /**
   * Procesar respuesta de una pregunta del simulacro
   */
  static async processAnswer(
    simulacroId: string, 
    questionNumber: number, 
    selectedOption: number,
    responseTime: number
  ): Promise<{ isCorrect: boolean; nextQuestion: SimulacroQuestion | null; isCompleted: boolean }> {
    try {
      console.log('🔄 PROCESSANSWER - Iniciando con parámetros:', {
        simulacroId,
        questionNumber,
        selectedOption,
        responseTime
      });
      
      // Buscar la respuesta del simulacro
      const simulacroResponse = await prisma.simulacroresponse.findFirst({
        where: {
          simulacroid: simulacroId,
          questionnumber: questionNumber
        }
      });
      
      if (!simulacroResponse) {
        console.error('❌ PROCESSANSWER - Respuesta no encontrada para:', { simulacroId, questionNumber });
        throw new Error('Respuesta del simulacro no encontrada');
      }
      
      console.log('✅ PROCESSANSWER - Respuesta encontrada:', {
        responseId: simulacroResponse.id,
        questionNumber: simulacroResponse.questionnumber,
        alreadyAnswered: simulacroResponse.answeredat !== null
      });
      
      // Obtener la pregunta por separado
      const question = await prisma.examenoficial2018.findUnique({
        where: { id: simulacroResponse.questionid }
      });
      if (!question) {
        throw new Error('Pregunta no encontrada');
      }
      // Obtener las opciones mezcladas y el índice correcto desde la respuesta del usuario
      const parsedOptions = cleanMalformedOptionsJSON(question.options);
      // Mezclar las opciones de la misma forma que al mostrar la pregunta
      const shuffledOptions = [...parsedOptions];
      const correctIndex = question.correctanswerindex;
      const correctOption = shuffledOptions[correctIndex];
      for (let i = shuffledOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
      }
      const newCorrectIndex = shuffledOptions.findIndex(opt => opt === correctOption);
      const isCorrect = selectedOption === newCorrectIndex;
      
      console.log('📊 PROCESSANSWER - Evaluación:', {
        selectedOption,
        correctOption: question.correctanswerindex,
        isCorrect
      });
      
      // VERIFICAR ESTADO ANTES DE ACTUALIZAR
      const responsesBeforeUpdate = await prisma.simulacroresponse.count({
          where: {
            simulacroid: simulacroId,
            answeredat: { not: null }
          }
        });
      
      console.log('📈 PROCESSANSWER - ANTES de actualizar:', {
        responsesAlreadyAnswered: responsesBeforeUpdate
      });
      
      // Actualizar la respuesta
      const updateResult = await prisma.simulacroresponse.update({
        where: { id: simulacroResponse.id },
        data: {
          selectedoption: selectedOption,
          iscorrect: isCorrect,
          responsetime: responseTime,
          answeredat: new Date()
        }
      });
      
      console.log('✅ PROCESSANSWER - Respuesta actualizada:', {
        updatedResponseId: updateResult.id,
        questionNumber: updateResult.questionnumber
      });
      
      // VERIFICAR ESTADO DESPUÉS DE ACTUALIZAR
      const responsesAfterUpdate = await prisma.simulacroresponse.count({
        where: {
          simulacroid: simulacroId,
          answeredat: { not: null }
        }
      });
      
      console.log('📈 PROCESSANSWER - DESPUÉS de actualizar:', {
        responsesNowAnswered: responsesAfterUpdate,
        expectedIncrease: responsesBeforeUpdate + 1,
        unexpectedMassUpdate: responsesAfterUpdate !== (responsesBeforeUpdate + 1)
      });
      
      if (responsesAfterUpdate !== (responsesBeforeUpdate + 1)) {
        console.error('🚨 PROBLEMA DETECTADO: Se actualizaron múltiples respuestas en lugar de una sola!');
        console.error('🔍 Expected:', responsesBeforeUpdate + 1, 'Got:', responsesAfterUpdate);
      }
      
      // Actualizar estadísticas del simulacro
      const updatedStats = await this.updateSimulacroStats(simulacroId);
      
      // Verificar si está completado
      const remainingQuestions = await prisma.simulacroresponse.count({
        where: {
          simulacroid: simulacroId,
          answeredat: null,
          skipped: false
        }
      });
      
      console.log('🎯 PROCESSANSWER - Estado de completado:', {
        remainingQuestions,
        totalResponses: responsesAfterUpdate,
        isCompleted: remainingQuestions === 0
      });
      
      let nextQuestion: SimulacroQuestion | null = null;
      let isCompleted = false;
      
      if (remainingQuestions === 0) {
        // Completar simulacro
        console.log('🏁 PROCESSANSWER - Marcando simulacro como completado');
        await this.completeSimulacro(simulacroId);
        isCompleted = true;
      } else {
        // Obtener siguiente pregunta
        console.log('➡️ PROCESSANSWER - Obteniendo siguiente pregunta');
        nextQuestion = await this.getCurrentQuestion(simulacroId);
        console.log('📝 PROCESSANSWER - Siguiente pregunta:', nextQuestion ? `#${nextQuestion.questionnumber}` : 'null');
      }
      
      console.log('✅ PROCESSANSWER - Resultado final:', {
        isCorrect,
        isCompleted,
        hasNextQuestion: !!nextQuestion
      });
      
      return {
        isCorrect,
        nextQuestion,
        isCompleted
      };
      
    } catch (error) {
      console.error('❌ PROCESSANSWER - Error:', error);
      throw error;
    }
  }
  
  /**
   * Actualizar estadísticas del simulacro
   */
  static async updateSimulacroStats(simulacroId: string): Promise<void> {
    try {
      const responses = await prisma.simulacroresponse.findMany({
        where: {
          simulacroid: simulacroId,
          answeredat: { not: null }
        }
      });
      
      const correctAnswers = responses.filter(r => r.iscorrect).length;
      const totalAnswered = responses.length;
      const responsesWithTime = responses.filter(r => r.responsetime !== null);
      
      const averageResponseTime = responsesWithTime.length > 0
        ? responsesWithTime.reduce((sum, r) => sum + (r.responsetime || 0), 0) / responsesWithTime.length
        : null;
      
      const simulacro = await prisma.simulacro.findUnique({
        where: { id: simulacroId }
      });
      
      if (simulacro) {
        const timeElapsed = Math.floor((Date.now() - simulacro.startedat.getTime()) / 1000);
        
        await prisma.simulacro.update({
          where: { id: simulacroId },
          data: {
            timeelapsed: timeElapsed,
            currentquestionindex: totalAnswered,
            finalscore: correctAnswers,
            finalpercentage: totalAnswered > 0 ? (correctAnswers / totalAnswered) * 100 : 0,
            averageresponsetime: averageResponseTime
          }
        });
      }
      
    } catch (error) {
      console.error('Error actualizando estadísticas:', error);
    }
  }
  
  /**
   * Completar simulacro
   */
  static async completeSimulacro(simulacroId: string): Promise<SimulacroResult | null> {
    try {
      const simulacro = await prisma.simulacro.findUnique({
        where: { id: simulacroId }
      });
      
      if (!simulacro) return null;
      
      const responses = await prisma.simulacroresponse.findMany({
        where: { simulacroid: simulacroId, answeredat: { not: null } }
      });
      const correctAnswers = responses.filter(r => r.iscorrect).length;
      const totalQuestions = simulacro.totalquestions;
      const finalPercentage = (correctAnswers / totalQuestions) * 100;
      const passed = finalPercentage >= 50;
      
      const responsesWithTime = responses.filter(r => r.responsetime !== null);
      const averageResponseTime = responsesWithTime.length > 0
        ? responsesWithTime.reduce((sum, r) => sum + (r.responsetime || 0), 0) / responsesWithTime.length
        : null;
      
      const timeElapsed = Math.floor((Date.now() - simulacro.startedat.getTime()) / 1000);
      
      const completedSimulacro = await prisma.simulacro.update({
        where: { id: simulacroId },
        data: {
          status: 'completed',
          completedat: new Date(),
          timeelapsed: timeElapsed,
          finalscore: correctAnswers,
          finalpercentage: finalPercentage,
          passed,
          averageresponsetime: averageResponseTime
        }
      });
      
      return {
        id: completedSimulacro.id,
        status: completedSimulacro.status,
        startedat: completedSimulacro.startedat,
        completedat: completedSimulacro.completedat,
        timeElapsed: completedSimulacro.timeelapsed,
        currentQuestionIndex: completedSimulacro.currentquestionindex,
        finalScore: completedSimulacro.finalscore,
        finalPercentage: completedSimulacro.finalpercentage,
        passed: completedSimulacro.passed,
        totalquestions: completedSimulacro.totalquestions,
        timelimit: completedSimulacro.timelimit,
        averageresponsetime: completedSimulacro.averageresponsetime
      };
      
    } catch (error) {
      console.error('Error completando simulacro:', error);
      return null;
    }
  }
  
  /**
   * Abandonar simulacro
   */
  static async abandonSimulacro(simulacroId: string): Promise<boolean> {
    try {
      await prisma.simulacro.update({
        where: { id: simulacroId },
        data: {
          status: 'abandoned',
          completedat: new Date()
        }
      });
      
      return true;
      
    } catch (error) {
      console.error('Error abandonando simulacro:', error);
      return false;
    }
  }
  
  /**
   * Obtener historial de simulacros del usuario
   */
  static async getSimulacroHistory(telegramuserid: string, limit: number = 10): Promise<SimulacroResult[]> {
    try {
      const user = await prisma.telegramuser.findUnique({
        where: { telegramuserid }
      });
      
      if (!user) return [];
      
      const simulacros = await prisma.simulacro.findMany({
        where: {
          userid: user.id.toString(),
          status: { in: ['completed', 'abandoned'] }
        },
        orderBy: { startedat: 'desc' },
        take: limit
      });
      
      return simulacros.map(s => ({
        id: s.id,
        status: s.status,
        startedat: s.startedat,
        completedat: s.completedat,
        timeElapsed: s.timeelapsed,
        currentQuestionIndex: s.currentquestionindex,
        finalScore: s.finalscore,
        finalPercentage: s.finalpercentage,
        passed: s.passed,
        totalquestions: s.totalquestions,
        timelimit: s.timelimit,
        averageresponsetime: s.averageresponsetime
      }));
      
    } catch (error) {
      console.error('Error obteniendo historial:', error);
      return [];
    }
  }
  
  /**
   * Verificar y marcar simulacros expirados
   */
  static async checkExpiredSimulacros(): Promise<number> {
    try {
      const result = await prisma.simulacro.updateMany({
        where: {
          status: 'in_progress',
          startedat: {
            lt: new Date(Date.now() - 10800 * 1000) // 3 horas atrás
          }
        },
        data: {
          status: 'expired',
          completedat: new Date()
        }
      });
      
      return result.count;
      
    } catch (error) {
      console.error('Error verificando simulacros expirados:', error);
      return 0;
    }
  }
}

export default SimulacroService;