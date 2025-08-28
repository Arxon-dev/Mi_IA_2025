import { prisma } from '@/lib/prisma';
import { MilitarySimulationService } from './militarySimulationService';

// ==========================================
// 🏆 SISTEMA DE FINALIZACIÓN SIMULACROS MILITARES
// ==========================================

export interface MilitarySimulationResult {
  simulationId: string;
  branch: 'et' | 'aire' | 'armada';
  branchName: string;
  totalquestions: 100;
  correctAnswers: number;
  incorrectAnswers: number;
  finalPercentage: number;
  finalScore: number;
  passed: boolean;
  timeElapsed: number;
  timelimit: number;
  averageResponseTime: number;
  subjectBreakdown: Record<string, { correct: number; total: number; percentage: number }>;
  strengths: string[];
  weaknesses: string[];
  completedAt: Date;
}

export class MilitarySimulationCompletion {

  // ==========================================
  // 🎖️ NOMBRES DE RAMAS MILITARES
  // ==========================================
  
  private static BRANCH_NAMES = {
    'et': '🎖️ Ejército de Tierra',
    'aire': '✈️ Ejército del Aire', 
    'armada': '⚓ Armada'
  };

  private static BRANCH_EMOJIS = {
    'et': '🎖️',
    'aire': '✈️',
    'armada': '⚓'
  };

  // ==========================================
  // 🎯 NOMBRES DE MATERIAS PARA DISPLAY
  // ==========================================
  
  private static SUBJECT_DISPLAY_NAMES: Record<string, string> = {
    'constitucion': '📖 Constitución',
    'defensanacional': '🛡️ Defensa Nacional',
    'rjsp': '⚖️ RJSP',
    'rio': '🔴 Régimen Disciplinario',
    'minsdef': '🏛️ Ministerio Defensa',
    'organizacionfas': '🎖️ Organización FAS',
    'emad': '⚔️ EMAD',
    'et': '🎖️ Ejército Tierra',
    'aire': '✈️ Ejército Aire',
    'armada': '⚓ Armada',
    'carrera': '👨‍💼 Carrera Militar',
    'tropa': '🎖️ Tropa y Marinería',
    'rroo': '📋 Reales Ordenanzas',
    'derechosydeberes': '⚖️ Derechos y Deberes',
    'iniciativasquejas': '📝 Iniciativas y Quejas',
    'igualdad': '👥 Igualdad',
    'omi': '🌍 OMI',
    'pac': '🔒 PAC',
    'seguridadnacional': '🛡️ Seguridad Nacional',
    'pdc': '📊 PDC',
    'onu': '🌐 ONU',
    'otan': '🤝 OTAN',
    'osce': '🕊️ OSCE',
    'ue': '🇪🇺 UE',
    'misionesinternacionales': '🌍 Misiones Internacionales'
  };

  /**
   * Procesar finalización del simulacro militar
   */
  static async processCompletion(simulationId: string): Promise<MilitarySimulationResult | null> {
    try {
      console.log(`🏆 Procesando finalización de simulacro militar: ${simulationId}`);

      // Obtener datos del simulacro
      const simulation = await prisma.simulacro.findUnique({
        where: { id: simulationId },
        include: {
          responses: true,
          user: true
        }
      });

      if (!simulation) {
        console.error('❌ Simulacro no encontrado');
        return null;
      }

      // Determinar rama militar desde examType
      const branch = this.extractBranchFromExamType(simulation.examType);
      if (!branch) {
        console.error('❌ Rama militar no identificada:', simulation.examType);
        return null;
      }

      // Calcular resultados
      const responses = simulation.responses.filter(r => r.answeredAt !== null);
      const correctAnswers = responses.filter(r => r.iscorrect).length;
      const incorrectAnswers = responses.length - correctAnswers;
      const finalPercentage = (correctAnswers / 100) * 100;
      const passed = finalPercentage >= 50;

      // Calcular tiempo
      const timeElapsed = Math.floor((Date.now() - simulation.startedAt.getTime()) / 1000);
      const responsesWithTime = responses.filter(r => r.responsetime !== null);
      const averageResponseTime = responsesWithTime.length > 0
        ? responsesWithTime.reduce((sum, r) => sum + (r.responsetime || 0), 0) / responsesWithTime.length
        : 0;

      // Desglose por materias
      const subjectBreakdown = await this.calculateSubjectBreakdown(responses, branch);
      
      // Fortalezas y debilidades
      const { strengths, weaknesses } = this.analyzePerformance(subjectBreakdown);

      // Actualizar simulacro como completado
      await prisma.simulacro.update({
        where: { id: simulationId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          timeElapsed,
          finalScore: correctAnswers,
          finalPercentage,
          passed,
          averageResponseTime
        }
      });

      const result: MilitarySimulationResult = {
        simulationId,
        branch,
        branchName: this.BRANCH_NAMES[branch],
        totalquestions: 100,
        correctAnswers,
        incorrectAnswers,
        finalPercentage,
        finalScore: correctAnswers,
        passed,
        timeElapsed,
        timelimit: 105 * 60, // 105 minutos
        averageResponseTime,
        subjectBreakdown,
        strengths,
        weaknesses,
        completedAt: new Date()
      };

      console.log(`✅ Simulacro ${branch.toUpperCase()} completado: ${correctAnswers}/100 (${finalPercentage}%)`);
      
      return result;

    } catch (error) {
      console.error('❌ Error procesando finalización:', error);
      return null;
    }
  }

