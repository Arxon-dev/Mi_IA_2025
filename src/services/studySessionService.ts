import { TelegramService } from './telegramService';
import { GamificationService, UserResponse } from './gamificationService';
import { prisma } from '@/lib/prisma';

// Declarar tipos globales para notificaciones
declare global {
  var graduationNotifications: Array<{
    userid: string;
    subject: string;
    questionId: string;
    timestamp: Date;
  }> | undefined;
}

// Instancia del servicio de Telegram (requerirá token del entorno)
const telegramService = new TelegramService(process.env.TELEGRAM_BOT_TOKEN || '');

// Importar scheduler de forma lazy para evitar dependencias circulares
let studyTimeoutScheduler: any = null;
const getScheduler = async () => {
  if (!studyTimeoutScheduler) {
    const { studyTimeoutScheduler: scheduler } = await import('./studyTimeoutScheduler');
    studyTimeoutScheduler = scheduler;
  }
  return studyTimeoutScheduler;
};

// Imports adicionales necesarios
import { v4 as uuidv4 } from 'uuid';

// Funciones auxiliares
const generateUniqueId = () => uuidv4();

const withRetry = async <T>(fn: () => Promise<T>, maxRetries: number = 3): Promise<T> => {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }
  throw lastError;
};

// Clase SubscriptionService básica (si no existe)
class SubscriptionService {
  async checkQuestionQuota(userid: string, quantity: number): Promise<{ allowed: boolean; message: string }> {
    // Implementación básica - ajusta según tu lógica de suscripción
    return { allowed: true, message: 'OK' };
  }
}

// ==============================================
// 🎯 SERVICIO DE SESIONES DE ESTUDIO PRIVADAS
// ==============================================

// Mapeo de comandos de estudio a tablas de base de datos (CORREGIDO)
export const STUDY_COMMANDS = {
  '/constitucion': 'Constitucion',
  '/defensanacional': 'DefensaNacional',
  '/rjsp': 'Rio',
  '/rio': 'Rio',
  '/minsdef': 'Minsdef',
  '/organizacionfas': 'OrganizacionFas',
  '/emad': 'Emad',
  '/et': 'Et',
  '/armada': 'Armada',
  '/aire': 'Aire',
  '/carrera': 'Carrera',
  '/tropa': 'TropaMarineria',
  '/rroo': 'Rroo',
  '/derechosydeberes': 'DerechosYDeberes',
  '/regimendisciplinario': 'RegimenDisciplinario',
  '/iniciativasyquejas': 'IniciativasQuejas',
  '/igualdad': 'Igualdad',
  '/omi': 'Omi',
  '/pac': 'Pac',
  '/seguridadnacional': 'SeguridadNacional',
  '/pdc': 'Pdc',
  '/onu': 'Onu',
  '/otan': 'Otan',
  '/osce': 'Osce',
  '/ue': 'Ue',
  // '/proteccioncivil': 'ProteccionCivil', // ELIMINADO
  '/misionesinternacionales': 'MisionesInternacionales'
} as const;

interface StudyQuestion {
  id: string;
  questionnumber: number;
  question: string;
  options: string[];
  correctanswerindex: number;
  category?: string;
  difficulty?: string;
  originalSubject?: string; // Para preguntas de falladas, mantener el subject original
}

export class StudySessionService {
  private subscriptionService: SubscriptionService;
  private gamificationService: GamificationService;

  constructor() {
    this.subscriptionService = new SubscriptionService();
    this.gamificationService = new GamificationService();
  }

  // ==========================================
  // 📋 MAPEO DE COMANDOS A NOMBRES DE TABLAS
  // ==========================================
  
  private static TABLE_MAPPING: Record<string, string> = {
    // ✅ Tablas con preguntas confirmadas
    'constitucion': 'constitucion',        // 280 preguntas
    'defensanacional': 'defensanacional',  // 121 preguntas
    'aire': 'aire',                        // 602 preguntas
    
    // 🔧 FIX: Mapeos que faltaban y causaban errores
    'rjsp': 'rio',                         // ⚖️ RJSP → Rio
    'rio': 'rio',                          // 🌊 Rio → Rio 
    'tropa': 'tropa',                     // 👥 Tropa y Marinería
    'rroo': 'rroo',                       // 📋 RR.OO.
    'seguridadnacional': 'seguridadnacional', // 🔒 Seguridad Nacional
    'ue': 'ue',                           // 🇪🇺 UE
    // 'proteccioncivil': 'proteccioncivil',  // 🚨 Protección Civil - ELIMINADO
    
    // 🔄 Tablas que existen pero pueden estar vacías
    'armada': 'armada',
    'carrera': 'carrera', 
    'derechosydeberes': 'derechosydeberes',
    'regimendisciplinario': 'regimendisciplinario',
    'igualdad': 'igualdad',
    
    // 📋 Otras tablas disponibles
    'minsdef': 'minsdef',
    'organizacionfas': 'organizacionfas',
    'emad': 'emad',
    'et': 'et',
    'iniciativasyquejas': 'iniciativasquejas',
    'omi': 'omi',
    'pac': 'pac',
    'pdc': 'pdc',
    'onu': 'onu',
    'otan': 'otan',
    'osce': 'osce',
    'misionesinternacionales': 'misionesinternacionales',
    
    // 🎲 Mapeo especial para sesiones aleatorias
    'aleatorias': 'constitucion'  // Para sesiones aleatorias, usar cualquier tabla como referencia
  };

  private static TABLE_DISPLAY_NAMES: Record<string, string> = {
    'constitucion': '📜 Constitución',
    'defensanacional': '🛡️ Defensa Nacional',
    'rjsp': '⚖️ RJSP',
    'rio': '🌊 RIO',
    'minsdef': '🏛️ MINSDEF',
    'organizacionfas': '🎖️ Organización FAS',
    'emad': '⭐ EMAD',
    'et': '🪖 Ejército de Tierra',
    'armada': '⚓ Armada',
    'aire': '✈️ Ejército del Aire',
    'carrera': '📈 Carrera Militar',
    'tropa': '👥 Tropa y Marinería',
    'rroo': '📋 RR.OO.',
    'derechosydeberes': '⚖️ Derechos y Deberes',
    'regimendisciplinario': '🚫 Régimen Disciplinario',
    'iniciativasyquejas': '📝 Iniciativas y Quejas',
    'igualdad': '🏳️‍🌈 Igualdad',
    'omi': '🌍 OMI',
    'pac': '🕊️ PAC',
    'seguridadnacional': '🔒 Seguridad Nacional',
    'pdc': '📊 PDC',
    'onu': '🌐 ONU',
    'otan': '🛡️ OTAN',
    'osce': '🤝 OSCE',
    'ue': '🇪🇺 UE',
    'misionesinternacionales': '🌍 Misiones Internacionales'
  };

  // ==========================================
  // 🎯 PARSEAR COMANDO DE ESTUDIO
  // ==========================================
  
  static parseStudyCommand(command: string): { subject: string; quantity: number; type?: 'normal' | 'failed' | 'random' } | null {
    // 🔍 COMANDOS DE PREGUNTAS ALEATORIAS
    // Formato: /aleatorias10, /aleatorias50, etc.
    const randomMatch = command.match(/^\/aleatorias(\d+)$/);
    
    if (randomMatch) {
      const [, quantityStr] = randomMatch;
      const quantity = parseInt(quantityStr, 10);
      
      // Validar cantidad (1-50)
      if (quantity < 1 || quantity > 50) return null;
      
      return { subject: 'random', quantity, type: 'random' };
    }
    
    // 🔍 COMANDOS DE PREGUNTAS FALLADAS
    // Formato: /falladas15, /constitucionfalladas5, etc.
    const failedMatch = command.match(/^\/(?:([a-zA-Z]+)falladas|falladas)(\d*)$/);
    
    if (failedMatch) {
      const [, subjectRaw, quantityStr] = failedMatch;
      const quantity = quantityStr ? parseInt(quantityStr, 10) : 5; // Default 5 preguntas
      
      // Validar cantidad (1-50)
      if (quantity < 1 || quantity > 50) return null;
      
      if (subjectRaw) {
        // Comando específico de materia (/constitucionfalladas5)
        const commandKey = `/${subjectRaw.toLowerCase()}`;
        if (!STUDY_COMMANDS[commandKey as keyof typeof STUDY_COMMANDS]) return null;
        return { subject: subjectRaw.toLowerCase(), quantity, type: 'failed' };
      } else {
        // Comando general (/falladas15)
        return { subject: 'all', quantity, type: 'failed' };
      }
    }
    
    // 🔍 COMANDOS NORMALES EXISTENTES
    // Formato: /constitucion10, /defensanacional5, etc.
    const normalMatch = command.match(/^\/([a-zA-Z]+)(\d+)$/);
    
    if (!normalMatch) return null;
    
    const [, subjectRaw, quantityStr] = normalMatch;
    const commandKey = `/${subjectRaw.toLowerCase()}`;
    const quantity = parseInt(quantityStr, 10);
    
    // Validar que la materia existe en STUDY_COMMANDS
    if (!STUDY_COMMANDS[commandKey as keyof typeof STUDY_COMMANDS]) return null;
    
    // Validar cantidad (1-50)
    if (quantity < 1 || quantity > 50) return null;
    
    return { subject: subjectRaw.toLowerCase(), quantity, type: 'normal' };
  }

  // ==========================================
  // 🎓 SISTEMA DE PREGUNTAS FALLADAS
  // ==========================================
  
  /**
   * Verificar si el usuario ha estudiado alguna vez
   */
  private async hasUserEverStudied(userid: string, subject?: string): Promise<boolean> {
    try {
      const subjectFilter = subject && subject !== 'all' ? `AND subject = '${subject}'` : '';
      
      const query = `
        SELECT COUNT(*) as count 
        FROM studyresponse 
        WHERE userid = ? 
          AND answeredat IS NOT NULL
          ${subjectFilter}
        LIMIT 1
      `;
      
      const result = await prisma.$queryRawUnsafe(query, userid) as any[];
      const count = parseInt(result[0]?.count || '0');
      
      console.log(`🔍 [hasUserEverStudied] Usuario ${userid}, materia: ${subject || 'todas'}, respuestas: ${count}`);
      return count > 0;
      
    } catch (error) {
      console.error('❌ Error verificando si el usuario ha estudiado:', error);
      return false; // En caso de error, asumir que no ha estudiado
    }
  }

  /**
   * Obtener preguntas falladas del usuario (que aún no han "graduado")
   */
  private async getFailedQuestions(userid: string, subject?: string, limit: number = 10): Promise<StudyQuestion[]> {
    try {
      console.log(`🔍 [FailedQuestions] Buscando preguntas falladas para usuario ${userid}, materia: ${subject || 'todas'}, límite: ${limit}`);
      
      // Construir filtro por materia
      const subjectFilter = subject && subject !== 'all' ? `AND sr.subject = '${subject}'` : '';
      
      // Query para obtener preguntas falladas que no han "graduado" (menos de 3 aciertos totales desde el último fallo)
      const query = `
        WITH failed_questions AS (
          -- Obtener todas las preguntas que el usuario ha fallado alguna vez
          SELECT DISTINCT 
            sr.questionId,
            sr.subject,
            MAX(sr.answeredat) as last_failed_at  -- 🔧 FIX: Último fallo, no el primero
          FROM studyresponse sr 
          WHERE sr.userid = ? 
            AND sr.isCorrect = false 
            AND sr.answeredat IS NOT NULL
            ${subjectFilter}
          GROUP BY sr.questionId, sr.subject
        ),
        total_successes AS (
          -- 🔧 FIX: Contar aciertos TOTALES desde el último fallo (no necesariamente consecutivos)
          SELECT 
            fq.questionId,
            fq.subject,
            fq.last_failed_at,
            COUNT(sr2.id) as total_successes_since_last_fail
          FROM failed_questions fq
          LEFT JOIN studyresponse sr2 ON sr2.questionId = fq.questionId 
            AND sr2.userid = ? 
            AND sr2.isCorrect = true 
            AND sr2.answeredat > fq.last_failed_at
            AND sr2.subject = fq.subject  -- 🔧 FIX CRÍTICO: Solo aciertos de la misma materia
          GROUP BY fq.questionId, fq.subject, fq.last_failed_at
        )
        SELECT 
          ts.questionId,
          ts.subject,
          ts.total_successes_since_last_fail,
          ts.last_failed_at
        FROM total_successes ts
        WHERE ts.total_successes_since_last_fail < 1  -- Solo preguntas que NO han graduado
        ORDER BY ts.last_failed_at ASC  -- Las más antiguas primero
        LIMIT ?
      `;
      
      const failedQuestionIds = await prisma.$queryRawUnsafe(query, userid, userid, limit) as any[];
      
      console.log(`📊 [FailedQuestions] Encontradas ${failedQuestionIds.length} preguntas falladas sin graduar`);
      
      if (failedQuestionIds.length === 0) {
        return [];
      }
      
      // Obtener los detalles completos de las preguntas de todas las materias
      const questions: StudyQuestion[] = [];
      
      for (const row of failedQuestionIds) {
        const questionDetails = await this.getQuestionById(row.subject, row.questionId);
        if (questionDetails) {
          questions.push(questionDetails);
          console.log(`✅ [FailedQuestions] Añadida pregunta ${row.questionId} de ${row.subject} (${row.total_successes_since_last_fail}/1 aciertos totales)`);
        }
      }
      
      console.log(`🎯 [FailedQuestions] Total preguntas falladas obtenidas: ${questions.length}`);
      return questions;
      
    } catch (error) {
      console.error('❌ Error obteniendo preguntas falladas:', error);
      return [];
    }
  }

