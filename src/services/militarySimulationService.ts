import { prisma } from '@/lib/prisma';
import { sendTelegramPoll } from '@/app/api/telegram/webhook/route';

// ==========================================
// 🎖️ SERVICIO DE SIMULACROS MILITARES 
// ==========================================

export interface MilitarySimulationConfig {
  branch: 'et' | 'aire' | 'armada';
  totalquestions: 100;
  timelimit: 105; // minutos (1h 45min como examen oficial)
  distributions: Record<string, number>;
}

export interface SimulationQuestion {
  id: string;
  questionnumber: number;
  question: string;
  options: string[];
  correctanswerindex: number;
  subject: string;
  category?: string;
  difficulty?: string;
}

export class MilitarySimulationService {

  // ==========================================
  // 📋 DISTRIBUCIONES EXACTAS POR ARMA MILITAR
  // ==========================================
  
  public static MILITARY_DISTRIBUTIONS: Record<string, Record<string, number>> = {
    // 🎖️ EJÉRCITO DE TIERRA (100 preguntas)
    'et': {
      'constitucion': 7,
      'defensanacional': 1,
      'rjsp': 3,
      'minsdef': 2,
      'organizacionfas': 4,
      'emad': 4,
      'et': 9,
      'aire': 1,
      'armada': 1,
      'carrera': 8,
      'tropa': 2,
      'rroo': 7,
      'derechosydeberes': 3,
      'rio': 6,
      'iniciativasquejas': 1,
      'igualdad': 3,
      'omi': 2,
      'pac': 9,
      'seguridadnacional': 6,
      'pdc': 12,
      'onu': 2,
      'otan': 2,
      'osce': 2,
      'ue': 2,
      'misionesinternacionales': 1
    },
    
    // ✈️ EJÉRCITO DEL AIRE (100 preguntas)
    'aire': {
      'constitucion': 4,
      'defensanacional': 1,
      'rjsp': 2,
      'minsdef': 7,
      'organizacionfas': 2,
      'emad': 1,
      'et': 4,
      'aire': 9,
      'armada': 3,
      'carrera': 8,
      'tropa': 3,
      'rroo': 6,
      'derechosydeberes': 2,
      'rio': 2,
      'iniciativasquejas': 2,
      'igualdad': 2,
      'omi': 1,
      'pac': 8,
      'seguridadnacional': 2,
      'pdc': 6,
      'onu': 4,
      'otan': 7,
      'osce': 4,
      'ue': 4,
      'misionesinternacionales': 6
    },
    
    // ⚓ ARMADA (100 preguntas)
    'armada': {
      'constitucion': 7,
      'defensanacional': 5,
      'rjsp': 4,
      'minsdef': 3,
      'organizacionfas': 1,
      'emad': 2,
      'et': 2,
      'aire': 3,
      'armada': 6,
      'carrera': 10,
      'tropa': 3,
      'rroo': 5,
      'derechosydeberes': 3,
      'rio': 3,
      'iniciativasquejas': 2,
      'igualdad': 2,
      'omi': 3,
      'pac': 3,
      'seguridadnacional': 6,
      'pdc': 14,
      'onu': 2,
      'otan': 2,
      'osce': 1,
      'ue': 3,
      'misionesinternacionales': 6
    }
  };

  // ==========================================
  // 🗂️ MAPEO A TABLAS DE BASE DE DATOS
  // ==========================================
  
  public static TABLE_MAPPING: Record<string, string> = {
    'constitucion': 'constitucion',
    'defensanacional': 'defensanacional',
    'rjsp': 'rio', // RJSP usa tabla rio
    'rio': 'rio',
    'minsdef': 'minsdef',
    'organizacionfas': 'organizacionfas',
    'emad': 'emad',
    'et': 'et',
    'aire': 'aire',
    'armada': 'armada',
    'carrera': 'carrera',
    'tropa': 'tropa',
    'rroo': 'rroo',
    'derechosydeberes': 'derechosydeberes',
    'iniciativasquejas': 'iniciativasquejas',
    'igualdad': 'igualdad',
    'omi': 'omi',
    'pac': 'pac',
    'seguridadnacional': 'seguridadnacional',
    'pdc': 'pdc',
    'onu': 'onu',
    'otan': 'otan',
    'osce': 'osce',
    'ue': 'ue',
    'misionesinternacionales': 'misionesinternacionales'
  };