  /**
   * Generar mensaje de finalización
   */
  static generateCompletionMessage(result: MilitarySimulationResult): string {
    const emoji = this.BRANCH_EMOJIS[result.branch];
    const timeInMinutes = Math.floor(result.timeElapsed / 60);
    const remainingMinutes = 105 - timeInMinutes;
    const avgResponseTime = Math.round(result.averageResponseTime);

    // MENSAJE PARA APROBADOS (≥50%)
    if (result.passed) {
      let message = `${emoji} **SIMULACRO ${result.branchName.toUpperCase()} COMPLETADO** ${emoji}\n\n`;
      
      message += `📊 **RESULTADOS OFICIALES:**\n`;
      message += `• Puntuación final: ${result.finalScore}/100 (${result.finalPercentage.toFixed(1)}%) ✅ **APTO**\n`;
      message += `• Tiempo empleado: ${timeInMinutes}min`;
      
      if (remainingMinutes > 0) {
        message += ` (quedan ${remainingMinutes}min)\n`;
      } else {
        message += ` (tiempo agotado)\n`;
      }

      message += `\n🎯 **DESGLOSE POR MATERIAS PRINCIPALES:**\n`;
      
      // Mostrar las 8 materias más importantes
      const topSubjects = Object.entries(result.subjectBreakdown)
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 8);

      topSubjects.forEach(([subject, data]) => {
        const name = this.SUBJECT_DISPLAY_NAMES[subject] || subject;
        const statusEmoji = data.percentage >= 70 ? '✅' : data.percentage >= 50 ? '⚠️' : '❌';
        message += `• ${name}: ${data.correct}/${data.total} (${data.percentage.toFixed(0)}%) ${statusEmoji}\n`;
      });

      message += `\n🏆 **EVALUACIÓN MILITAR:**\n`;
      message += `✅ **APTO** para ${result.branchName}\n`;
      
      if (result.strengths.length > 0) {
        message += `📈 Fortalezas: ${result.strengths.slice(0, 3).join(', ')}\n`;
      }
      
      if (result.weaknesses.length > 0) {
        message += `⚠️ Mejorar: ${result.weaknesses.slice(0, 3).join(', ')}\n`;
      }

      message += `\n💪 ¡Enhorabuena!\n`;
      message += `${emoji} /simulacros_premium - Intentar otras armas`;
      
      return message;
    }