  /**
   * Método público para obtener el conteo de preguntas falladas por materia
   */
  async getFailedQuestionsCount(userid: string, subject: string): Promise<number> {
    try {
      const result = await this.getFailedQuestions(userid, subject, 1000); // Usar límite alto para contar todas
      return result.length;
    } catch (error) {
      console.error(`❌ Error contando preguntas falladas para ${subject}:`, error);
      return 0;
    }
  }

  /**
   * Método estático para obtener el mapeo de comandos a materias
   */
  static getSubjectMappings(): Record<string, string> {
    return STUDY_COMMANDS;
  }

  /**
   * 🎲 DISTRIBUCIÓN EQUITATIVA DE PREGUNTAS ALEATORIAS
   * Calcula cuántas preguntas tomar de cada materia para una distribución equitativa
   */
  private static calculateRandomDistribution(totalQuestions: number): Record<string, number> {
    // Obtener todas las materias disponibles (27 materias)
    const subjects = Object.keys(STUDY_COMMANDS).map(cmd => cmd.replace('/', ''));
    const totalSubjects = subjects.length;
    
    console.log(`🎲 Calculando distribución para ${totalQuestions} preguntas entre ${totalSubjects} materias`);
    
    // Distribución base: dividir equitativamente
    const baseQuestionsPerSubject = Math.floor(totalQuestions / totalSubjects);
    const remainingQuestions = totalQuestions % totalSubjects;
    
    const distribution: Record<string, number> = {};
    
    // Asignar preguntas base a todas las materias
    subjects.forEach(subject => {
      distribution[subject] = baseQuestionsPerSubject;
    });
    
    // Distribuir las preguntas restantes aleatoriamente
    if (remainingQuestions > 0) {
      const shuffledSubjects = [...subjects].sort(() => Math.random() - 0.5);
      for (let i = 0; i < remainingQuestions; i++) {
        distribution[shuffledSubjects[i]]++;
      }
    }
    
    // Log de la distribución para debug
    console.log('📊 Distribución calculada:');
    Object.entries(distribution)
      .filter(([, count]) => count > 0)
      .forEach(([subject, count]) => {
        console.log(`  ${StudySessionService.getDisplayName(subject)}: ${count} preguntas`);
      });
    
    return distribution;
  }