  // ==========================================
  // 📊 NOMBRES DISPLAY PARA UI
  // ==========================================
  
  private static BRANCH_NAMES = {
    'et': '🎖️ Ejército de Tierra',
    'aire': '✈️ Ejército del Aire',
    'armada': '⚓ Armada'
  };

  /**
   * Verificar si el usuario puede crear simulacros militares
   * Permitido para planes Básico (1/día) y Premium (ilimitado)
   * Usa el mismo patrón que /mi_plan (que SÍ funciona)
   */
  static async canUserCreatePremiumSimulation(userid: string): Promise<boolean> {
    try {
      console.log(`🔍 Verificando permisos de simulacros militares para usuario: ${userid}`);

      // Buscar usuario en la base de datos usando telegramuserid
      const user = await prisma.telegramuser.findUnique({
        where: { telegramuserid: userid }
      });

      if (!user) {
        console.log('❌ Usuario no encontrado en BD');
        return false;
      }

      console.log(`✅ Usuario encontrado: ${user.firstname || 'Sin nombre'}`);

      // Buscar suscripción activa usando SQL directo (como /mi_plan que funciona)
      const activeSubscriptionResult = await prisma.$queryRaw`
        SELECT 
          s.*,
          p.displayname as planDisplayName,
          p.name as planName
        FROM usersubscription s
        JOIN subscriptionplan p ON s.planid = p.id
        WHERE s.userid = ${user.id} 
          AND s.status = 'active' 
          AND s.enddate >= NOW()
        ORDER BY s.createdat DESC
        LIMIT 1
      ` as any[];

      const activeSubscription = activeSubscriptionResult[0];

      if (!activeSubscription) {
        console.log('❌ No hay suscripción activa');
        return false;
      }

      console.log(`🔍 Suscripción encontrada: ${activeSubscription.planDisplayName}`);

      // Verificar que es plan Básico o Premium
      const isAllowed = ['basic', 'premium'].includes(activeSubscription.planName);
      console.log(`🎯 ¿Plan permite simulacros? ${isAllowed ? '✅ SÍ' : '❌ NO'} (${activeSubscription.planName})`);

      return isAllowed;

    } catch (error) {
      console.error('❌ Error verificando acceso a simulacros militares:', error);
      return false;
    }
  }

  /**
   * Crear simulacro militar (disponible para planes Básico y Premium)
   */
  static async createMilitarySimulation(
    userid: string, 
    branch: 'et' | 'aire' | 'armada'
  ): Promise<{ simulationId: string; questionsSelected: number }> {
    try {
      console.log(`🎖️ Creando simulacro militar: ${this.BRANCH_NAMES[branch]} para usuario ${userid}`);

      // Verificar permisos de simulacros (Básico o Premium)
      const canCreate = await this.canUserCreatePremiumSimulation(userid);
      if (!canCreate) {
        throw new Error('Simulacros militares requieren plan de suscripción activa (Básico o Premium)');
      }

      // Verificar si el usuario ya tiene una simulación activa
      const activeSimulation = await prisma.simulacro.findFirst({
        where: {
          userid: userid,
          status: 'in_progress',
          examtype: `simulacro_premium_${branch}`
        }
      });

      if (activeSimulation) {
        throw new Error('Ya tienes una simulación militar activa');
      }

      // Obtener distribución para esta rama militar
      const distribution = this.MILITARY_DISTRIBUTIONS[branch];
      const questions = await this.selectQuestionsWithDistribution(distribution);

      if (questions.length < 90) { // Mínimo 90% de las preguntas requeridas
        throw new Error(`Insuficientes preguntas disponibles para ${this.BRANCH_NAMES[branch]} (${questions.length}/100)`);
      }

      // Asegurar exactamente 100 preguntas
      const finalQuestions = questions.slice(0, 100);

      // Generar ID único para la simulación
      const simulationId = this.generateUniqueId();

      // Crear nueva simulación
      const simulation = await prisma.simulacro.create({
        data: {
          id: simulationId,
          userid: userid,
          examtype: `simulacro_premium_${branch}`,
          totalquestions: 100,
          timelimit: 105 * 60, // 105 minutos en segundos
          status: 'in_progress',
          startedat: new Date(),
          createdat: new Date(),
          updatedat: new Date(),
          currentquestionindex: 0
        }
      });

      // Guardar las preguntas seleccionadas en simulacroresponse
      for (let i = 0; i < finalQuestions.length; i++) {
        const question = finalQuestions[i];
        await prisma.simulacroresponse.create({
          data: {
            id: this.generateUniqueId(),
            simulacroid: simulation.id,
            questionid: question.id,
            questionnumber: i + 1,
            questioncategory: question.subject,
            questiondifficulty: question.difficulty || 'medium',
            answeredat: null,
            selectedoption: null,
            iscorrect: null,
            responsetime: null,
            skipped: false,
            examtype: `simulacro_premium_${branch}`
          }
        });
      }
      
      return {
        simulationId: simulation.id,
        questionsSelected: finalQuestions.length
      };
    } catch (error) {
      console.error('Error creando simulación militar:', error);
      throw error;
    }
  }

