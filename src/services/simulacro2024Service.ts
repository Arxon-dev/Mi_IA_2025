import { v4 as uuidv4 } from 'uuid';
import { cleanMalformedOptionsJSON } from '../utils/optionsParser';
import { prisma } from '@/lib/prisma';

interface Simulacro2024Question {
  id: string;
  questionnumber: number;
  question: string;
  options: string[];
  correctanswerindex: number;
  category: string | null;
  difficulty: string | null;
}

interface Simulacro2024Result {
  id: string;
  status: string;
  examType: string;
  startedAt: Date;
  completedAt: Date | null;
  timeElapsed: number;
  currentQuestionIndex: number;
  finalScore: number;
  finalPercentage: number;
  passed: boolean;
  totalquestions: number;
  timelimit: number;
  averageResponseTime: number | null;
}

export class Simulacro2024Service {
  
  /**
   * Verificar si el usuario puede iniciar un simulacro 2024
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
      
      // Verificar si tiene un simulacro activo (cualquier tipo)
      const activeSimulacro = await prisma.simulacro.findFirst({
        where: {
          userid: user.id.toString(),
          status: 'in_progress'
        }
      });
      
      if (activeSimulacro) {
        return { canStart: false, reason: 'Ya tienes un simulacro en progreso' };
      }
      
      // Verificar que hay suficientes preguntas del examen 2024
      const questionCount = await prisma.examenoficial2024.count({
        where: { isactive: true }
      });
      
      if (questionCount < 100) {
        return { canStart: false, reason: 'No hay suficientes preguntas del Examen 2024 disponibles' };
      }
      
      return { canStart: true };
      
    } catch (error) {
      console.error('Error verificando si puede iniciar simulacro 2024:', error);
      return { canStart: false, reason: 'Error interno' };
    }
  }
  
  /**
   * Iniciar un nuevo simulacro del examen 2024
   */
  static async startSimulacro(telegramuserid: string): Promise<{ simulacro: any; firstQuestion: Simulacro2024Question } | null> {
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
      
      // Obtener 100 preguntas del examen 2024 en orden
      const allQuestions = await prisma.examenoficial2024.findMany({
        where: { isactive: true },
        orderBy: { questionnumber: 'asc' },
        take: 100
      });
      
      if (allQuestions.length < 100) {
        throw new Error('No hay suficientes preguntas del Examen 2024 disponibles');
      }
      
      // Crear el simulacro con tipo específico
      const simulacro = await prisma.simulacro.create({
        data: {
          id: uuidv4(),
          userid: user.id.toString(),
          status: 'in_progress',
          timelimit: 10800, // 180 minutos
          totalquestions: 100,
          currentquestionindex: 0,
          examtype: 'EXAMEN_2024', // Identificador del tipo de examen
          updatedat: new Date()
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
            examtype: 'EXAMEN_2024' // Para diferenciarlo en las consultas
          }
        });
      }
      
      // Obtener la primera pregunta
      const firstQuestion = allQuestions[0];
      
      // Utilizar la función mejorada para parsear opciones
      const parsedOptions = cleanMalformedOptionsJSON(firstQuestion.options);
      