  /**
   * 🎯 OBTENER PREGUNTAS ALEATORIAS DE MÚLTIPLES MATERIAS
   * Selecciona preguntas de manera equitativa entre todas las materias
   */
  private async getRandomQuestionsFromAllSubjects(totalQuestions: number): Promise<StudyQuestion[]> {
    try {
      console.log(`🎲 Iniciando selección de ${totalQuestions} preguntas aleatorias`);
      
      const distribution = StudySessionService.calculateRandomDistribution(totalQuestions);
      const allQuestions: StudyQuestion[] = [];
      
      // Obtener preguntas de cada materia según la distribución
      for (const [subject, count] of Object.entries(distribution)) {
        if (count === 0) continue;
        
        const tableName = StudySessionService.TABLE_MAPPING[subject];
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
          
          console.log(`📚 ${StudySessionService.getDisplayName(subject)}: ${questions.length}/${count} preguntas obtenidas`);
          
          // Convertir y agregar preguntas con información de materia original
          questions.forEach(q => {
            allQuestions.push({
              id: q.id,
              questionnumber: q.questionnumber,
              question: q.question,
              options: q.options,
              correctanswerindex: q.correctanswerindex,
              category: q.category,
              difficulty: q.difficulty,
              originalSubject: subject // Mantener referencia a la materia original
            });
          });
          
        } catch (error) {
          console.error(`❌ Error obteniendo preguntas de ${subject}:`, error);
        }
      }
      
      // Mezclar todas las preguntas para orden aleatorio
      const shuffledQuestions = allQuestions.sort(() => Math.random() - 0.5);
      
      console.log(`✅ Total de preguntas aleatorias obtenidas: ${shuffledQuestions.length}/${totalQuestions}`);
      
      return shuffledQuestions;
      
    } catch (error) {
      console.error('❌ Error obteniendo preguntas aleatorias:', error);
      return [];
    }
  }

  /**
   * 🎓 Verificar si una pregunta se acaba de graduar (1+ aciertos desde último fallo)
   */
  private async checkIfQuestionJustGraduated(tx: any, userid: string, subject: string, questionId: string): Promise<boolean> {
    try {
      // Contar aciertos totales desde el último fallo
      const result = await tx.$queryRaw`
        SELECT 
          COALESCE(
            (SELECT COUNT(*) 
             FROM studyresponse sr2 
             WHERE sr2.userid = ${userid}
               AND sr2.questionId = ${questionId}
               AND sr2.subject = ${subject}
               AND sr2.isCorrect = true 
               AND sr2.answeredat > COALESCE(
                 (SELECT MAX(sr3.answeredat) 
                  FROM studyresponse sr3 
                  WHERE sr3.userid = ${userid}
                    AND sr3.questionId = ${questionId}
                    AND sr3.subject = ${subject}
                    AND sr3.isCorrect = false), 
                 '1970-01-01')
            ), 0) as total_successes_since_last_fail
      `;

      const successCount = Number((result as any[])[0]?.total_successes_since_last_fail || 0);
      
      // La pregunta se gradúa exactamente cuando alcanza 1 acierto desde el último fallo
      const isGraduated = successCount === 1;
      
      if (isGraduated) {
        console.log(`🎓 checkIfQuestionJustGraduated: Pregunta ${questionId} graduada con ${successCount} acierto(s)`);
      }
      
      return isGraduated;
    } catch (error) {
      console.error('❌ Error verificando graduación de pregunta:', error);
      return false;
    }
  }
  
  /**
   * Iniciar sesión de estudio con preguntas falladas
   */
  async startFailedStudySession(userid: string, subject: string, totalquestions: number): Promise<{ success: boolean; message: string; sessionId?: string }> {
    try {
      console.log(`🎓 [FailedSession] Iniciando sesión de preguntas falladas - Usuario: ${userid}, Materia: ${subject}, Cantidad: ${totalquestions}`);
      
      // Obtener preguntas falladas
      const failedQuestions = await this.getFailedQuestions(userid, subject, totalquestions);
      
      if (failedQuestions.length === 0) {
        // 🔍 Verificar si el usuario ha estudiado alguna vez
        const hasEverStudied = await this.hasUserEverStudied(userid, subject);
        
        if (!hasEverStudied) {
          return { 
            success: false, 
            message: `📚 Aún no has estudiado ${subject.toUpperCase()}.\n\n💡 Inicia una sesión normal primero con /${subject}1` 
          };
        }
        
        return { 
          success: false, 
          message: `🎉 ¡Excelente! No tienes preguntas falladas en ${subject.toUpperCase()}.\n\n💪 Todas las preguntas están dominadas.` 
        };
      }
      
      // Verificar permisos de suscripción
      const subscriptionCheck = await this.subscriptionService.checkQuestionQuota(userid, totalquestions);
      if (!subscriptionCheck.allowed) {
        return { success: false, message: subscriptionCheck.message };
      }
      
      // Limpiar sesiones anteriores
      await this.cleanupUserSessions(userid);
      
      // Crear nueva sesión con la cantidad solicitada (no limitar por preguntas disponibles)
      const session = await withRetry(async () => {
        return await prisma.userstudysession.create({
                    data: {
            id: generateUniqueId(),
            userid,
            subject,
            totalquestions: totalquestions, // Usar la cantidad solicitada, no limitar
            currentindex: 0,
            status: 'active',
            startedat: new Date(),
            updatedat: new Date()
          }
        });
      });
      
      // Enviar mensaje de confirmación ANTES de la primera pregunta
      const confirmationMessage = `📚 ¡Sesión de repaso iniciada!\n\n🎯 Materia: ${subject.toUpperCase()}\n📊 Preguntas solicitadas: ${totalquestions}\n📋 Preguntas disponibles: ${failedQuestions.length}\n\n⏱️ Tienes 1 minuto por pregunta\n⚡ Usa /stop para cancelar`;
      
      // Enviar confirmación inmediatamente
      const { TelegramService } = await import('./telegramService');
      const telegramService = new TelegramService(process.env.TELEGRAM_BOT_TOKEN || '');
      await telegramService.sendMessage(userid, confirmationMessage);
      
      // Luego enviar la primera pregunta
      await this.sendNextFailedQuestion(session.id, failedQuestions);
      
      return { 
        success: true, 
        message: '', // Mensaje vacío ya que se envió directamente
        sessionId: session.id 
      };
    } catch (error) {
      console.error('Error iniciando sesión de preguntas falladas:', error);
      return { success: false, message: '❌ Error interno del sistema' };
    }
  }
  
  /**
   * Enviar siguiente pregunta fallada específica
   */
  private async sendNextFailedQuestion(sessionid: string, failedQuestions: StudyQuestion[]): Promise<{ success: boolean; message?: string; completed?: boolean }> {
    try {
      const session = await prisma.userstudysession.findUnique({
        where: { id: sessionid }
      });
      
      if (!session || session.status !== 'active') {
        return { success: false, message: 'Sesión no encontrada o inactiva' };
      }
      
      // Verificar si ya completó todas las preguntas solicitadas
      if (session.currentindex >= session.totalquestions) {
        await this.completeSession(session.id);
        return { success: true, completed: true };
      }
      
      // Obtener la pregunta específica para este índice
      let question: StudyQuestion | null = failedQuestions[session.currentindex];
      
      // Si no hay pregunta fallada disponible para este índice, buscar una pregunta normal
      if (!question) {
        console.log(`🔍 [sendNextFailedQuestion] No hay pregunta fallada disponible para índice ${session.currentindex}, buscando pregunta normal...`);
        
        // Determinar el subject para buscar preguntas normales
        // Para sesiones de 'all', usar 'constitucion' como fallback
        const originalSubject = session.subject === 'all' ? 'constitucion' : session.subject.replace('_falladas', '');
        
        console.log(`🔍 [sendNextFailedQuestion] Buscando pregunta normal para subject: ${originalSubject}`);
        
        // Obtener estadísticas para evitar repetición
        const stats = await this.getUserStats(session.userid, originalSubject);
        const completedQuestions = StudySessionService.parseQuestionsCompleted(stats.questionscompleted || "[]", session.userid);
        
        // Obtener nombre de tabla correcto
        const tableName = StudySessionService.TABLE_MAPPING[originalSubject];
        if (!tableName) {
          console.error(`❌ [sendNextFailedQuestion] Tabla no encontrada para subject: ${originalSubject}`);
          await this.cancelSession(sessionid);
          return { success: false, message: '❌ Materia no válida' };
        }
        
        console.log(`🔍 [sendNextFailedQuestion] Buscando pregunta normal en tabla: ${tableName}`);
        
        // Buscar una pregunta normal
        question = await this.getRandomQuestion(tableName, completedQuestions);
        
        if (!question) {
          console.log(`⚠️ [sendNextFailedQuestion] No se pudo encontrar pregunta normal para completar la sesión`);
          await this.cancelSession(sessionid);
          return { success: false, message: '❌ No se pudo obtener pregunta adicional' };
        }
        
        console.log(`✅ [sendNextFailedQuestion] Pregunta normal encontrada para completar sesión: ${question.id}`);
      }
      
      return await this.sendQuestionToUser(session, question);
      
    } catch (error) {
      console.error('❌ Error enviando pregunta fallada:', error);
      return { success: false, message: 'Error enviando pregunta de repaso' };
    }
  }

  // ==========================================
  // 🎯 INICIAR SESIÓN DE ESTUDIO
  // ==========================================
  
  async startStudySession(userid: string, subject: string, totalquestions: number, sessionType: 'normal' | 'failed' | 'random' = 'normal'): Promise<{ success: boolean; message: string; sessionId?: string }> {
    try {
      // Si es sesión de preguntas falladas, usar método específico
      if (sessionType === 'failed') {
        return await this.startFailedStudySession(userid, subject, totalquestions);
      }
      
      // Verificar permisos de suscripción
      const subscriptionCheck = await this.subscriptionService.checkQuestionQuota(userid, totalquestions);
      if (!subscriptionCheck.allowed) {
        return { success: false, message: subscriptionCheck.message };
      }
      
      // Limpiar sesiones anteriores
      await this.cleanupUserSessions(userid);
      
      // Obtener preguntas según el tipo de sesión
      let questions: StudyQuestion[];
      if (sessionType === 'random') {
        questions = await this.getRandomQuestionsFromAllSubjects(totalquestions);
        if (questions.length === 0) {
          return { success: false, message: `❌ No hay preguntas disponibles para el test aleatorio` };
        }
      } else {
        questions = await this.getQuestions(subject, totalquestions);
        if (questions.length === 0) {
          return { success: false, message: `❌ No hay preguntas disponibles para ${subject.toUpperCase()}` };
        }
      }
      
      // Crear nueva sesión
      const sessionSubject = sessionType === 'random' ? 'aleatorias' : subject;
      
      // Para sesiones aleatorias, almacenar los IDs de las preguntas en questionsasked
      const questionsAsked = sessionType === 'random' ? questions.map(q => q.id) : [];
      
      const session = await withRetry(async () => {
        return await prisma.userstudysession.create({
                    data: {
            id: generateUniqueId(),
            userid,
            subject: sessionSubject,
            totalquestions,
            currentindex: 0,
            questionsasked: sessionType === 'random' ? JSON.stringify(questionsAsked) : null,
            status: 'active',
            startedat: new Date(),
            updatedat: new Date()
          }
        });
      });
      
      // Para sesiones aleatorias, almacenar las preguntas en una variable global temporal
      if (sessionType === 'random') {
        global.randomQuestions = global.randomQuestions || {};
        global.randomQuestions[session.id] = questions;
        console.log(`✅ [DEBUG] Almacenadas ${questions.length} preguntas aleatorias para sesión ${session.id}`);
        console.log(`🔍 [DEBUG] Total de sesiones en global.randomQuestions: ${Object.keys(global.randomQuestions).length}`);
      }
      
      // Enviar mensaje de confirmación ANTES de la primera pregunta
      const subjectDisplay = sessionType === 'random' ? '🎲 TEST ALEATORIO (27 materias)' : subject.toUpperCase();
      const confirmationMessage = `📚 ¡Sesión de estudio iniciada!

🎯 Materia: ${subjectDisplay}
📊 Preguntas: ${totalquestions}

⏱️ Tienes 1 minuto por pregunta
⚡ Usa /stop para cancelar
📈 Usa /progreso para ver tu estado`;
      
      // Enviar confirmación inmediatamente
      const { TelegramService } = await import('./telegramService');
      const telegramService = new TelegramService(process.env.TELEGRAM_BOT_TOKEN || '');
      await telegramService.sendMessage(userid, confirmationMessage);
      
      // Luego enviar la primera pregunta
      await this.sendNextQuestion(session.id);
      
      return { success: true, message: '', sessionId: session.id }; // Mensaje vacío ya que se envió directamente
    } catch (error) {
      console.error('Error iniciando sesión de estudio:', error);
      return { success: false, message: '❌ Error interno del sistema' };
    }
  }

  // ==========================================
  // 🎯 OBTENER PRÓXIMA PREGUNTA
  // ==========================================
  
  async sendNextQuestion(sessionid: string): Promise<{ success: boolean; message?: string; completed?: boolean }> {
    try {
      const session = await prisma.userstudysession.findUnique({
        where: { id: sessionid }
      });

      if (!session || session.status !== 'active') {
        return { success: false, message: 'Sesión no encontrada o inactiva' };
      }

      // 🎓 Si es una sesión de preguntas falladas, usar el método especializado
      if (session.subject === 'falladas' || session.subject.endsWith('_falladas')) {
        // Para sesiones de falladas, las preguntas ya están pre-seleccionadas en questionsAsked
        const failedQuestions: StudyQuestion[] = [];
        
        // Recuperar las preguntas basándose en los IDs almacenados
        if (session.questionsasked && session.questionsasked.length > 0) {
          for (const questionId of session.questionsasked) {
            // Extraer el subject original del session.subject 
            const originalSubject = session.subject === 'falladas' ? 'all' : session.subject.replace('_falladas', '');
            
            // Para 'all', necesitamos buscar en todas las materias
            if (originalSubject === 'all') {
              // Buscar la pregunta en todas las materias posibles
              let found = false;
              for (const subject of Object.keys(STUDY_COMMANDS).map(s => s.replace('/', ''))) {
                const question = await this.getQuestionById(subject, questionId);
                if (question) {
                  failedQuestions.push(question);
                  found = true;
                  break;
                }
              }
              if (!found) {
                console.warn(`⚠️ No se pudo encontrar la pregunta ${questionId} en ninguna materia`);
              }
            } else {
              // Buscar en la materia específica
              const question = await this.getQuestionById(originalSubject, questionId);
              if (question) {
                failedQuestions.push(question);
              }
            }
          }
        }
        
        return await this.sendNextFailedQuestion(sessionid, failedQuestions);
      }

      // Verificar si ya completó todas las preguntas
      if (session.currentindex >= session.totalquestions) {
        await this.completeSession(session.id);
        return { success: true, completed: true };
      }

      // 🎲 Manejo especial para sesiones aleatorias
      if (session.subject === 'aleatorias') {
        // Para sesiones aleatorias, usar las preguntas pre-seleccionadas
        console.log(`🔍 [DEBUG] Buscando preguntas aleatorias para sesión ${session.id}`);
        console.log(`🔍 [DEBUG] global.randomQuestions existe: ${!!global.randomQuestions}`);
        console.log(`🔍 [DEBUG] Sesiones en global.randomQuestions: ${global.randomQuestions ? Object.keys(global.randomQuestions).length : 0}`);
        
        const randomQuestions = global.randomQuestions?.[session.id];
        console.log(`🔍 [DEBUG] Preguntas encontradas para sesión ${session.id}: ${randomQuestions ? randomQuestions.length : 'ninguna'}`);
        console.log(`🔍 [DEBUG] Índice actual: ${session.currentindex}`);
        
        if (randomQuestions && session.currentindex < randomQuestions.length) {
          const question = randomQuestions[session.currentindex];
          console.log(`✅ [DEBUG] Enviando pregunta ${session.currentindex + 1}/${randomQuestions.length}`);
          return await this.sendQuestionToUser(session, question);
        } else {
          console.error(`❌ No se encontraron preguntas aleatorias para la sesión: ${session.id}`);
          console.error(`❌ [DEBUG] randomQuestions: ${!!randomQuestions}, currentindex: ${session.currentindex}, length: ${randomQuestions?.length || 0}`);
          await this.cancelSession(sessionid);
          return { success: false, message: '❌ Error obteniendo preguntas aleatorias' };
        }
      }

      // Obtener estadísticas para evitar repetición
      const stats = await this.getUserStats(session.userid, session.subject);
      
      // Parsear questionscompleted como array de forma segura
      const completedQuestions = StudySessionService.parseQuestionsCompleted(stats.questionscompleted || "[]", session.userid);
      
      // Obtener nombre de tabla correcto usando TABLE_MAPPING
      const tableName = StudySessionService.TABLE_MAPPING[session.subject];
      if (!tableName) {
        await this.cancelSession(sessionid);
        return { success: false, message: '❌ Materia no válida' };
      }

      // Obtener pregunta que no haya sido respondida (usar nombre de tabla correcto)
      const question = await this.getRandomQuestion(tableName, completedQuestions);
      
      if (!question) {
        // Si no hay más preguntas únicas, reiniciar el pool
        await this.resetQuestionPool(session.userid, session.subject);
        const retryQuestion = await this.getRandomQuestion(tableName, []);
        
        if (!retryQuestion) {
          await this.cancelSession(sessionid);
          return { success: false, message: '❌ No hay preguntas disponibles para esta materia' };
        }
        
        return await this.sendQuestionToUser(session, retryQuestion);
      }

      return await this.sendQuestionToUser(session, question);

    } catch (error) {
      console.error('Error enviando siguiente pregunta:', error);
      return { success: false, message: 'Error enviando pregunta' };
    }
  }

  // ==========================================
  // 🎯 PROCESAR RESPUESTA DEL POLL
  // ==========================================
  
  async processPollAnswer(pollId: string, userId: string, selectedOption: number): Promise<void> {
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        // Variables para usar fuera de la transacción
        let shouldSendNextQuestion = false;
        let sessionIdForNext = '';
        let actualSubject = '';
        let isCorrect = false;
        let question: any = null;
        let updatedSession: any = null;
        let feedbackMessage = '';
        let pollMapping: any = null;
        
        // 1. Transacción optimizada con timeout reducido
        await prisma.$transaction(async (tx) => {
          pollMapping = await tx.telegrampollmapping.findUnique({ 
            where: { pollid: pollId },
            select: { questionid: true, subject: true }
          });
          
          if (!pollMapping) {
            console.error(`[StudySession] No se encontró mapeo para el pollId: ${pollId}`);
            return;
          }
          
          const { questionid, subject } = pollMapping;
          
          // Buscar sesión activa de forma más eficiente
          let session = await tx.userstudysession.findFirst({ 
            where: { 
              userid: userId, 
              status: 'active' 
            },
            select: {
              id: true,
              userid: true,
              subject: true,
              currentindex: true,
              totalquestions: true,
              timeoutat: true
            }
          });
          
          if (!session) {
            console.error(`[StudySession] No se encontró sesión activa para el usuario ${userId}. Subject del poll: ${subject}`);
            return;
          }
          
          actualSubject = subject;
          
          // Actualizar la sesión de forma más eficiente
          const newCurrentIndex = session.currentindex + 1;
          updatedSession = await tx.userstudysession.update({
            where: { id: session.id },
            data: {
              currentindex: newCurrentIndex,
              timeoutat: newCurrentIndex >= session.totalquestions ? null : new Date(Date.now() + 60000),
              status: newCurrentIndex >= session.totalquestions ? 'completed' : 'active'
            }
          });
          
        }, { 
          timeout: 8000, // Reducido a 8 segundos
          maxWait: 5000,  // Máximo tiempo de espera para obtener conexión
          isolationLevel: 'ReadCommitted' // Nivel de aislamiento más eficiente
        });
      // 2. Obtener la pregunta y calcular iscorrect fuera de la transacción
      if (pollMapping) {
        // Corregir la capitalización de questionid
        question = await this.getQuestionById(pollMapping.subject, pollMapping.questionid);
        if (!question) {
          console.error(`[StudySession] No se pudo obtener la pregunta con ID ${pollMapping.questionid} para la materia ${pollMapping.subject}`);
          return;
        }
        let correctanswerindex = question.correctanswerindex;
        if (global.studyPollMappings && global.studyPollMappings.has(pollId)) {
          const mapping = global.studyPollMappings.get(pollId);
          correctanswerindex = mapping.correctanswerindex;
        }
        isCorrect = selectedOption === correctanswerindex; // 🔧 FIX: Usar la variable correctanswerindex en lugar de question.correctanswerindex
        // Actualizar estadísticas fuera de la transacción
        await this.updateUserStats(prisma, userId, actualSubject, isCorrect, 1000, pollMapping.questionid, pollId, selectedOption, question.questionnumber || 0);
        // Notificar al usuario
        feedbackMessage = StudySessionService.formatResponseFeedback(isCorrect, question, updatedSession, pollId);
        const { TelegramService } = await import('./telegramService');
        const telegramService = new TelegramService(process.env.TELEGRAM_BOT_TOKEN || '');
        await telegramService.sendMessage(userId, feedbackMessage);
        // Verificar si debemos finalizar la sesión
        if (updatedSession.currentindex >= updatedSession.totalquestions) {
          await prisma.userstudysession.update({
            where: { id: updatedSession.id },
            data: { status: 'completed', timeoutat: null }
          });
          shouldSendNextQuestion = false;
          sessionIdForNext = updatedSession.id;
        } else {
          shouldSendNextQuestion = true;
          sessionIdForNext = updatedSession.id;
        }
      }
      // 3. Acciones fuera de la transacción
      if (shouldSendNextQuestion) {
        const sessionForNext = await prisma.userstudysession.findUnique({ where: { id: sessionIdForNext } });
        if (sessionForNext && (sessionForNext.subject === 'all' || sessionForNext.subject.endsWith('_falladas'))) {
          const originalSubject = sessionForNext.subject === 'all' ? 'all' : sessionForNext.subject.replace('_falladas', '');
          const failedQuestions = await this.getFailedQuestions(sessionForNext.userid, originalSubject, sessionForNext.totalquestions);
          await this.sendNextFailedQuestion(sessionIdForNext, failedQuestions);
        } else {
          await this.sendNextQuestion(sessionIdForNext);
        }
      } else if (sessionIdForNext) {
        try {
          const scheduler = await getScheduler();
          scheduler.cancelTimeout(sessionIdForNext);
        } catch (error) {
          console.error('Error cancelando timeout:', error);
        }
        const summary = await this.generateSessionCompletionMessage(sessionIdForNext);
        const { TelegramService } = await import('./telegramService');
        const telegramService = new TelegramService(process.env.TELEGRAM_BOT_TOKEN || '');
        await telegramService.sendMessage(userId, summary);
      }
        // Notificaciones de graduación fuera de la transacción (igual que antes)
        if (global.graduationNotifications && global.graduationNotifications.length > 0) {
          const notificationsToProcess = [...global.graduationNotifications];
          global.graduationNotifications = [];
          for (const notification of notificationsToProcess) {
            try {
              const { NotificationService } = await import('./notificationService');
              const notificationService = new NotificationService();
              const { TelegramService } = await import('./telegramService');
              const telegramService = new TelegramService(process.env.TELEGRAM_BOT_TOKEN || '');
              // ... lógica de notificación ...
            } catch (error) {
              console.error('Error enviando notificación de graduación:', error);
            }
          }
        }
        
        // Si llegamos aquí, la operación fue exitosa
        break;
        
      } catch (error: any) {
        retryCount++;
        
        // Manejo específico del error P2028 (timeout de transacción)
        if (error.code === 'P2028' || error.message?.includes('Unable to start a transaction')) {
          console.warn(`[StudySession] Error P2028 en processPollAnswer (intento ${retryCount}/${maxRetries}):`, error.message);
          
          if (retryCount < maxRetries) {
            // Esperar antes del siguiente intento (backoff exponencial)
            const waitTime = Math.min(1000 * Math.pow(2, retryCount - 1), 5000);
            console.log(`[StudySession] Reintentando processPollAnswer en ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          } else {
            console.error(`[StudySession] Error P2028 persistente en processPollAnswer después de ${maxRetries} intentos. PollId: ${pollId}`);
            // Intentar registrar la respuesta de forma simplificada
            try {
              await prisma.studyresponse.create({
                data: {
                  id: generateUniqueId(),
                  sessionid: 'unknown',
                  userid: userId,
                  subject: 'unknown',
                  questionid: pollId,
                  questionnumber: 0,
                  pollid: pollId,
                  selectedoption: selectedOption,
                  iscorrect: false, // Asumir incorrecto por seguridad
                  answeredat: new Date(),
                  createdat: new Date()
                }
              });
              console.log(`[StudySession] Respuesta registrada de forma simplificada para pollId: ${pollId}`);
            } catch (fallbackError) {
              console.error(`[StudySession] Error en fallback para pollId ${pollId}:`, fallbackError);
            }
            break;
          }
        } else {
          // Para otros errores, no reintentar
          console.error('Error no recuperable en processPollAnswer:', error);
          break;
        }
      }
    }
  }

  // ==========================================
  // 🎯 CANCELAR SESIÓN ACTIVA
  // ==========================================
  
  async cancelActiveSession(userid: string): Promise<void> {
    try {
      const activeSession = await prisma.userstudysession.findFirst({
        where: { userid, status: 'active' }
      });

      if (activeSession) {
        await this.cancelSession(activeSession.id);
      }
    } catch (error) {
      console.error('Error cancelando sesión activa:', error);
    }
  }

  // ==========================================
  // 🎯 VER PROGRESO DE SESIÓN
  // ==========================================
  
  async getSessionProgress(userid: string): Promise<{ success: boolean; message: string }> {
    try {
      const session = await prisma.userstudysession.findFirst({
        where: { userid, status: 'active' }
      });

      if (!session) {
        return { success: false, message: '❌ No tienes ninguna sesión de estudio activa' };
      }

      // Obtener respuestas por separado
      const responses = await prisma.studyresponse.findMany({
        where: { 
          sessionid: session.id,
          answeredat: { not: null }
        }
      });

      const answered = responses.length;
      const correct = responses.filter(r => r.iscorrect).length;
      const incorrect = responses.filter(r => !r.iscorrect || r.timedout).length;
      const percentage = answered > 0 ? Math.round((correct / answered) * 100) : 0;

      const progress = `📊 **PROGRESO ACTUAL**\n\n` +
        `🎯 Materia: ${session.subject.toUpperCase()}\n` +
        `📈 Progreso: ${session.currentindex}/${session.totalquestions}\n\n` +
        `✅ Correctas: ${correct}\n` +
        `❌ Incorrectas: ${incorrect}\n` +
        `📊 Porcentaje: ${percentage}%\n\n` +
        `⏱️ Tiempo restante: ${Math.max(0, Math.ceil((session.timeoutat!.getTime() - Date.now()) / 1000))}s`;

      return { success: true, message: progress };

    } catch (error) {
      console.error('Error obteniendo progreso:', error);
      return { success: false, message: '❌ Error obteniendo progreso' };
    }
  }

  // ==========================================
  // 🔧 FUNCIONES PÚBLICAS AUXILIARES
  // ==========================================
  
  static getDisplayName(subject: string): string {
    return this.TABLE_DISPLAY_NAMES[subject] || subject;
  }

  // ==========================================
  // 🔧 FUNCIONES AUXILIARES PRIVADAS
  // ==========================================
  
  /**
   * Parsear questionscompleted de forma segura, manejando formatos corruptos
   */
  private static parseQuestionsCompleted(rawCompleted: string, userid?: string): string[] {
    try {
      // Verificar si es JSON válido
      if (rawCompleted.startsWith('[') && rawCompleted.endsWith(']')) {
        const parsed = JSON.parse(rawCompleted);
        return Array.isArray(parsed) ? parsed : [];
      } else if (rawCompleted.startsWith('{') && rawCompleted.endsWith('}')) {
        // Formato corrupto: {uuid1,uuid2,uuid3} -> convertir a array
        if (userid) {
          console.warn(`🔧 [parseQuestionsCompleted] Formato corrupto detectado para usuario ${userid}, convirtiendo...`);
        }
        const uuids = rawCompleted.slice(1, -1).split(',').map(uuid => uuid.trim());
        const result = uuids.filter(uuid => uuid.length > 0);
        if (userid) {
          console.log(`🔧 [parseQuestionsCompleted] Convertidos ${result.length} UUIDs del formato corrupto`);
        }
        return result;
      } else {
        // Intentar parsear como JSON normal
        const parsed = JSON.parse(rawCompleted);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (error) {
      if (userid) {
        console.error(`❌ Error parsing questionscompleted para usuario ${userid}:`, error);
        console.error(`❌ Contenido problemático:`, rawCompleted);
      }
      
      // Último intento: extraer UUIDs usando regex
      try {
        const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
        const matches = rawCompleted.match(uuidRegex);
        if (matches && matches.length > 0) {
          if (userid) {
            console.log(`🔧 [parseQuestionsCompleted] Recuperados ${matches.length} UUIDs usando regex`);
          }
          return matches;
        }
      } catch (regexError) {
        if (userid) {
          console.error(`❌ Error con regex fallback:`, regexError);
        }
      }
      
      return [];
    }
  }
  
  private static async getAvailableQuestionsCount(userid: string, tableName: string): Promise<number> {
    try {
      const result = await prisma.$queryRawUnsafe(`
        SELECT COUNT(*) as count FROM "${tableName}"
      `);
      
      return parseInt((result as any)[0].count);
    } catch (error) {
      console.error('❌ Error contando preguntas:', error);
      console.error('❌ Tabla consultada:', tableName);
      return 0;
    }
  }
  
  private static async getRandomUnusedQuestion(userid: string, tableName: string, excludeIds: string[]): Promise<any> {
    try {
      const excludeClause = excludeIds.length > 0 
        ? `AND id NOT IN (${excludeIds.map(id => `'${id}'`).join(',')})`
        : '';
      
      const result = await prisma.$queryRawUnsafe(`
        SELECT * FROM ${tableName} 
        WHERE 1=1 ${excludeClause}
        ORDER BY RAND() 
        LIMIT 1
      `);
      
      return (result as any[])[0] || null;
    } catch (error) {
      console.error('❌ Error obteniendo pregunta aleatoria:', error);
      return null;
    }
  }
  
  private static async findQuestionByPollId(pollid: string, tableName: string): Promise<any> {
    try {
      // Para sesiones de estudio, usar el mapping en memoria temporal
      if (global.studyPollMappings && global.studyPollMappings.has(pollid)) {
        const mapping = global.studyPollMappings.get(pollid);
        
        const result = await prisma.$queryRawUnsafe(`
          SELECT * FROM ${tableName} WHERE id = ?
        `, mapping.questionid); // ✅ Pasar UUID directamente como string
        
        return (result as any[])[0] || null;
      }
      
      // Fallback: buscar en el mapeo de polls existente (para compatibilidad)
      const pollMapping = await prisma.telegrampoll.findFirst({
        where: { 
          pollid: pollid
        }
      });
      
      if (!pollMapping) return null;
      
      const result = await prisma.$queryRawUnsafe(`
        SELECT * FROM ${tableName} WHERE id = ?
      `, pollMapping.questionid); // ✅ UUID como string, no parseInt
      
      return (result as any[])[0] || null;
    } catch (error) {
      console.error('❌ Error buscando pregunta por pollid:', error);
      return null;
    }
  }
  

  
  private async generateSessionCompletionMessage(sessionid: string): Promise<string> {
    const session = await prisma.userstudysession.findUnique({
      where: { id: sessionid }
    });

    if (!session) return 'Error: No se pudo generar el resumen de la sesión.';

    // 🧹 LIMPIAR REGISTROS HUÉRFANOS ANTES DEL CONTEO
    await this.cleanupOrphanedResponses(sessionid);

    // Obtener responses actualizadas después de la limpieza
    const responses = await prisma.studyresponse.findMany({
      where: { sessionid: sessionid }
    });

    if (!responses) return 'Error: No se pudo generar el resumen de la sesión.';

    // 🔧 FIX CRÍTICO: Para sesiones de falladas, usar estadísticas agregadas
    // Para sesiones de falladas de "all", no usar estadísticas de una materia específica
    let stats: any = null;
    
    if (session.subject === 'all' || session.subject === 'falladas') {
      // Para sesiones de falladas generales, usar estadísticas agregadas básicas
      console.log(`🔧 [generateSessionCompletionMessage] Sesión de falladas general: usando estadísticas básicas`);
      stats = {
        totalquestions: responses.length, // Usar respuestas de esta sesión
        correctanswers: responses.filter(r => r.iscorrect).length,
        accuracy: responses.length > 0 ? (responses.filter(r => r.iscorrect).length / responses.length) * 100 : 0,
        questionscompleted: "[]"
      };
    } else {
      // Para sesiones normales o de materia específica, usar estadísticas de la materia
      let statsSubject = session.subject;
      
      // Si es sesión de falladas de materia específica, obtener el subject real
      if (session.subject.endsWith('_falladas')) {
        statsSubject = session.subject.replace('_falladas', '');
        console.log(`🔧 [generateSessionCompletionMessage] Sesión de falladas específica: usando estadísticas de ${statsSubject}`);
      }
      
      stats = await this.getUserStats(session.userid, statsSubject);
    }

    console.log(`📊 GENERANDO RESUMEN DE SESIÓN - ID: ${sessionid}`);
    console.log(`📊 Total responses en BD: ${responses.length}`);
    console.log(`📊 questionsAsked length: ${session.questionsasked?.length || 0}`);
    console.log(`📊 currentindex: ${session.currentindex}`);

    // 🎯 USAR currentIndex COMO FUENTE DE VERDAD CONSISTENTE
    // Durante la sesión usamos currentIndex en formatResponseFeedback, usemos eso mismo aquí
    const totalQuestionsProcessed = session.currentindex;
    console.log(`📊 Total preguntas procesadas (currentIndex): ${totalQuestionsProcessed}`);

    // Filtrar solo las respuestas válidas que tienen answeredat
    const validResponses = responses.filter(r => r.answeredat !== null);
    console.log(`📊 Responses con answeredat: ${validResponses.length}`);

    // Separar por tipo - basándose en respuestas reales del usuario
    const actualUserResponses = validResponses.filter(r => r.timedout !== true);
    const timedOutResponses = validResponses.filter(r => r.timedout === true);
    
    console.log(`📊 Respuestas reales del usuario: ${actualUserResponses.length}`);
    console.log(`📊 Respuestas por timeout: ${timedOutResponses.length}`);

    // 🔍 DEBUG DETALLADO: Mostrar cada respuesta individualmente
    console.log(`🔍 DEBUGGING DETALLADO DE RESPUESTAS:`);
    actualUserResponses.forEach((response, index) => {
      console.log(`   📝 Respuesta ${index + 1}:`);
      console.log(`      └─ ID: ${response.id}`);
      console.log(`      └─ questionid: ${response.questionid}`);
      console.log(`      └─ iscorrect: ${response.iscorrect} (type: ${typeof response.iscorrect})`);
      console.log(`      └─ timedout: ${response.timedout}`);
      console.log(`      └─ selectedoption: ${response.selectedoption}`);
      console.log(`      └─ answeredat: ${response.answeredat}`);
    });

    const correctAnswers = actualUserResponses.filter(r => r.iscorrect === true).length;
    const incorrectAnswers = actualUserResponses.filter(r => r.iscorrect === false).length;
    const timedOutCount = timedOutResponses.length;

    console.log(`📊 Correctas: ${correctAnswers}`);
    console.log(`📊 Incorrectas: ${incorrectAnswers}`);
    console.log(`📊 Timeouts: ${timedOutCount}`);

    // 🎯 EL TOTAL EN BD DEBE IGUALAR LAS PREGUNTAS PROCESADAS
    const totalResponsesInDB = correctAnswers + incorrectAnswers + timedOutCount;
    console.log(`📊 Total respuestas en BD: ${totalResponsesInDB}`);

    console.log(`📊 VERIFICACIÓN DE COHERENCIA:`);
    console.log(`   └─ Preguntas procesadas (currentIndex): ${totalQuestionsProcessed}`);
    console.log(`   └─ Respuestas registradas en BD: ${totalResponsesInDB}`);
    console.log(`   └─ ¿Coinciden?: ${totalQuestionsProcessed === totalResponsesInDB ? '✅ SÍ' : '❌ NO'}`);

    // Calcular precisión solo sobre respuestas reales (sin timeouts)
    const accuracyBase = correctAnswers + incorrectAnswers;
    const accuracy = accuracyBase > 0 ? Math.round((correctAnswers / accuracyBase) * 100) : 0;

    console.log(`📊 CONTEO FINAL:`);
    console.log(`   └─ Preguntas objetivo: ${session.totalquestions}`);
    console.log(`   └─ Preguntas procesadas: ${totalQuestionsProcessed}`);
    console.log(`   └─ Respuestas en BD: ${totalResponsesInDB}`);
    console.log(`   └─ Correctas: ${correctAnswers}`);
    console.log(`   └─ Incorrectas: ${incorrectAnswers}`);
    console.log(`   └─ Timeouts: ${timedOutCount}`);
    console.log(`   └─ Precisión: ${accuracy}%`);

    return this.generateCompletionMessage(stats, session.totalquestions, correctAnswers, incorrectAnswers, accuracy, timedOutCount, totalQuestionsProcessed);
  }
  
  private generateCompletionMessage(
    stats: any, 
    totalquestions: number,
    correctanswers: number,
    incorrectanswers: number,
    accuracy: number,
    timedOutCount: number,
    totalQuestionsProcessed: number
  ): string {
    try {
      let message = `🎯 ¡Sesión completada!\n\n`;
      message += `📊 Preguntas de la sesión: ${totalquestions}\n`;
      message += `✅ Correctas: ${correctanswers}\n`;
      message += `❌ Incorrectas: ${incorrectanswers}\n`;
      message += `⏰ Sin respuesta: ${timedOutCount}\n`;
      message += `📈 Precisión: ${accuracy}%\n\n`;
      
      // Añadir estadísticas generales
      // Ya no verificamos totalProcessed vs totalquestions porque pueden ser diferentes
      message += `📊 Estadísticas generales:\n`;
      const totalResponsesInDB = correctanswers + incorrectanswers + timedOutCount;
      console.log(`📊 [generateCompletionMessage] Respuestas registradas: ${totalResponsesInDB}, Preguntas procesadas: ${totalQuestionsProcessed}`);
      
      // Para sesiones de falladas, usar el conteo objetivo como referencia
      if (totalResponsesInDB !== totalquestions) {
        console.log(`⚠️ Discrepancia detectada: Respuestas registradas (${totalResponsesInDB}) != Preguntas objetivo (${totalquestions})`);
        // Solo mostrar discrepancia si es significativa (más de 1 diferencia)
        if (Math.abs(totalResponsesInDB - totalquestions) > 1) {
          message += `⚠️ Procesadas: ${totalResponsesInDB}/${totalquestions}\n`;
        }
      }
      
      message += `📈 Total preguntas: ${stats.totalquestions}\n`;
      message += `🎯 Precisión general: ${Math.round(stats.accuracy)}%\n\n`;
      
      // Añadir mensaje motivacional
      if (accuracy >= 80) {
        message += `🏆 ¡Excelente trabajo! Dominas muy bien la materia.\n`;
      } else if (accuracy >= 60) {
        message += `👍 ¡Buen trabajo! Sigue practicando para mejorar.\n`;
      } else {
        message += `💪 ¡Sigue adelante! La práctica hace al maestro.\n`;
      }
      
      message += `💡 Usa /falladas para repasar preguntas incorrectas`;
      
      return message;
    } catch (error) {
      console.error('Error generando mensaje de finalización:', error);
      return '🎯 ¡Sesión completada! Revisa tus estadísticas en /stats';
    }
  }
  
  private static async updateUserStudyStats(userid: string, subject: string, iscorrect: boolean): Promise<void> {
    try {
      // Actualizar o crear estadísticas del usuario para esta materia
      await prisma.studystats.upsert({
        where: {
          userid_subject: {
            userid,
            subject
          }
        },
        update: {
          totalquestions: { increment: 1 },
          correctanswers: iscorrect ? { increment: 1 } : undefined,
          laststudyat: new Date()
        },
        create: {
          id: generateUniqueId(),
          userid,
          subject,
          totalquestions: 1,
          correctanswers: iscorrect ? 1 : 0,
          laststudyat: new Date(),
          updatedat: new Date()
        }
      });
    } catch (error) {
      console.error('❌ Error actualizando estadísticas:', error);
    }
  }
  
  private static formatResponseFeedback(iscorrect: boolean, question: StudyQuestion, session: any, pollid?: string): string {
    // 🎯 USAR currentIndex como fuente de verdad - representa el progreso real después de procesar la respuesta
    const progress = `(${session.currentindex}/${session.totalquestions})`;
    console.log(`📊 Progreso mostrado en feedback: ${progress} (currentindex: ${session.currentindex})`);
    
    if (iscorrect) {
      return `✅ ¡Correcto! ${progress}`;
    } else {
      // 🔧 FIX: Usar la respuesta correcta procesada del mapping global si está disponible
      let correctAnswer = '';
      
      // Intentar obtener la respuesta correcta del mapping global (opciones procesadas)
      if (pollid && global.studyPollMappings && global.studyPollMappings.has(pollid)) {
        const mapping = global.studyPollMappings.get(pollid);
        correctAnswer = mapping.correctAnswer || '';
        console.log(`🔧 Usando respuesta correcta del mapping: ${correctAnswer}`);
      }
      
      // Fallback: usar opciones originales de la base de datos (procesarlas)
      if (!correctAnswer) {
        console.log(`⚠️ No se encontró respuesta correcta en mapping, procesando opciones originales`);
        
        // Procesar opciones originales igual que en sendStudyPoll
        let options: string[] = [];
        
        if (Array.isArray(question.options)) {
          options = question.options.map((option: string) => {
            return option.replace(/^%[-\d.]+%/, '').trim();
          }).filter((option: string) => option && option.length > 0);
        } else if (typeof question.options === 'string') {
          // Parsear formato especial {"opción1","opción2"}
          let optionsStr = (question.options as string).trim();
          
          if (optionsStr.startsWith('{') && optionsStr.endsWith('}')) {
            optionsStr = optionsStr.slice(1, -1);
          }
          
          const regex = /"([^"]+)"/g;
          const matches: string[] = [];
          let match;
          
          while ((match = regex.exec(optionsStr)) !== null) {
            matches.push(match[1]);
          }
          
          if (matches.length > 0) {
            options = matches;
          } else {
            options = optionsStr.split(',').map(opt => opt.trim().replace(/^"(.*)"$/, '$1'));
          }
          
          options = options.map((option: string) => {
            return option.replace(/^%[-\d.]+%/, '').trim();
          }).filter((option: string) => option && option.length > 0);
        }
        
        if (options.length > question.correctanswerindex) {
          correctAnswer = options[question.correctanswerindex];
        }
      }
      
      return `❌ Incorrecto ${progress}\n\nLa respuesta correcta era:\n*${correctAnswer}*`;
    }
  }

  /**
   * Enviar pregunta específica al usuario
   */
  /**
   * Completar sesión (método de instancia)
   */
  async completeSession(sessionid: string): Promise<void> {
    try {
      await prisma.userstudysession.update({
        where: { id: sessionid },
        data: { status: 'completed' }
      });

      // Cancelar timeout pendiente
      try {
        const scheduler = await getScheduler();
        scheduler.cancelTimeout(sessionid);
      } catch (error) {
        console.error('Error cancelando timeout:', error);
      }

      // Limpiar preguntas aleatorias almacenadas
      if (global.randomQuestions?.[sessionid]) {
        delete global.randomQuestions[sessionid];
      }
    } catch (error) {
      console.error('Error completando sesión:', error);
    }
  }

  private async sendQuestionToUser(session: any, question: StudyQuestion, attemptCount: number = 0): Promise<{ success: boolean; message?: string }> {
    try {
      // 🔧 FIX: Para sesiones de falladas, usar currentindex + 1 para numeración correcta
      // Para sesiones normales, usar questionsasked.length + 1
      let questionnumber: number;
      
      if (session.subject === 'all' || session.subject.endsWith('_falladas')) {
        // Para sesiones de falladas, usar currentindex + 1 (secuencial)
        questionnumber = session.currentindex + 1;
        console.log(`🎓 Sesión de falladas: usando currentindex + 1 = ${questionnumber}`);
      } else {
        // Para sesiones normales, usar questionsasked.length + 1
        questionnumber = session.questionsasked ? session.questionsasked.length + 1 : session.currentindex + 1;
        console.log(`📚 Sesión normal: usando questionsasked.length + 1 = ${questionnumber}`);
      }
      
      console.log(`📚 Enviando pregunta ${questionnumber}/${session.totalquestions} al usuario ${session.userid}`);
      console.log(`📋 ID de pregunta: ${question.id}`);

      const timeoutAt = new Date(Date.now() + 60000); // 1 minuto para responder

      // 🔧 FIX: Para sesiones de falladas, usar el subject original de la pregunta
      // para que processPollAnswer pueda encontrar la pregunta correctamente
      const questionSubject = question.originalSubject || session.subject;
      
      // Preparar datos de la pregunta para el poll SIN responseId inicial
      const questionData: any = {
        id: question.id,
        question: question.question,
        options: question.options,
        correctanswerindex: question.correctanswerindex,
        subject: questionSubject, // Usar originalSubject si está disponible
        currentindex: questionnumber, // Usar el número calculado correctamente
        totalquestions: session.totalquestions,
        questionnumber: questionnumber // 🔧 FIX: Usar número de sesión, no de BD
      };

      console.log(`🎯 Verificando viabilidad del poll para pregunta ${question.id}...`);

      // Enviar poll PRIMERO para verificar si es viable
      const pollResult = await this.sendStudyPoll(session.userid, questionData);

      if (!pollResult.success) {
        console.error(`❌ Poll RECHAZADO para pregunta ${question.id} - error de envío o problema técnico`);
        console.log(`⚠️ Pregunta ${question.id} saltada - NO se crea ningún registro en BD`);

        // Verificar límite de intentos para evitar bucle infinito
        if (attemptCount >= 5) {
          console.error(`🚫 LÍMITE DE INTENTOS ALCANZADO (${attemptCount}) - Deteniendo búsqueda de alternativas para evitar bucle infinito`);
          console.error(`📋 Historial de preguntas rechazadas en esta sesión: ${session.id}`);
          console.error(`👤 Usuario: ${session.userid}, Materia: ${session.subject}`);
          return { success: false, message: 'No se pudo encontrar pregunta válida después de múltiples intentos' };
        }

        // Intentar con otra pregunta recursivamente sin incrementar currentIndex
        console.log(`🔄 Buscando pregunta alternativa para reemplazar ${question.id}... (Intento ${attemptCount + 1}/5)`);
        
        // Para sesiones de falladas, usar la misma lógica que en sendNextFailedQuestion
        if (session.subject === 'all' || session.subject.endsWith('_falladas')) {
          console.log(`🎓 [sendQuestionToUser] Sesión de falladas detectada, buscando pregunta alternativa...`);
          
          // Determinar el subject para buscar preguntas normales
          const originalSubject = session.subject === 'all' ? 'constitucion' : session.subject.replace('_falladas', '');
          
          // Obtener estadísticas para evitar repetición
          const stats = await this.getUserStats(session.userid, originalSubject);
          const completedQuestions = StudySessionService.parseQuestionsCompleted(stats.questionscompleted || "[]", session.userid);
          console.log(`📊 [Intento ${attemptCount + 1}] Preguntas completadas: ${completedQuestions.length}, Buscando en: ${originalSubject}`);
          
          // Obtener nombre de tabla correcto
          const tableName = StudySessionService.TABLE_MAPPING[originalSubject];
          if (tableName) {
            console.log(`🔄 [sendQuestionToUser] Buscando pregunta alternativa en tabla: ${tableName}`);
            const nextQuestion = await this.getRandomQuestion(tableName, completedQuestions);
            if (nextQuestion) {
              console.log(`✅ [sendQuestionToUser] Pregunta alternativa encontrada: ${nextQuestion.id}`);
              return await this.sendQuestionToUser(session, nextQuestion, attemptCount + 1);
            } else {
              console.error(`❌ [sendQuestionToUser] No se encontró pregunta alternativa en tabla ${tableName}`);
            }
          } else {
            console.error(`❌ [sendQuestionToUser] Tabla no encontrada para subject: ${originalSubject}`);
          }
        } else {
          // Para sesiones normales, usar la lógica original
          const stats = await this.getUserStats(session.userid, session.subject);
          const completedQuestions = StudySessionService.parseQuestionsCompleted(stats.questionscompleted || "[]", session.userid);
          console.log(`📊 [Intento ${attemptCount + 1}] Preguntas completadas: ${completedQuestions.length}, Buscando en: ${session.subject}`);
          
          const tableName = StudySessionService.TABLE_MAPPING[session.subject];
          if (tableName) {
            console.log(`🔄 Buscando pregunta alternativa para reemplazar ${question.id}...`);
            const nextQuestion = await this.getRandomQuestion(tableName, completedQuestions);
            if (nextQuestion) {
              console.log(`✅ Pregunta alternativa encontrada: ${nextQuestion.id}`);
              return await this.sendQuestionToUser(session, nextQuestion, attemptCount + 1);
            } else {
              console.error(`❌ No se encontró pregunta alternativa para ${question.id}`);
            }
          }
        }
        
        return { success: false, message: 'No se pudo encontrar pregunta válida' };
      }

      console.log(`✅ Poll ENVIADO exitosamente para pregunta ${question.id} - PollID: ${pollResult.pollid}`);

      // SOLO SI EL POLL SE ENVIÓ EXITOSAMENTE, crear el registro de respuesta
      const response = await prisma.studyresponse.create({
        data: {
          id: generateUniqueId(),
          sessionid: session.id,
          userid: session.userid,
          subject: questionSubject, // Usar el subject correcto
          questionid: question.id,
          questionnumber: question.questionnumber,
          pollid: pollResult.pollid || '', // Usar el pollid devuelto
          createdat: new Date()
        }
      });

      console.log(`📝 Registro StudyResponse creado: ${response.id} para pregunta ${question.id}`);

      // ✅ SOLO SI EL POLL SE ENVIÓ EXITOSAMENTE, agregar a questionsAsked
      // NO INCREMENTAR currentIndex aquí - se hará en processPollAnswer
      await prisma.userstudysession.update({
        where: { id: session.id },
        data: {
          questionsasked: JSON.stringify([...(JSON.parse(session.questionsasked || "[]")), question.id]),
          lastactivityat: new Date(),
          timeoutat: timeoutAt
        }
      });

      console.log(`📋 Pregunta ${question.id} agregada a questionsAsked. Total: ${(JSON.parse(session.questionsasked || "[]")).length + 1}`);

      // Programar timeout automático
      try {
        const scheduler = await getScheduler();
        scheduler.scheduleTimeout(session.id, timeoutAt);
        console.log(`⏰ Timeout programado para sesión ${session.id} a las ${timeoutAt.toISOString()}`);
      } catch (error) {
        console.error('Error programando timeout:', error);
      }

      return { success: true };

    } catch (error) {
      console.error(`❌ Error CRÍTICO enviando pregunta ${question.id} al usuario:`, error);
      return { success: false, message: 'Error enviando pregunta' };
    }
  }

  /**
   * Manejar timeout de pregunta con optimización de transacciones
   */
  async handleQuestionTimeout(sessionid: string): Promise<void> {
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        let shouldCompleteSession = false;
        let sessionIdForCompletion = '';
        let userid = '';
        let sessionData: any = null;

        // Transacción optimizada con timeout reducido
        await prisma.$transaction(async (tx) => {
          const session = await tx.userstudysession.findUnique({ 
            where: { id: sessionid },
            select: {
              id: true,
              userid: true,
              status: true,
              timeoutat: true,
              currentindex: true,
              totalquestions: true,
              subject: true,
              questionsasked: true
            }
          });

          if (!session || session.status !== 'active' || !session.timeoutat || session.timeoutat > new Date()) {
            return; // Sesión no activa o no ha expirado
          }
          
          console.log(`[StudySession] Timeout detectado para sesión ${session.id}`);
          
          // Guardar datos para uso posterior
          userid = session.userid;
          sessionData = session;

          // Incrementar currentIndex y crear registro de timeout en una sola operación
          const questionsAnswered = session.questionsasked ? session.questionsasked.length : 0;
          const newCurrentIndex = session.currentindex + 1;
          
          // Batch de operaciones para reducir tiempo de transacción
          const [updatedSession] = await Promise.all([
            tx.userstudysession.update({
              where: { id: session.id },
              data: {
                currentindex: newCurrentIndex,
                timeoutat: newCurrentIndex >= session.totalquestions ? null : new Date(Date.now() + 60000),
                status: newCurrentIndex >= session.totalquestions ? 'completed' : 'active'
              }
            }),
            tx.studyresponse.create({
              data: {
                id: generateUniqueId(),
                sessionid: session.id,
                userid: session.userid,
                subject: session.subject,
                questionid: "timeout",
                questionnumber: questionsAnswered + 1,
                pollid: "timeout",
                timedout: true,
                answeredat: new Date(),
                createdat: new Date()
              }
            })
          ]);
          
          if (updatedSession.currentindex >= updatedSession.totalquestions) {
            shouldCompleteSession = true;
            sessionIdForCompletion = sessionid;
          }
          
        }, {
          timeout: 8000, // Reducido a 8 segundos
          maxWait: 5000,  // Máximo tiempo de espera para obtener conexión
          isolationLevel: 'ReadCommitted' // Nivel de aislamiento más eficiente
        });

        // Realizar acciones después de la transacción
        if (shouldCompleteSession) {
          // Enviar mensaje de timeout
          const { TelegramService } = await import('./telegramService');
          const telegramService = new TelegramService(process.env.TELEGRAM_BOT_TOKEN || '');
          await telegramService.sendMessage(userid, '⏰ ¡Tiempo agotado! Pasando a la siguiente pregunta.');
          
          console.log(`🏁 Generando resumen de sesión completada por timeout: ${sessionIdForCompletion}...`);
          
          // Cancelar timeout pendiente
          try {
            const scheduler = await getScheduler();
            scheduler.cancelTimeout(sessionIdForCompletion);
          } catch (error) {
            console.error('Error cancelando timeout:', error);
          }
          
          // Generar y enviar resumen DESPUÉS de confirmar la transacción
          const summary = await this.generateSessionCompletionMessage(sessionIdForCompletion);
          await telegramService.sendMessage(userid, summary);
        } else {
          // Enviar mensaje de timeout para sesiones que continúan
          const { TelegramService } = await import('./telegramService');
          const telegramService = new TelegramService(process.env.TELEGRAM_BOT_TOKEN || '');
          await telegramService.sendMessage(userid, '⏰ ¡Tiempo agotado! Pasando a la siguiente pregunta.');
          
          // Enviar siguiente pregunta fuera de la transacción usando datos ya obtenidos
          if (sessionData && (sessionData.subject === 'all' || sessionData.subject.endsWith('_falladas'))) {
            // Es una sesión de falladas, necesitamos reconstruir el array de preguntas falladas
            console.log(`🎓 Timeout - Sesión de falladas detectada, reconstruyendo preguntas...`);
            
            const originalSubject = sessionData.subject === 'all' ? 'all' : sessionData.subject.replace('_falladas', '');
            const failedQuestions = await this.getFailedQuestions(sessionData.userid, originalSubject, sessionData.totalquestions);
            
            console.log(`🎓 Timeout - Preguntas falladas reconstruidas: ${failedQuestions.length}`);
            await this.sendNextFailedQuestion(sessionid, failedQuestions);
          } else {
            // Sesión normal
            await this.sendNextQuestion(sessionid);
          }
        }
        
        // Si llegamos aquí, la operación fue exitosa
        break;
        
      } catch (error: any) {
        retryCount++;
        
        // Manejo específico del error P2028 (timeout de transacción)
        if (error.code === 'P2028' || error.message?.includes('Unable to start a transaction')) {
          console.warn(`[StudySession] Error P2028 en handleQuestionTimeout (intento ${retryCount}/${maxRetries}):`, error.message);
          
          if (retryCount < maxRetries) {
            // Esperar antes del siguiente intento (backoff exponencial)
            const waitTime = Math.min(1000 * Math.pow(2, retryCount - 1), 5000);
            console.log(`[StudySession] Reintentando en ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          } else {
            console.error(`[StudySession] Error P2028 persistente después de ${maxRetries} intentos. Sesión: ${sessionid}`);
            // Intentar una operación de fallback más simple
            try {
              await prisma.userstudysession.update({
                where: { id: sessionid },
                data: { timeoutat: new Date(Date.now() + 60000) } // Solo extender timeout
              });
              console.log(`[StudySession] Fallback aplicado: timeout extendido para sesión ${sessionid}`);
            } catch (fallbackError) {
              console.error(`[StudySession] Error en fallback para sesión ${sessionid}:`, fallbackError);
            }
            break;
          }
        } else {
          // Para otros errores, no reintentar
          console.error(`[StudySession] Error no recuperable en handleQuestionTimeout:`, error);
          break;
        }
      }
    }
  }

  /**
   * Cancelar sesión específica
   */
  async cancelSession(sessionid: string): Promise<void> {
    try {
      await prisma.userstudysession.update({
        where: { id: sessionid },
        data: { status: 'cancelled' }
      });

      // Cancelar timeout pendiente
      try {
        const scheduler = await getScheduler();
        scheduler.cancelTimeout(sessionid);
      } catch (error) {
        console.error('Error cancelando timeout:', error);
      }

      // Limpiar preguntas aleatorias almacenadas
      if (global.randomQuestions?.[sessionid]) {
        delete global.randomQuestions[sessionid];
      }
    } catch (error) {
      console.error('Error cancelando sesión:', error);
    }
  }

  /**
   * Obtener pregunta aleatoria de una materia
   */
  private async getRandomQuestion(tableName: string, excludeIds: string[]): Promise<StudyQuestion | null> {
    try {
      // Construir query dinámicamente basado en el nombre de la tabla
      let query = `
        SELECT id, questionnumber, question, options, correctanswerindex, category, difficulty
        FROM ${tableName} 
        WHERE isactive = true
      `;
      
      // Agregar exclusiones si las hay
      if (excludeIds.length > 0) {
        const placeholders = excludeIds.map(() => '?').join(',');
        query += ` AND id NOT IN (${placeholders})`;
      }
      
      query += ` ORDER BY RAND() LIMIT 1`;

      const result = excludeIds.length > 0 
        ? await prisma.$queryRawUnsafe(query, ...excludeIds)
        : await prisma.$queryRawUnsafe(query);
      const questions = result as any[];

      if (questions.length === 0) {
        console.log(`❌ No se encontraron preguntas en tabla ${tableName} con exclusiones: ${excludeIds.length}`);
        return null;
      }

      console.log(`✅ Pregunta aleatoria obtenida de tabla ${tableName}: ${questions[0].id}`);
      return {
        id: questions[0].id,
        questionnumber: questions[0].questionnumber,
        question: questions[0].question,
        options: questions[0].options,
        correctanswerindex: questions[0].correctanswerindex,
        category: questions[0].category,
        difficulty: questions[0].difficulty
      };

    } catch (error) {
      console.error('Error obteniendo pregunta aleatoria:', error);
      return null;
    }
  }

  /**
   * Obtener pregunta por ID de una materia específica
   */
  private async getQuestionById(subject: string, questionid: string): Promise<StudyQuestion | null> {
    try {
      // 🔧 FIX: Para sesiones de falladas con subject 'all', buscar en todas las tablas
      if (subject === 'all') {
        console.log(`🔍 [getQuestionById] Buscando pregunta ${questionid} en todas las tablas (subject: all)`);
        
        // Buscar en todas las tablas disponibles
        for (const [tableSubject, tableName] of Object.entries(StudySessionService.TABLE_MAPPING)) {
          try {
            const query = `
              SELECT id, questionnumber, question, options, correctanswerindex, category, difficulty
              FROM ${tableName} 
              WHERE id = ?
            `;

            const result = await prisma.$queryRawUnsafe(query, questionid);
            const questions = result as any[];

            if (questions.length > 0) {
              console.log(`✅ Pregunta encontrada: ${questions[0].id} en tabla ${tableName} (subject: ${tableSubject})`);
              return {
                id: questions[0].id,
                questionnumber: questions[0].questionnumber,
                question: questions[0].question,
                options: questions[0].options,
                correctanswerindex: questions[0].correctanswerindex,
                category: questions[0].category,
                difficulty: questions[0].difficulty,
                originalSubject: tableSubject // Usar el subject real de la tabla donde se encontró
              };
            }
          } catch (tableError) {
            console.log(`⚠️ Error buscando en tabla ${tableName}:`, tableError);
            continue; // Continuar con la siguiente tabla
          }
        }
        
        console.log(`❌ Pregunta con ID ${questionid} no encontrada en ninguna tabla`);
        return null;
      }
      
      // Para subjects específicos, usar TABLE_MAPPING
      const tableName = StudySessionService.TABLE_MAPPING[subject];
      if (!tableName) {
        console.error(`❌ Tabla no encontrada para subject: ${subject}`);
        return null;
      }

      const query = `
        SELECT id, questionnumber, question, options, correctanswerindex, category, difficulty
        FROM ${tableName} 
        WHERE id = ?
      `;

      const result = await prisma.$queryRawUnsafe(query, questionid);
      const questions = result as any[];

      if (questions.length === 0) {
        console.log(`❌ Pregunta con ID ${questionid} no encontrada en tabla ${tableName}`);
        return null;
      }

      console.log(`✅ Pregunta encontrada: ${questions[0].id} en tabla ${tableName}`);
      return {
        id: questions[0].id,
        questionnumber: questions[0].questionnumber,
        question: questions[0].question,
        options: questions[0].options,
        correctanswerindex: questions[0].correctanswerindex,
        category: questions[0].category,
        difficulty: questions[0].difficulty,
        originalSubject: subject // Preservar el subject original para sesiones de falladas
      };

    } catch (error) {
      console.error('Error obteniendo pregunta por ID:', error);
      return null;
    }
  }

  /**
   * Obtener estadísticas del usuario para una materia
   */
  private async getUserStats(userid: string, subject: string): Promise<any> {
    try {
      let stats = await prisma.studystats.findUnique({
        where: { 
          userid_subject: { userid, subject } 
        }
      });

      if (!stats) {
        stats = await prisma.studystats.create({
          data: {
            id: generateUniqueId(),
            userid,
            subject,
            questionscompleted: "[]",
            totalquestions: 0,
            correctanswers: 0,
            currentstreak: 0,
            beststreak: 0,
            createdat: new Date(),
            updatedat: new Date()
          }
        });
      }

      return stats;
    } catch (error) {
      console.error('Error obteniendo estadísticas de usuario:', error);
      return { questionscompleted: "[]" };
    }
  }

  /**
   * Actualizar estadísticas del usuario
   */
  private async updateUserStats(
    tx: any, // Acepta el cliente de transacción
    userid: string,
    subject: string,
    iscorrect: boolean,
    responsetime: number,
    questionid: string,
    pollid: string,
    selectedoption: number,
    questionnumber: number
  ): Promise<void> {
    
    // 🔍 DEBUG: Log entrada de función
    console.log(`🔧 [updateUserStats] INICIANDO para:`);
    console.log(`   └─ userid: ${userid}`);
    console.log(`   └─ questionid: ${questionid}`);
    console.log(`   └─ pollid: ${pollid}`);
    console.log(`   └─ iscorrect: ${iscorrect} (type: ${typeof iscorrect})`);
    console.log(`   └─ selectedoption: ${selectedoption}`);
    console.log(`   └─ questionnumber: ${questionnumber}`);
    // Buscar o crear estadísticas de estudio para la materia
    let stats = await tx.studystats.findFirst({
      where: { userid, subject }
        });

    if (!stats) {
      stats = await tx.studystats.create({
        data: {
          id: generateUniqueId(),
          userid,
          subject,
          questionscompleted: "[]",
          totalquestions: 0,
          correctanswers: 0,
          currentstreak: 0,
          beststreak: 0,
          createdat: new Date(),
          updatedat: new Date()
        }
        });
    }

    // Actualizar estadísticas
    const newCorrectAnswers = stats.correctanswers + (iscorrect ? 1 : 0);
    const newTotalquestions = stats.totalquestions + 1;
    const newCurrentStreak = iscorrect ? stats.currentstreak + 1 : 0;
    
    // Evitar añadir duplicados - parsear JSON de forma segura
    const existingQuestions = StudySessionService.parseQuestionsCompleted(stats.questionscompleted || "[]", userid);
    const newQuestionsCompleted = Array.from(new Set([...existingQuestions, questionid]));

    await tx.studystats.update({
      where: { id: stats.id },
      data: {
        totalquestions: newTotalquestions,
        correctanswers: newCorrectAnswers,
        currentstreak: newCurrentStreak,
        beststreak: Math.max(stats.beststreak, newCurrentStreak),
        questionscompleted: JSON.stringify(newQuestionsCompleted),
        updatedat: new Date()
      }
        });

    // ESTRATEGIA MEJORADA: Buscar registro existente primero para debugging
    const existingResponse = await tx.studyresponse.findFirst({
      where: {
        userid,
        questionid,
        answeredat: null
      }
    });

    console.log(`🔍 BUSCANDO REGISTRO - userid: ${userid}, questionid: ${questionid}`);
    console.log(`📝 Registro encontrado:`, existingResponse ? { 
      id: existingResponse.id, 
      pollid: existingResponse.pollid, 
      answeredat: existingResponse.answeredAt 
    } : 'NO ENCONTRADO');

    let updateResult: any = { count: 0 };

    if (existingResponse) {
      // Actualizar el registro existente usando el ID específico
      updateResult = await tx.studyresponse.updateMany({
        where: {
          id: existingResponse.id, // Usar ID específico en lugar de criterios múltiples
          answeredat: null // Verificación adicional de seguridad
        },
        data: {
          pollid: pollid,
          selectedoption: selectedoption,
          iscorrect,
          responsetime,
          answeredat: new Date()
        }
        });
      
      console.log(`✅ ACTUALIZACIÓN EXITOSA - Registros actualizados: ${updateResult.count}`);
    } else {
      console.log(`⚠️ NO SE ENCONTRÓ REGISTRO PARA ACTUALIZAR - userid: ${userid}, questionid: ${questionid}`);
      
      // FALLBACK: Crear un nuevo registro si no se encontró uno existente
      // Esto asegura que la respuesta se registre independientemente
      console.log(`🔧 CREANDO REGISTRO FALLBACK para asegurar que la respuesta se registre`);
      
      try {
        const fallbackResponse = await tx.studyresponse.create({
          data: {
            sessionid: existingResponse?.sessionid || 'fallback',
            userid,
            subject,
            questionid,
            questionnumber,
            pollid,
            selectedoption,
            iscorrect,
            responsetime,
            answeredat: new Date()
        }
        });
        
        console.log(`✅ REGISTRO FALLBACK CREADO EXITOSAMENTE - ID: ${fallbackResponse.id}`);
        updateResult = { count: 1 }; // Simular éxito para logging
      } catch (fallbackError) {
        console.error(`❌ ERROR CREANDO REGISTRO FALLBACK:`, fallbackError);
      }
    }
    
    // Logging detallado del resultado
    console.log(`📊 RESULTADO FINAL - userid: ${userid}, questionid: ${questionid}, iscorrect: ${iscorrect}, registrosActualizados: ${updateResult.count}`);
    
    // 🚨 ALERTA SI TODAVÍA NO SE PROCESÓ CORRECTAMENTE
    if (updateResult.count === 0) {
      console.error(`❌ FALLO CRÍTICO: NO SE PUDO REGISTRAR LA RESPUESTA - userid: ${userid}, questionid: ${questionid}, pollid: ${pollid}`);
      
      // Debug adicional: Buscar TODOS los registros para este usuario/pregunta
      const allUserResponses = await tx.studyresponse.findMany({
        where: { userid, questionid },
        select: { id: true, pollid: true, answeredat: true, iscorrect: true, sessionid: true }
      });
      console.log(`🔍 TODOS los registros para userid ${userid} + questionid ${questionid}:`, allUserResponses);
      
      // Debug adicional: Buscar por pollid
      const pollResponses = await tx.studyresponse.findMany({
        where: { pollid },
        select: { id: true, userid: true, questionid: true, answeredat: true, iscorrect: true }
      });
      console.log(`🔍 TODOS los registros para pollid ${pollid}:`, pollResponses);
    }

    // Integración de Gamificación - Intentar pero no fallar si hay error
    try {
      const userResponseForGamification: UserResponse = {
        telegramuserid: userid, // userid ya es el telegramuserid en este contexto
        questionid,
        iscorrect,
        responsetime
        };
      await GamificationService._processUserResponseWithinTransaction(userResponseForGamification, tx);
      console.log(`✅ Gamificación procesada para usuario ${userid}`);
    } catch (error) {
      console.error('⚠️ Error en gamificación (no afecta al estudio):', error);
      // No relanzar el error para que no afecte al sistema de estudio
    }
  }

  /**
   * Reiniciar pool de preguntas para una materia
   */
  private async resetQuestionPool(userid: string, subject: string): Promise<void> {
    try {
      await prisma.studystats.update({
        where: { 
          userid_subject: { userid, subject } 
        },
        data: {
          questionscompleted: "[]"
        }
      });
    } catch (error) {
      console.error('Error reiniciando pool de preguntas:', error);
    }
  }

  /**
   * Limpiar metadatos de la pregunta (formato: // contenido :: más contenido ::)
   */
  private cleanQuestionMetadata(questionText: string): string {
    if (!questionText) return questionText;
    
    // Eliminar el patrón: // [contenido] :: [más contenido] ::
    // Usar greedy match (.*) para ir hasta el último "::" 
    // Ejemplo: "// Pregunta 3. Constitución Española ::Artículo 76.2::  ¿qué establece..."
    // Resultado: "¿qué establece..."
    const cleanedQuestion = questionText.replace(/^\/\/.*::\s*/, '').trim();
    
    return cleanedQuestion;
  }

  /**
   * Enviar poll de estudio a Telegram
   */
  private async sendStudyPoll(userid: string, questionData: any): Promise<{ success: boolean; pollid?: string }> {
    try {
      console.log(`📊 ENVIANDO POLL DE ESTUDIO - Usuario: ${userid}, Pregunta: ${questionData.id}`);

      // 🧹 LIMPIAR METADATOS ANTES DE USAR LA PREGUNTA
      const rawQuestion = questionData.question || 'Pregunta no disponible';
      const question = this.cleanQuestionMetadata(rawQuestion);
      
      // 🔍 DEBUG: Mostrar antes y después de la limpieza si hay cambios
      if (rawQuestion !== question) {
        console.log(`🧹 PREGUNTA LIMPIADA:`);
        console.log(`   📝 Antes: ${rawQuestion.substring(0, 100)}...`);
        console.log(`   ✨ Después: ${question.substring(0, 100)}...`);
      }
      
      // Las opciones pueden venir como array de strings o como string con formato especial
      let options: string[] = [];
      
      if (Array.isArray(questionData.options)) {
        // Limpiar opciones eliminando porcentajes al inicio (ej: "%100%texto" -> "texto")
        options = questionData.options.map((option: string) => {
          // Eliminar porcentajes al inicio como "%100%" o "%-33.33333%" incluyendo comillas
          return option.replace(/^["']?%-?\d+(\.\d+)?%["']?/g, '').replace(/["']$/g, '').trim();
        }).filter((option: string) => option && option.length > 0);
            } else if (typeof questionData.options === 'string') {
        // Parsear el formato especial {"opción1","opción2"}
        console.log(`🔧 Parseando formato especial de opciones para pregunta ${questionData.id}`);
        
        // Convertir {"opción1","opción2"} a ["opción1","opción2"]
        let optionsStr = questionData.options.trim();
        
        // Remover llaves externas
        if (optionsStr.startsWith('{') && optionsStr.endsWith('}')) {
          optionsStr = optionsStr.slice(1, -1);
        }
        
        // Dividir por comas que no estén dentro de comillas
        const regex = /"([^"]+)"/g;
        const matches: string[] = [];
        let match;
        
        while ((match = regex.exec(optionsStr)) !== null) {
          matches.push(match[1]);
        }
        
        if (matches.length > 0) {
          options = matches;
        } else {
          // Fallback: dividir por comas simples
          options = optionsStr.split(',').map(opt => opt.trim().replace(/^"(.*)"$/, '$1'));
        }
        
        // Limpiar opciones eliminando porcentajes al inicio incluyendo comillas
        options = options.map((option: string) => {
          return option.replace(/^["']?%-?\d+(\.\d+)?%["']?/g, '').replace(/["']$/g, '').trim();
        }).filter((option: string) => option && option.length > 0);
      }

      // Validar que tengamos al menos 2 opciones válidas (no vacías)
      const validOptions = options.filter(option => option && option.trim().length > 0);
      if (validOptions.length < 2) {
        console.error(`❌ Opciones insuficientes para la pregunta: ${questionData.id}`);
        console.error(`   📊 Total opciones: ${options.length}, Opciones válidas: ${validOptions.length}`);
        console.error(`   📝 Opciones originales:`, options);
        return { success: false };
      }
      
      // Usar solo las opciones válidas
      options = validOptions;

      // Truncar opciones que superen el límite de Telegram (100 caracteres por opción)
      const maxOptionLength = options.reduce((max, option) => Math.max(max, option.length), 0);
      if (maxOptionLength > 100) {
        console.log(`⚠️ OPCIONES LARGAS DETECTADAS: Opción más larga (${maxOptionLength} caracteres, máximo 100) - ID: ${questionData.id}`);
        console.log(`🔧 TRUNCANDO OPCIONES automáticamente para cumplir límites de Telegram`);
        
        // Truncar opciones largas automáticamente
        options = options.map((option, index) => {
          if (option.length > 100) {
            const truncated = option.substring(0, 97) + '...';
            console.log(`   📝 Opción ${index + 1}: ${option.length} → 100 caracteres`);
            return truncated;
          }
          return option;
        });
        
        console.log(`✅ OPCIONES TRUNCADAS: Pregunta ${questionData.id} ahora es compatible con Telegram`);
      }

      // El correctanswerindex ya viene 0-indexed desde la base de datos
      const originalCorrectIndex = questionData.correctanswerindex !== undefined ? 
        questionData.correctanswerindex : 0;

      // Randomizar opciones para evitar que la respuesta correcta siempre sea la A
      const optionsWithIndex = options.map((option: string, index: number) => ({
        option,
        originalIndex: index
      }));

      // Mezclar las opciones aleatoriamente
      const shuffledOptions = [...optionsWithIndex].sort(() => Math.random() - 0.5);
      
      // Encontrar la nueva posición de la respuesta correcta después del shuffle
      const newCorrectIndex = shuffledOptions.findIndex(
        item => item.originalIndex === originalCorrectIndex
      );

      // Extraer solo las opciones mezcladas para el poll
      const finalOptions = shuffledOptions.map(item => item.option);

      console.log('🎲 Opciones randomizadas:', {
        original: options,
        shuffled: finalOptions,
        originalCorrectIndex,
        newCorrectIndex,
        correctAnswer: finalOptions[newCorrectIndex]
      });

      // Formatear header con información de progreso
      const header = `🎯 PREGUNTA ${questionData.currentindex}/${questionData.totalquestions}\n` +
                    `📚 ${StudySessionService.getDisplayName(questionData.subject)}\n` +
                    `⏱️ Tiempo límite: 1 minuto\n\n`;

      const fullQuestion = this.truncatePollQuestion(header, question, 280);

      const pollData = {
        chat_id: userid,
        question: fullQuestion,
        options: JSON.stringify(finalOptions), // Usar opciones mezcladas
        type: 'quiz',
        correct_option_id: newCorrectIndex, // Usar nuevo índice después del shuffle
        is_anonymous: false,
        allows_multiple_answers: false,
        explanation: `✅ La respuesta correcta es: ${finalOptions[newCorrectIndex]}`,
        open_period: 60 // 1 minuto límite
      };

      const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
      if (!BOT_TOKEN) {
        console.error('❌ TELEGRAM_BOT_TOKEN no configurado');
        return { success: false };
      }

      const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPoll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(pollData)
        });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error enviando poll de estudio:', errorData);
        return { success: false };
      }

      const data = await response.json();
      const pollid = data.result.poll.id;

      // Actualizar el pollid en la respuesta si se proporcionó responseId
      if (questionData.responseId) {
        await prisma.studyresponse.update({
          where: { id: questionData.responseId },
          data: { pollid }
        });
      }

      // Crear mapping en base de datos para persistencia entre requests
      await prisma.telegrampollmapping.create({
        data: {
          id: generateUniqueId(),
          pollid,
          questionid: questionData.id,
          subject: questionData.subject
        }
      });

      // También mantener en memoria para compatibilidad
      if (!global.studyPollMappings) {
        global.studyPollMappings = new Map();
      }
      
      global.studyPollMappings.set(pollid, {
        questionid: questionData.id,
        subject: questionData.subject,
        correctanswerindex: newCorrectIndex,
        responseId: questionData.responseId,
        timestamp: Date.now(),
        processedOptions: finalOptions, // ✅ Almacenar opciones procesadas
        correctAnswer: finalOptions[newCorrectIndex] // ✅ Almacenar respuesta correcta procesada
      });

      console.log(`✅ Poll de estudio enviado - ID: ${pollid}`);
      return { success: true, pollid };

    } catch (error) {
      console.error('❌ Error enviando poll de estudio:', error);
      return { success: false };
    }
  }

  /**
   * Truncar pregunta para cumplir límites de Telegram
   */
  private truncatePollQuestion(header: string, question: string, maxLength: number = 300): string {
    const fullText = header + question;
    
    if (fullText.length <= maxLength) {
      return fullText;
    }
    
    // Calcular espacio disponible para la pregunta
    const availableSpace = maxLength - header.length - 3; // 3 para "..."
    
    if (availableSpace <= 0) {
      // Si el header es muy largo, truncar todo
      return fullText.substring(0, maxLength - 3) + '...';
    }
    
    // Truncar solo la pregunta
    const truncatedQuestion = question.substring(0, availableSpace) + '...';
    return header + truncatedQuestion;
  }

  /**
   * Cancelar sesión por comando /stop
   */
  async stopSession(userid: string): Promise<{ success: boolean; message: string }> {
    try {
      const session = await prisma.userstudysession.findFirst({
        where: { userid, status: 'active' }
      });

      if (!session) {
        return { success: false, message: '❌ No tienes ninguna sesión activa' };
      }

      await this.cancelSession(session.id);

      return { 
        success: true, 
        message: `🛑 **Sesión cancelada**\n\n📚 Materia: ${session.subject.toUpperCase()}\n📊 Progreso: ${session.currentindex}/${session.totalquestions}\n\n💡 Puedes iniciar una nueva sesión cuando quieras` 
      };

    } catch (error) {
      console.error('Error deteniendo sesión:', error);
      return { success: false, message: '❌ Error cancelando sesión' };
    }
  }

  private async cleanupOrphanedResponses(sessionid: string): Promise<void> {
    try {
      // Buscar registros de la sesión que nunca fueron completados
      // (no tienen answeredAt y no son timeouts legítimos)
      const orphanedResponses = await prisma.studyresponse.findMany({
        where: {
          sessionid: sessionid,
          answeredat: null,
          timedout: { not: true }, // No son timeouts legítimos
          createdat: {
            lte: new Date(Date.now() - 2 * 60 * 1000) // Creados hace más de 2 minutos
          }
        }
      });

      if (orphanedResponses.length > 0) {
        const deleteCount = await prisma.studyresponse.deleteMany({
          where: {
            id: {
              in: orphanedResponses.map(r => r.id)
            }
          }
        });

        console.log(`🧹 ${deleteCount.count} registros huérfanos eliminados de sesión ${sessionid}`);
        orphanedResponses.forEach(r => {
          console.log(`   - Registro huérfano: ${r.id} (pregunta: ${r.questionid})`);
        });
      } else {
        console.log(`✅ No se encontraron registros huérfanos en sesión ${sessionid}`);
      }
    } catch (error) {
      console.error('Error limpiando respuestas huérfanas:', error);
    }
  }

  private async cleanupUserSessions(userid: string): Promise<void> {
    try {
      // Primero obtener los IDs de las sesiones que vamos a eliminar
      const sessionsToDelete = await prisma.userstudysession.findMany({
        where: { userid },
        select: { id: true }
      });
      
      // Limpiar las referencias en global.randomQuestions antes de eliminar las sesiones
      if (global.randomQuestions && sessionsToDelete.length > 0) {
        sessionsToDelete.forEach(session => {
          if (global.randomQuestions[session.id]) {
            delete global.randomQuestions[session.id];
            console.log(`🧹 Limpiando preguntas aleatorias para sesión ${session.id}`);
          }
        });
      }
      
      // Ahora eliminar las sesiones de la base de datos
      const deletedCount = await prisma.userstudysession.deleteMany({
        where: { userid }
      });
      console.log(`🗑️ ${deletedCount.count} sesiones eliminadas para usuario ${userid}`);
    } catch (error) {
      console.error('Error limpiando sesiones:', error);
    }
  }

  private async getQuestions(subject: string, limit: number): Promise<StudyQuestion[]> {
    try {
      const tableName = StudySessionService.TABLE_MAPPING[subject];
      if (!tableName) {
        throw new Error(`Tabla no encontrada para materia: ${subject}`);
      }

      console.log(`🔍 [getQuestions] Buscando ${limit} preguntas en tabla ${tableName} para materia ${subject}`);

      // Construir query para obtener preguntas aleatorias
      const query = `
        SELECT id, questionnumber, question, options, correctanswerindex, category, difficulty
        FROM ${tableName} 
        WHERE isactive = true
        ORDER BY RAND()
        LIMIT ?
      `;

      const result = await prisma.$queryRawUnsafe(query, limit);
      const questions = result as any[];

      console.log(`📊 [getQuestions] Encontradas ${questions.length} preguntas en tabla ${tableName}`);

      if (questions.length === 0) {
        console.log(`❌ [getQuestions] No se encontraron preguntas activas en tabla ${tableName}`);
        return [];
      }

      // Convertir a formato StudyQuestion
      const studyQuestions: StudyQuestion[] = questions.map(q => ({
        id: q.id,
        questionnumber: q.questionnumber,
        question: q.question,
        options: q.options,
        correctanswerindex: q.correctanswerindex,
        category: q.category,
        difficulty: q.difficulty
      }));

      console.log(`✅ [getQuestions] ${studyQuestions.length} preguntas convertidas para ${subject}`);
      return studyQuestions;

    } catch (error) {
      console.error('Error obteniendo preguntas:', error);
      console.error('Subject:', subject);
      console.error('Limit:', limit);
      return [];
    }
  }
}

// Exportar instancia por defecto para facilitar el uso
export const studySessionService = new StudySessionService();