  /**
   * Generar ID único
   */
  private static generateUniqueId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Seleccionar preguntas según distribución militar EN ORDEN ESTRICTO
   * Las preguntas se envían en el orden exacto de la distribución militar
   */
  private static async selectQuestionsWithDistribution(
    distribution: Record<string, number>
  ): Promise<SimulationQuestion[]> {
    const allQuestions: SimulationQuestion[] = [];
    
    console.log('🎖️ SELECCIÓN EN ORDEN MILITAR ESTRICTO:');
    
    // Procesar en el orden exacto definido en la distribución
    for (const [subject, count] of Object.entries(distribution)) {
      if (count === 0) continue;
      
      const tableName = this.TABLE_MAPPING[subject];
      if (!tableName) {
        console.warn(`⚠️ Tabla no encontrada para materia: ${subject}`);
        continue;
      }

      try {
        // Query para obtener preguntas aleatorias de esta materia
        const query = `
          SELECT id, questionnumber, question, options, correctanswerindex, category, difficulty
          FROM ${tableName} 
          WHERE isactive = true
          ORDER BY RAND()
          LIMIT ?
        `;

        const questions = await prisma.$queryRawUnsafe(query, count) as any[];
        
        console.log(`📚 ${subject}: ${questions.length}/${count} preguntas obtenidas (posiciones ${allQuestions.length + 1}-${allQuestions.length + questions.length})`);

        // Agregar preguntas en el orden estricto de la materia
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          const questionPosition = allQuestions.length + 1;
          
          allQuestions.push({
            id: q.id,
            questionnumber: questionPosition, // Posición en el simulacro
            question: q.question,
            options: q.options,
            correctanswerindex: q.correctanswerindex,
            subject,
            category: q.category,
            difficulty: q.difficulty
          });
        }

      } catch (error) {
        console.error(`Error obteniendo preguntas de ${subject}:`, error);
      }
    }

    console.log(`🎯 ORDEN FINAL: Total ${allQuestions.length} preguntas en orden militar estricto`);
    