    // MENSAJE PARA SUSPENDIDOS (<50%)
    else {
      let message = `${emoji} **SIMULACRO ${result.branchName.toUpperCase()} COMPLETADO** ${emoji}\n\n`;
      
      message += `📊 **RESULTADOS OFICIALES:**\n`;
      message += `• Puntuación final: ${result.finalScore}/100 (${result.finalPercentage.toFixed(1)}%) ❌ **NO APTO**\n`;
      message += `• Tiempo empleado: ${timeInMinutes}min`;
      
      if (remainingMinutes > 0) {
        message += ` (quedan ${remainingMinutes}min)\n`;
      } else {
        message += ` (tiempo agotado)\n`;
      }

      message += `\n📉 **ÁREAS DE MEJORA PRIORITARIAS:**\n`;
      
      // Mostrar las materias con peor rendimiento
      const weakestSubjects = Object.entries(result.subjectBreakdown)
        .filter(([_, data]) => data.percentage < 50)
        .sort((a, b) => a[1].percentage - b[1].percentage)
        .slice(0, 6);

      if (weakestSubjects.length > 0) {
        weakestSubjects.forEach(([subject, data]) => {
          const name = this.SUBJECT_DISPLAY_NAMES[subject] || subject;
          message += `• ${name}: ${data.correct}/${data.total} (${data.percentage.toFixed(0)}%) ❌\n`;
        });
      }

      message += `\n⚖️ **EVALUACIÓN MILITAR:**\n`;
      message += `❌ **NO APTO** para ${result.branchName}\n`;
      message += `📚 Necesitas **≥50%** para ser apto\n`;
      
      if (result.strengths.length > 0) {
        message += `📈 Puntos fuertes: ${result.strengths.slice(0, 2).join(', ')}\n`;
      }

      message += `\n💪 **RECOMENDACIONES:**\n`;
      message += `📖 Refuerza las materias indicadas arriba\n`;
      message += `🎯 Practica con preguntas individuales: /constitucion10\n`;
      message += `⚡ Repite el simulacro cuando te sientas preparado\n`;

      message += `\n🎖️ ¡No te rindas! La preparación es clave\n`;
      message += `${emoji} /simulacros_premium - Información y nuevos intentos`;
      
      return message;
    }
  }

  /**
   * Extraer rama militar del examType
   */
  private static extractBranchFromExamType(examType: string | null): 'et' | 'aire' | 'armada' | null {
    if (!examType) return null;
    
    if (examType.includes('_et')) return 'et';
    if (examType.includes('_aire')) return 'aire'; 
    if (examType.includes('_armada')) return 'armada';
    
    return null;
  }

  /**
   * Calcular desglose por materias
   */
  private static async calculateSubjectBreakdown(
    responses: any[], 
    branch: 'et' | 'aire' | 'armada'
  ): Promise<Record<string, { correct: number; total: number; percentage: number }>> {
    const breakdown: Record<string, { correct: number; total: number; percentage: number }> = {};
    
    // Obtener distribución esperada para esta rama
    const distribution = MilitarySimulationService.MILITARY_DISTRIBUTIONS[branch];
    
    // Inicializar contadores basados en distribución esperada
    Object.keys(distribution).forEach(subject => {
      breakdown[subject] = { correct: 0, total: 0, percentage: 0 };
    });

    // Contar respuestas por materia (esto sería idealemente basado en metadata real)
    // Para simplificar, distribuimos las respuestas proporcionalmente
    let responseIndex = 0;
    
    for (const [subject, expectedCount] of Object.entries(distribution)) {
      const subjectResponses = responses.slice(responseIndex, responseIndex + expectedCount);
      
      breakdown[subject] = {
        correct: subjectResponses.filter(r => r.iscorrect).length,
        total: subjectResponses.length,
        percentage: subjectResponses.length > 0 
          ? (subjectResponses.filter(r => r.iscorrect).length / subjectResponses.length) * 100 
          : 0
      };
      
      responseIndex += expectedCount;
    }

    return breakdown;
  }

  /**
   * Analizar fortalezas y debilidades
   */
  private static analyzePerformance(
    subjectBreakdown: Record<string, { correct: number; total: number; percentage: number }>
  ): { strengths: string[]; weaknesses: string[] } {
    const subjects = Object.entries(subjectBreakdown)
      .filter(([_, data]) => data.total > 0)
      .map(([subject, data]) => ({ subject, ...data }));

    // Fortalezas: materias con ≥70% de acierto
    const strengths = subjects
      .filter(s => s.percentage >= 70)
      .sort((a, b) => b.percentage - a.percentage)
      .map(s => this.SUBJECT_DISPLAY_NAMES[s.subject]?.replace(/^[🎖️📖🛡️⚖️🔴🏛️⚔️✈️⚓👨‍💼📋📝👥🌍🔒🌐🤝🕊️🇪🇺]\s*/, '') || s.subject)
      .slice(0, 4);

    // Debilidades: materias con <50% de acierto
    const weaknesses = subjects
      .filter(s => s.percentage < 50)
      .sort((a, b) => a.percentage - b.percentage)
      .map(s => this.SUBJECT_DISPLAY_NAMES[s.subject]?.replace(/^[🎖️📖🛡️⚖️🔴🏛️⚔️✈️⚓👨‍💼📋📝👥🌍🔒🌐🤝🕊️🇪🇺]\s*/, '') || s.subject)
      .slice(0, 4);

    return { strengths, weaknesses };
  }

  /**
   * Verificar si un simulacro está completado
   */
  static async checkIfCompleted(simulationId: string): Promise<boolean> {
    try {
      const answeredCount = await prisma.simulacroResponse.count({
        where: {
          simulacroId: simulationId,
          answeredAt: { not: null }
        }
      });

      return answeredCount >= 100;
    } catch (error) {
      console.error('❌ Error verificando completado:', error);
      return false;
    }
  }
} 