      return {
        simulacro,
        firstQuestion: {
          id: firstQuestion.id,
          questionnumber: firstQuestion.questionnumber,
          question: firstQuestion.question,
          options: parsedOptions,
          correctanswerindex: firstQuestion.correctanswerindex,
          category: firstQuestion.category,
          difficulty: firstQuestion.difficulty
        }
      };
      
    } catch (error) {
      console.error('Error iniciando simulacro 2024:', error);
      return null;
    }
  }
  
  /**
   * Obtener simulacro activo del usuario (del tipo 2024)
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
          status: 'in_progress',
          examtype: 'EXAMEN_2024'
        }
      });
      
      if (!simulacro) return null;
      
      // Obtener las respuestas por separado
      const responses = await prisma.simulacroresponse.findMany({
        where: {
          simulacroid: simulacro.id,
          examtype: 'EXAMEN_2024'
        },
        orderBy: { questionnumber: 'asc' }
      });
      
      // Agregar las respuestas al objeto simulacro
       const simulacroWithResponses = {
         ...simulacro,
         responses
       };
       
       return simulacroWithResponses;
      
    } catch (error) {
      console.error('Error obteniendo simulacro 2024 activo:', error);
      return null;
    }
  }
  
  /**
   * Obtener la pregunta actual del simulacro 2024
   */
  static async getCurrentQuestion(simulacroId: string): Promise<Simulacro2024Question | null> {
    try {
      const simulacro = await prisma.simulacro.findUnique({
        where: { id: simulacroId }
      });
      
      if (!simulacro || simulacro.status !== 'in_progress' || simulacro.examtype !== 'EXAMEN_2024') {
        return null;
      }
      
      // Obtener la respuesta sin contestar con menor número de pregunta
      const nextResponse = await prisma.simulacroresponse.findFirst({
        where: {
          simulacroid: simulacroId,
          examtype: 'EXAMEN_2024',
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
      
      // Obtener la pregunta del examen 2024 por separado
      const question = await prisma.examenoficial2024.findUnique({
        where: { id: nextResponse.questionid }
      });
      
      if (!question) {
        return null;
      }
      
      // Utilizar la función mejorada para parsear opciones
      const parsedOptions = cleanMalformedOptionsJSON(question.options);
      
      return {
        id: question.id,
        questionnumber: nextResponse.questionnumber,
        question: question.question,
        options: parsedOptions,
        correctanswerindex: question.correctanswerindex,
        category: nextResponse.questioncategory,
        difficulty: nextResponse.questiondifficulty
      };
      
    } catch (error) {
      console.error('Error obteniendo pregunta actual del simulacro 2024:', error);
      return null;
    }
  }
  
  /**
   * Procesar respuesta de una pregunta del simulacro 2024
   */
  static async processAnswer(
    simulacroId: string, 
    questionnumber: number, 
    selectedOption: number,
    responsetime: number
  ): Promise<{ iscorrect: boolean; nextQuestion: Simulacro2024Question | null; isCompleted: boolean }> {
    try {
      console.log('🔄 SIMULACRO2024 - Procesando respuesta:', {
        simulacroId,
        questionnumber,
        selectedOption,
        responsetime
      });
      
      // Buscar la respuesta del simulacro
      const simulacroResponse = await prisma.simulacroresponse.findFirst({
        where: {
          simulacroid: simulacroId,
          questionnumber,
          examtype: 'EXAMEN_2024'
        }
      });
      
      if (!simulacroResponse) {
        console.error('❌ SIMULACRO2024 - Respuesta no encontrada para:', { simulacroId, questionnumber });
        throw new Error('Respuesta del simulacro 2024 no encontrada');
      }
      
      // Obtener la pregunta del examen 2024 por separado
      const question = await prisma.examenoficial2024.findUnique({
        where: { id: simulacroResponse.questionid }
      });
      
      if (!question) {
        console.error('❌ SIMULACRO2024 - Pregunta no encontrada para:', { questionId: simulacroResponse.questionid });
        throw new Error('Pregunta del examen 2024 no encontrada');
      }
      
      const iscorrect = selectedOption === question.correctanswerindex;
      
      console.log('📊 SIMULACRO2024 - Evaluación:', {
        selectedOption,
        correctOption: question.correctanswerindex,
        iscorrect
      });
      
      // Actualizar la respuesta
      await prisma.simulacroresponse.update({
        where: { id: simulacroResponse.id },
        data: {
          selectedoption: selectedOption,
          iscorrect,
          responsetime,
          answeredat: new Date()
        }
      });
      
      console.log('✅ SIMULACRO2024 - Respuesta actualizada');
      
      // Actualizar estadísticas del simulacro
      await this.updateSimulacroStats(simulacroId);
      
      // Verificar si está completado
      const remainingQuestions = await prisma.simulacroresponse.count({
        where: {
          simulacroid: simulacroId,
          examtype: 'EXAMEN_2024',
          answeredat: null,
          skipped: false
        }
      });
      
      console.log('🎯 SIMULACRO2024 - Estado:', {
        remainingQuestions,
        isCompleted: remainingQuestions === 0
      });
      
      let nextQuestion: Simulacro2024Question | null = null;
      let isCompleted = false;
      
      if (remainingQuestions === 0) {
        // Completar simulacro
        console.log('🏁 SIMULACRO2024 - Completando simulacro');
        await this.completeSimulacro(simulacroId);
        isCompleted = true;
      } else {
        // Obtener siguiente pregunta
        console.log('➡️ SIMULACRO2024 - Obteniendo siguiente pregunta');
        nextQuestion = await this.getCurrentQuestion(simulacroId);
      }
      
      return {
        iscorrect,
        nextQuestion,
        isCompleted
      };
      
    } catch (error) {
      console.error('❌ SIMULACRO2024 - Error procesando respuesta:', error);
      throw error;
    }
  }
  
  /**
   * Actualizar estadísticas del simulacro 2024
   */
  static async updateSimulacroStats(simulacroId: string): Promise<void> {
    try {
      const responses = await prisma.simulacroresponse.findMany({
        where: {
          simulacroid: simulacroId,
          examtype: 'EXAMEN_2024',
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
      console.error('Error actualizando estadísticas del simulacro 2024:', error);
    }
  }
  
  /**
   * Completar simulacro 2024
   */
  static async completeSimulacro(simulacroId: string): Promise<Simulacro2024Result | null> {
    try {
      const simulacro = await prisma.simulacro.findUnique({
        where: { id: simulacroId }
      });
      
      if (!simulacro) return null;
      
      // Obtener las respuestas por separado
      const responses = await prisma.simulacroresponse.findMany({
        where: {
          simulacroid: simulacroId,
          examtype: 'EXAMEN_2024',
          answeredat: { not: null }
        }
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
        examType: completedSimulacro.examtype || 'EXAMEN_2024',
        startedAt: completedSimulacro.startedat,
        completedAt: completedSimulacro.completedat,
        timeElapsed: completedSimulacro.timeelapsed,
        currentQuestionIndex: completedSimulacro.currentquestionindex,
        finalScore: completedSimulacro.finalscore,
        finalPercentage: completedSimulacro.finalpercentage,
        passed: completedSimulacro.passed,
        totalquestions: completedSimulacro.totalquestions,
        timelimit: completedSimulacro.timelimit,
        averageResponseTime: completedSimulacro.averageresponsetime
      };
      
    } catch (error) {
      console.error('Error completando simulacro 2024:', error);
      return null;
    }
  }
  
  /**
   * Obtener historial de simulacros 2024 del usuario
   */
  static async getSimulacroHistory(telegramuserid: string, limit: number = 10): Promise<Simulacro2024Result[]> {
    try {
      const user = await prisma.telegramuser.findUnique({
        where: { telegramuserid }
      });
      
      if (!user) return [];
      
      const simulacros = await prisma.simulacro.findMany({
        where: {
          userid: user.id.toString(),
          examtype: 'EXAMEN_2024',
          status: { in: ['completed', 'abandoned'] }
        },
        orderBy: { startedat: 'desc' },
        take: limit
      });
      
      return simulacros.map(s => ({
        id: s.id,
        status: s.status,
        examType: s.examtype || 'EXAMEN_2024',
        startedAt: s.startedat,
        completedAt: s.completedat,
        timeElapsed: s.timeelapsed,
        currentQuestionIndex: s.currentquestionindex,
        finalScore: s.finalscore,
        finalPercentage: s.finalpercentage,
        passed: s.passed,
        totalquestions: s.totalquestions,
        timelimit: s.timelimit,
        averageResponseTime: s.averageresponsetime
      }));
      
    } catch (error) {
      console.error('Error obteniendo historial de simulacros 2024:', error);
      return [];
    }
  }
  
  /**
   * Procesar respuesta de simulacro 2024 usando questionid
   */
  static async processAnswerByQuestionId(
    telegramuserid: string, 
    questionid: string, 
    selectedOption: number,
    responsetime: number
  ): Promise<{ 
    iscorrect: boolean; 
    nextQuestion: Simulacro2024Question | null; 
    isCompleted: boolean;
    questionnumber: number;
    timeRemaining: string;
  } | null> {
    try {
      // Buscar usuario
      const user = await prisma.telegramuser.findUnique({
        where: { telegramuserid }
      });
      
      if (!user) {
        console.error('Usuario no encontrado');
        return null;
      }
      
      // Buscar simulacro activo del usuario
      const activeSimulacro = await this.getActiveSimulacro(telegramuserid);
      if (!activeSimulacro) {
        console.error('No hay simulacro 2024 activo');
        return null;
      }
      
      // Buscar la respuesta del simulacro correspondiente a esta pregunta
      const simulacroResponse = await prisma.simulacroresponse.findFirst({
        where: {
          simulacroid: activeSimulacro.id,
          questionid: questionid,
          examtype: 'EXAMEN_2024'
        }
      });
      
      if (!simulacroResponse) {
        console.error('Respuesta del simulacro no encontrada');
        return null;
      }
      
      // Buscar la pregunta para obtener la respuesta correcta
      const question = await prisma.examenoficial2024.findUnique({
        where: { id: questionid }
      });
      
      if (!question) {
        console.error('Pregunta del examen 2024 no encontrada');
        return null;
      }
      
      // Verificar si es correcta
      const iscorrect = selectedOption === question.correctanswerindex;
      
      // Actualizar la respuesta
      await prisma.simulacroresponse.update({
        where: { id: simulacroResponse.id },
        data: {
          selectedoption: selectedOption,
          iscorrect,
          responsetime,
          answeredat: new Date()
        }
      });
      
      // Calcular tiempo restante
      const timeElapsed = Math.floor((Date.now() - activeSimulacro.startedat.getTime()) / 1000);
      const timeRemaining = Math.max(0, 10800 - timeElapsed);
      const hoursRemaining = Math.floor(timeRemaining / 3600);
      const minutesRemaining = Math.floor((timeRemaining % 3600) / 60);
      const timeRemainingFormatted = `${hoursRemaining}h ${minutesRemaining}m`;
      
      // Buscar siguiente pregunta sin responder
      const nextResponse = await prisma.simulacroresponse.findFirst({
        where: {
          simulacroid: activeSimulacro.id,
          answeredat: null,
          examtype: 'EXAMEN_2024'
        },
        orderBy: { questionnumber: 'asc' }
      });
      
      let nextQuestion: Simulacro2024Question | null = null;
      let isCompleted = false;
      
      if (nextResponse) {
        // Hay más preguntas
        const nextQuestionData = await prisma.examenoficial2024.findUnique({
          where: { id: nextResponse.questionid }
        });
        
        if (nextQuestionData) {
          // Utilizar la función mejorada para parsear opciones
          const parsedOptions = cleanMalformedOptionsJSON(nextQuestionData.options);
          
          nextQuestion = {
            id: nextQuestionData.id,
            questionnumber: nextResponse.questionnumber,
            question: nextQuestionData.question,
            options: parsedOptions,
            correctanswerindex: nextQuestionData.correctanswerindex,
            category: nextQuestionData.category,
            difficulty: nextQuestionData.difficulty
          };
          
          // Actualizar índice de pregunta actual
          await prisma.simulacro.update({
            where: { id: activeSimulacro.id },
            data: { currentquestionindex: nextResponse.questionnumber }
          });
        }
      } else {
        // Simulacro completado
        isCompleted = true;
        await this.completeSimulacro(activeSimulacro.id);
      }
      
      return {
        iscorrect,
        nextQuestion,
        isCompleted,
        questionnumber: simulacroResponse.questionnumber,
        timeRemaining: timeRemainingFormatted
      };
      
    } catch (error) {
      console.error('Error procesando respuesta del simulacro 2024:', error);
      return null;
    }
  }
}

export default Simulacro2024Service;