    // ✅ RETORNAR EN ORDEN ESTRICTO (SIN MEZCLAR)
    return allQuestions;
  }

  /**
   * Obtener distribución real de preguntas seleccionadas
   */
  private static getActualDistribution(questions: SimulationQuestion[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    for (const question of questions) {
      distribution[question.subject] = (distribution[question.subject] || 0) + 1;
    }
    
    return distribution;
  }



  /**
   * Obtener información de un simulacro militar
   */
  static async getMilitarySimulationInfo(simulationId: string) {
    return await prisma.simulacro.findUnique({
      where: { id: simulationId }
    });
  }

  /**
   * Verificar si el usuario puede continuar un simulacro militar existente
   */
  static async getActiveSimulation(userid: string, branch?: string) {
    const whereClause: any = {
      userid: userid,
      status: 'in_progress'
    };

    if (branch) {
      whereClause.examtype = `simulacro_premium_${branch}`;
    }

    return await prisma.simulacro.findFirst({
      where: whereClause
    });
  }

  /**
   * Validar si las opciones de una pregunta cumplen con los límites de Telegram
   */
  private static validateOptionLengths(options: string[]): boolean {
    if (!Array.isArray(options)) return false;
    return options.every(option => option.length <= 100);
  }

  /**
   * Enviar la primera pregunta de un simulacro militar
   */
  static async sendFirstQuestion(simulationId: string, userid: string): Promise<boolean> {
    try {
      console.log('🚀 Iniciando envío primera pregunta militar:', { simulationId, userid });
      
      let maxAttempts = 10; // Máximo de intentos para encontrar una pregunta válida
      let attempts = 0;
      let validQuestionFound = false;
      let questionToSend: any = null;
      let questionDetails: any = null;
      
      while (attempts < maxAttempts && !validQuestionFound) {
        attempts++;
        
        // Obtener la primera pregunta sin responder y no saltada
        const candidateQuestion = await prisma.simulacroresponse.findFirst({
          where: {
            simulacroid: simulationId,
            answeredat: null,
            skipped: false
          },
          orderBy: {
            questionnumber: 'asc'
          }
        });

        if (!candidateQuestion) {
          console.log('❌ No se encontraron más preguntas disponibles');
          break;
        }

        console.log(`🔍 Intento ${attempts}: Evaluando pregunta #${candidateQuestion.questionnumber}`);
        
        if (!candidateQuestion.questioncategory) {
          console.log('⚠️ Pregunta sin categoría, marcando como saltada');
          await prisma.simulacroresponse.update({
            where: { id: candidateQuestion.id },
            data: { skipped: true }
          });
          continue;
        }
        
        // Obtener detalles de la pregunta
        const details = await this.getQuestionDetails(candidateQuestion.questionid, candidateQuestion.questioncategory);
        
        if (!details) {
          console.log('⚠️ Sin detalles de pregunta, marcando como saltada');
          await prisma.simulacroresponse.update({
            where: { id: candidateQuestion.id },
            data: { skipped: true }
          });
          continue;
        }

        // Validar longitud de opciones
        const parsedOptions = Array.isArray(details.options) ? details.options : [];
        const maxLength = Math.max(...parsedOptions.map(opt => opt.length));
        
        if (this.validateOptionLengths(parsedOptions)) {
          console.log(`✅ Pregunta #${candidateQuestion.questionnumber} válida (max ${maxLength} chars)`);
          validQuestionFound = true;
          questionToSend = candidateQuestion;
          questionDetails = details;
        } else {
          console.log(`⚠️ Pregunta #${candidateQuestion.questionnumber} tiene opciones muy largas (max ${maxLength} chars), saltando...`);
          // Marcar como saltada
          await prisma.simulacroresponse.update({
            where: { id: candidateQuestion.id },
            data: { skipped: true }
          });
        }
      }

      if (!validQuestionFound || !questionToSend || !questionDetails) {
        console.log('❌ No se encontró ninguna pregunta válida después de', attempts, 'intentos');
        return false;
      }

      // Enviar la pregunta válida como poll
      const parsedOptions = Array.isArray(questionDetails.options) ? [...questionDetails.options] : [];
      
      // 🎲 ALEATORIZAR OPCIONES con Fisher-Yates mejorado
      const correctIndex = questionDetails.correctanswerindex;
      
      // Crear array con índices
      const optionsWithIndex = parsedOptions.map((option, index) => ({
        option,
        originalIndex: index
      }));
      
      // Aplicar Fisher-Yates shuffle
      for (let i = optionsWithIndex.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [optionsWithIndex[i], optionsWithIndex[j]] = [optionsWithIndex[j], optionsWithIndex[i]];
      }
      
      // Extraer opciones mezcladas y encontrar nuevo índice correcto
      const shuffledOptions = optionsWithIndex.map(item => item.option);
      const newCorrectIndex = optionsWithIndex.findIndex(item => item.originalIndex === correctIndex);
      
      console.log('🎲 Enviando pregunta válida:', {
        questionNumber: questionToSend.questionnumber,
        originalCorrectIndex: correctIndex,
        newCorrectIndex,
        optionsLength: shuffledOptions.map(opt => opt.length),
        maxLength: Math.max(...shuffledOptions.map(opt => opt.length))
      });
      
      const pollSent = await sendTelegramPoll(
        userid,
        `🎖️ SIMULACRO PERMANENCIA ${questionToSend.questionnumber}/100 ⏱️105min\n\n${questionDetails.question}`,
        shuffledOptions,
        newCorrectIndex,
        `military-${simulationId}-${questionToSend.questionnumber}`,
        'military_simulation'
      );
      
      console.log('📤 Resultado envío primera pregunta militar:', pollSent);

      return pollSent;
    } catch (error) {
      console.error('❌ Error enviando primera pregunta militar:', error);
      return false;
    }
  }

  /**
   * Procesar respuesta de una pregunta del simulacro militar y enviar la siguiente
   */
  static async processAnswer(
    simulationId: string,
    questionNumber: number,
    selectedOption: number,
    responseTime: number,
    userid: string,
    pollId?: string
  ): Promise<{ isCorrect: boolean; nextQuestionSent: boolean; isCompleted: boolean }> {
    try {
      console.log('🎖️ MILITARY PROCESSANSWER - Iniciando con parámetros:', {
        simulationId,
        questionNumber,
        selectedOption,
        responseTime,
        userid
      });
      
      // Buscar la respuesta del simulacro
      const simulacroResponse = await prisma.simulacroresponse.findFirst({
        where: {
          simulacroid: simulationId,
          questionnumber: questionNumber
        }
      });
      
      if (!simulacroResponse) {
        console.error('❌ MILITARY PROCESSANSWER - Respuesta no encontrada para:', { simulationId, questionNumber });
        throw new Error('Respuesta del simulacro militar no encontrada');
      }
      
      console.log('✅ MILITARY PROCESSANSWER - Respuesta encontrada:', {
        responseId: simulacroResponse.id,
        questionNumber: simulacroResponse.questionnumber,
        alreadyAnswered: simulacroResponse.answeredat !== null
      });
      
      // Determinar si es correcta la respuesta
      let isCorrect = false;
      
      // Si tenemos pollId, usar el mapeo real del poll (índice correcto después del shuffle)
      if (pollId) {
        try {
          const pollRecord = await prisma.telegrampoll.findUnique({ where: { pollid: pollId } });
          if (pollRecord) {
            isCorrect = selectedOption === pollRecord.correctanswerindex;
            console.log('📊 MILITARY PROCESSANSWER - Evaluación usando pollId:', {
              pollId,
              selectedOption,
              correctOptionFromPoll: pollRecord.correctanswerindex,
              isCorrect
            });
          } else {
            console.warn('⚠️ MILITARY PROCESSANSWER - Poll no encontrado, usando fallback por detalles de pregunta');
          }
        } catch (e) {
          console.warn('⚠️ MILITARY PROCESSANSWER - Error leyendo poll, usando fallback:', e);
        }
      }

      // Fallback a evaluación por detalles de pregunta (sin shuffle)
      if (!isCorrect && pollId == null) {
        if (!simulacroResponse.questioncategory) {
          throw new Error('Categoría de pregunta militar no encontrada');
        }
        const questionDetails = await this.getQuestionDetails(simulacroResponse.questionid, simulacroResponse.questioncategory);
        if (!questionDetails) {
          throw new Error('Detalles de pregunta militar no encontrados');
        }
        isCorrect = selectedOption === questionDetails.correctanswerindex;
        console.log('📊 MILITARY PROCESSANSWER - Evaluación por fallback:', {
          selectedOption,
          correctOption: questionDetails.correctanswerindex,
          isCorrect
        });
      }
      
      // Log consolidado (sin asumir disponibilidad de questionDetails fuera del fallback)
      console.log('📊 MILITARY PROCESSANSWER - Evaluación (final):', {
        selectedOption,
        usedPollId: !!pollId,
        isCorrect
      });
      
      // Actualizar la respuesta
      await prisma.simulacroresponse.update({
        where: { id: simulacroResponse.id },
        data: {
          selectedoption: selectedOption,
          iscorrect: isCorrect,
          responsetime: responseTime,
          answeredat: new Date()
        }
      });
      
      console.log('✅ MILITARY PROCESSANSWER - Respuesta actualizada');
      
      // Verificar cuántas preguntas se han respondido
      const responsesAnswered = await prisma.simulacroresponse.count({
        where: {
          simulacroid: simulationId,
          answeredat: { not: null }
        }
      });
      
      console.log('📈 MILITARY PROCESSANSWER - Estado:', {
        responsesAnswered,
        totalQuestions: 100,
        isCompleted: responsesAnswered >= 100
      });
      
      const isCompleted = responsesAnswered >= 100;
      let nextQuestionSent = false;
      
      if (!isCompleted) {
        // Buscar y enviar la siguiente pregunta válida
        const minutesRemaining = await this.getRemainingMinutes(simulationId);
        nextQuestionSent = await this.findAndSendNextValidQuestion(simulationId, userid, minutesRemaining);
        console.log('📤 MILITARY PROCESSANSWER - Resultado envío siguiente pregunta:', nextQuestionSent);
      } else {
        // Marcar simulacro como completado
        await prisma.simulacro.update({
          where: { id: simulationId },
          data: {
            status: 'completed',
            completedat: new Date()
          }
        });
        
        console.log('🏆 MILITARY PROCESSANSWER - Simulacro completado');
      }
      
      return {
        isCorrect,
        nextQuestionSent,
        isCompleted
      };
      
    } catch (error) {
      console.error('❌ MILITARY PROCESSANSWER - Error:', error);
      throw error;
    }
  }

  /**
   * Obtener minutos restantes del simulacro
   */
  private static async getRemainingMinutes(simulationId: string): Promise<number> {
    try {
      const simulation = await prisma.simulacro.findUnique({
        where: { id: simulationId }
      });
      
      if (!simulation) return 0;
      
      const timeElapsed = Math.floor((Date.now() - simulation.startedat.getTime()) / 1000);
      const timeRemaining = Math.max(0, (105 * 60) - timeElapsed);
      return Math.floor(timeRemaining / 60);
    } catch (error) {
      console.error('Error obteniendo tiempo restante:', error);
      return 0;
    }
  }

  /**
   * Buscar y enviar la siguiente pregunta válida
   */
  private static async findAndSendNextValidQuestion(
    simulationId: string,
    userid: string,
    minutesRemaining: number
  ): Promise<boolean> {
    try {
      let maxAttempts = 10;
      let attempts = 0;
      
      while (attempts < maxAttempts) {
        attempts++;
        
        // Buscar siguiente pregunta sin responder y no saltada
        const nextResponse = await prisma.simulacroresponse.findFirst({
          where: {
            simulacroid: simulationId,
            answeredat: null,
            skipped: false
          },
          orderBy: { questionnumber: 'asc' }
        });
        
        if (!nextResponse) {
          console.log('❌ No hay más preguntas disponibles');
          return false;
        }
        
        console.log(`🔍 Intento ${attempts}: Evaluando pregunta #${nextResponse.questionnumber}`);
        
        // Validar categoría
        if (!nextResponse.questioncategory) {
          console.log('⚠️ Pregunta sin categoría, marcando como saltada');
          await prisma.simulacroresponse.update({
            where: { id: nextResponse.id },
            data: { skipped: true }
          });
          continue;
        }
        
        // Obtener detalles
        const questionDetails = await this.getQuestionDetails(nextResponse.questionid, nextResponse.questioncategory);
        
        if (!questionDetails) {
          console.log('⚠️ Sin detalles de pregunta, marcando como saltada');
          await prisma.simulacroresponse.update({
            where: { id: nextResponse.id },
            data: { skipped: true }
          });
          continue;
        }
        
        // Validar longitud de opciones
        const parsedOptions = Array.isArray(questionDetails.options) ? questionDetails.options : [];
        const maxLength = Math.max(...parsedOptions.map(opt => opt.length));
        
        if (this.validateOptionLengths(parsedOptions)) {
          console.log(`✅ Pregunta #${nextResponse.questionnumber} válida (max ${maxLength} chars)`);
          
          // Enviar pregunta válida
          const success = await this.sendQuestionPoll(
            userid,
            nextResponse.questionnumber,
            questionDetails,
            simulationId,
            minutesRemaining
          );
          
          if (success) {
            return true;
          }
        } else {
          console.log(`⚠️ Pregunta #${nextResponse.questionnumber} tiene opciones muy largas (max ${maxLength} chars), saltando...`);
          // Marcar como saltada
          await prisma.simulacroresponse.update({
            where: { id: nextResponse.id },
            data: { skipped: true }
          });
        }
      }
      
      console.log('❌ No se encontró ninguna pregunta válida después de', attempts, 'intentos');
      return false;
    } catch (error) {
      console.error('Error buscando siguiente pregunta válida:', error);
      return false;
    }
  }

  /**
   * Enviar una pregunta específica como poll (solo para preguntas validadas)
   */
  private static async sendQuestionPoll(
    userid: string,
    questionNumber: number,
    questionDetails: any,
    simulationId: string,
    minutesRemaining: number
  ): Promise<boolean> {
    try {
      const parsedOptions = Array.isArray(questionDetails.options) ? [...questionDetails.options] : [];
      
      // Validación adicional de seguridad
      if (!this.validateOptionLengths(parsedOptions)) {
        console.error('❌ Intento de enviar pregunta con opciones inválidas');
        return false;
      }
      
      // 🎲 ALEATORIZAR OPCIONES con Fisher-Yates
      const correctIndex = questionDetails.correctanswerindex;
      
      const optionsWithIndex = parsedOptions.map((option, index) => ({
        option,
        originalIndex: index
      }));
      
      // Aplicar Fisher-Yates shuffle
      for (let i = optionsWithIndex.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [optionsWithIndex[i], optionsWithIndex[j]] = [optionsWithIndex[j], optionsWithIndex[i]];
      }
      
      const shuffledOptions = optionsWithIndex.map(item => item.option);
      const newCorrectIndex = optionsWithIndex.findIndex(item => item.originalIndex === correctIndex);
      
      console.log('🎲 Enviando pregunta validada:', {
        questionNumber,
        originalCorrectIndex: correctIndex,
        newCorrectIndex,
        optionsLength: shuffledOptions.map(opt => opt.length),
        maxLength: Math.max(...shuffledOptions.map(opt => opt.length))
      });
      
      const pollSent = await sendTelegramPoll(
        userid,
        `🎖️ SIMULACRO PERMANENCIA ${questionNumber}/100 ⏱️${minutesRemaining}min\n\n${questionDetails.question}`,
        shuffledOptions,
        newCorrectIndex,
        `military-${simulationId}-${questionNumber}`,
        'military_simulation'
      );
      
      return pollSent;
    } catch (error) {
      console.error('❌ Error enviando pregunta militar:', error);
      return false;
    }
  }

  /**
   * Abandonar simulacro militar activo
   */
  static async abandonMilitarySimulation(userid: string): Promise<{ success: boolean; simulationInfo?: any; message?: string }> {
    try {
      console.log('🚪 Abandonando simulacro militar para usuario:', userid);
      
      // Buscar simulacro militar activo
      const activeSimulation = await prisma.simulacro.findFirst({
        where: {
          userid: userid,
          status: 'in_progress',
          examtype: {
            in: ['simulacro_premium_et', 'simulacro_premium_aire', 'simulacro_premium_armada']
          }
        }
      });

      if (!activeSimulation) {
        return {
          success: false,
          message: 'No hay simulacro militar activo para abandonar'
        };
      }

      // Marcar como abandonado
      await prisma.simulacro.update({
        where: { id: activeSimulation.id },
        data: {
          status: 'abandoned',
          completedat: new Date()
        }
      });

      console.log('✅ Simulacro militar abandonado exitosamente:', activeSimulation.id);
      
      return {
        success: true,
        simulationInfo: activeSimulation
      };
      
    } catch (error) {
      console.error('❌ Error abandonando simulacro militar:', error);
      return {
        success: false,
        message: 'Error interno al abandonar simulacro'
      };
    }
  }

  /**
   * Obtener detalles de una pregunta desde la tabla correspondiente
   */
  /**
   * Parsear formato especial de opciones que usa % en lugar de :
   * Ejemplo: '{"%%100%El Rey","%-33.33333%El Presidente del Gobierno"}'
   */
  private static parseSpecialOptionsFormat(optionsString: string): string[] {
    try {
      console.log('🔧 Parseando formato especial:', optionsString);
      
      // Remover llaves externas
      let cleaned = optionsString.replace(/^{|}$/g, '');
      
      // Dividir por comas que están fuera de comillas
      const options: string[] = [];
      let current = '';
      let inQuotes = false;
      let escapeNext = false;
      
      for (let i = 0; i < cleaned.length; i++) {
        const char = cleaned[i];
        
        if (escapeNext) {
          current += char;
          escapeNext = false;
          continue;
        }
        
        if (char === '\\') {
          escapeNext = true;
          current += char;
          continue;
        }
        
        if (char === '"') {
          inQuotes = !inQuotes;
          current += char;
          continue;
        }
        
        if (char === ',' && !inQuotes) {
          if (current.trim()) {
            options.push(current.trim());
          }
          current = '';
          continue;
        }
        
        current += char;
      }
      
      if (current.trim()) {
        options.push(current.trim());
      }
      
      // Procesar cada opción para extraer solo el texto
      const processedOptions = options.map(option => {
        // Remover comillas externas
        let cleaned = option.replace(/^"|"$/g, '');
        
        // Remover porcentajes al inicio (ej: "%-33.33333%texto" -> "texto")
        cleaned = cleaned.replace(/^[%\-\d\.]*%/, '');
        
        // Limpiar caracteres de escape dobles (ej: \"texto\" -> "texto")
        cleaned = cleaned.replace(/\\"/g, '"');
        
        // Limpiar espacios extra
        cleaned = cleaned.trim();
        
        return cleaned;
      });
      
      console.log('🎯 Opciones procesadas:', processedOptions);
      return processedOptions;
      
    } catch (error) {
      console.error('❌ Error en parseSpecialOptionsFormat:', error);
      throw error;
    }
  }

  private static async getQuestionDetails(questionId: string, subject: string): Promise<any> {
    try {
      console.log('🔍 getQuestionDetails - Parámetros:', { questionId, subject });
      
      const tableName = this.TABLE_MAPPING[subject];
      console.log('📊 Tabla mapeada:', { subject, tableName });
      
      if (!tableName) {
        console.error('❌ Tabla no encontrada para materia:', subject);
        return null;
      }

      const query = `
        SELECT id, question, options, correctanswerindex
        FROM ${tableName}
        WHERE id = ?
        LIMIT 1
      `;

      console.log('🔍 Ejecutando query:', { query, questionId });
      const result = await prisma.$queryRawUnsafe(query, questionId) as any[];
      console.log('📋 Resultado query:', result);
      
      if (result.length === 0) {
        return null;
      }

      const question = result[0];
      
      // Parsear opciones si es string
      let parsedOptions = question.options;
      if (typeof question.options === 'string') {
        try {
          // Intentar parsear formato especial primero (más común en simulacros militares)
          parsedOptions = this.parseSpecialOptionsFormat(question.options);
          console.log('✅ Opciones parseadas con formato especial:', parsedOptions);
        } catch (e) {
          console.log('🔄 Formato especial falló, intentando JSON estándar...');
          // Si falla el formato especial, intentar JSON normal
          try {
            parsedOptions = JSON.parse(question.options);
            console.log('✅ Opciones parseadas como JSON estándar:', parsedOptions);
          } catch (e2) {
            console.error('❌ Error parseando opciones en ambos formatos:', { especial: e.message, json: e2.message });
            parsedOptions = [];
          }
        }
      }

      return {
        ...question,
        options: parsedOptions
      };
    } catch (error) {
      console.error('❌ Error obteniendo detalles de pregunta:', error);
      return null;
    }
  }
}