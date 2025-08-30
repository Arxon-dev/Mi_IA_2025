import { prisma } from '@/lib/prisma';

export interface ExamRankingEntry {
  rank: number;
  user: {
    telegramuserid: string;
    username?: string;
    firstName?: string;
  };
  totalquestions: number;
  correctAnswers: number;
  accuracy: number;
  averageTime: number;
  lastAttempt: Date;
}

export interface ExamComparison {
  exam2018: {
    attempted: boolean;
    totalquestions: number;
    correctAnswers: number;
    accuracy: number;
    averageTime: number;
    rank?: number;
    lastAttempt?: Date;
  };
  exam2024: {
    attempted: boolean;
    totalquestions: number;
    correctAnswers: number;
    accuracy: number;
    averageTime: number;
    rank?: number;
    lastAttempt?: Date;
  };
  overall: {
    improvement: number;
    strongerExam: '2018' | '2024' | 'equal';
    totalquestions: number;
    globalAccuracy: number;
  };
}

export class ExamRankingService {
  
  /**
   * Obtiene el ranking específico del examen oficial 2018
   */
  static async getExam2018Ranking(limit: number = 10): Promise<ExamRankingEntry[]> {
    const examResponses = await prisma.simulacroresponse.findMany({
      where: {
        examtype: 'EXAMEN_2018'
      },
      include: {
        simulacro: {
          // include removed for MySQL compatibility
        }
      }
    });

    // Agrupar por usuario
    const userStats = new Map<string, {
      user: any;
      totalquestions: number;
      correctAnswers: number;
      totalTime: number;
      lastAttempt: Date;
    }>();

    examResponses.forEach(response => {
      const userid = response.simulacroid;
      
      if (!userStats.has(userid)) {
        userStats.set(userid, {
          user: response.simulacroid,
          totalquestions: 0,
          correctAnswers: 0,
          totalTime: 0,
          lastAttempt: response.answeredat || response.createdat
        });
      }

      const stats = userStats.get(userid)!;
      stats.totalquestions++;
      if (response.iscorrect) stats.correctAnswers++;
      if (response.responsetime) stats.totalTime += response.responsetime;
      const responseDate = response.answeredat || response.createdat;
      if (responseDate > stats.lastAttempt) stats.lastAttempt = responseDate;
    });

    // Convertir a ranking
    const rankings: ExamRankingEntry[] = Array.from(userStats.values())
      .map(stats => ({
        rank: 0, // Se asignará después
        user: {
          telegramuserid: stats.user.telegramuserid,
          username: stats.user.username,
          firstname: stats.user.firstname
        },
        totalquestions: stats.totalquestions,
        correctAnswers: stats.correctAnswers,
        accuracy: stats.totalquestions > 0 ? (stats.correctAnswers / stats.totalquestions) * 100 : 0,
        averageTime: stats.totalquestions > 0 ? stats.totalTime / stats.totalquestions : 0,
        lastAttempt: stats.lastAttempt
      }))
      .sort((a, b) => {
        // Ordenar por accuracy desc, luego por total questions desc, luego por tiempo promedio asc
        if (Math.abs(a.accuracy - b.accuracy) > 0.1) return b.accuracy - a.accuracy;
        if (a.totalquestions !== b.totalquestions) return b.totalquestions - a.totalquestions;
        return a.averageTime - b.averageTime;
      })
      .slice(0, limit);

    // Asignar rankings
    rankings.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return rankings;
  }

  /**
   * Obtiene el ranking específico del examen oficial 2024
   */
  static async getExam2024Ranking(limit: number = 10): Promise<ExamRankingEntry[]> {
    const examResponses = await prisma.simulacroresponse.findMany({
      where: {
        examtype: 'EXAMEN_2024'
      },
      include: {
        simulacro: {
          // include removed for MySQL compatibility
        }
      }
    });

    // Agrupar por usuario (misma lógica que 2018)
    const userStats = new Map<string, {
      user: any;
      totalquestions: number;
      correctAnswers: number;
      totalTime: number;
      lastAttempt: Date;
    }>();

    examResponses.forEach((response: any) => {
      const userid = response.simulacroid;
      
      if (!userStats.has(userid)) {
        userStats.set(userid, {
          user: response.simulacroid,
          totalquestions: 0,
          correctAnswers: 0,
          totalTime: 0,
          lastAttempt: response.answeredat || response.createdat
        });
      }

      const stats = userStats.get(userid)!;
      stats.totalquestions++;
      if (response.iscorrect) stats.correctAnswers++;
      if (response.responsetime) stats.totalTime += response.responsetime;
      const responseDate = response.answeredat || response.createdat;
      if (responseDate > stats.lastAttempt) stats.lastAttempt = responseDate;
    });

    // Convertir a ranking
    const rankings: ExamRankingEntry[] = Array.from(userStats.values())
      .map(stats => ({
        rank: 0,
        user: {
          telegramuserid: stats.user.telegramuserid,
          username: stats.user.username,
          firstname: stats.user.firstname
        },
        totalquestions: stats.totalquestions,
        correctAnswers: stats.correctAnswers,
        accuracy: stats.totalquestions > 0 ? (stats.correctAnswers / stats.totalquestions) * 100 : 0,
        averageTime: stats.totalquestions > 0 ? stats.totalTime / stats.totalquestions : 0,
        lastAttempt: stats.lastAttempt
      }))
      .sort((a, b) => {
        if (Math.abs(a.accuracy - b.accuracy) > 0.1) return b.accuracy - a.accuracy;
        if (a.totalquestions !== b.totalquestions) return b.totalquestions - a.totalquestions;
        return a.averageTime - b.averageTime;
      })
      .slice(0, limit);

    // Asignar rankings
    rankings.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return rankings;
  }

  /**
   * Obtiene la comparativa personal de un usuario entre ambos exámenes
   */
  static async getUserExamComparison(telegramuserid: string): Promise<ExamComparison> {
    // Obtener respuestas del examen 2018
    const exam2018Responses = await prisma.simulacroresponse.findMany({
      where: {
        examtype: 'EXAMEN_2018',
        simulacroid: telegramuserid
      },
      include: {
        simulacro: {
          // include removed for MySQL compatibility
        }
      }
    });

    // Obtener respuestas del examen 2024
    const exam2024Responses = await prisma.simulacroresponse.findMany({
      where: {
        examtype: 'EXAMEN_2024',
        simulacroid: telegramuserid
      },
      include: {
        simulacro: {
          // include removed for MySQL compatibility
        }
      }
    });

    // Calcular stats para 2018
    const exam2018Stats = this.calculateExamStats(exam2018Responses);
    
    // Calcular stats para 2024
    const exam2024Stats = this.calculateExamStats(exam2024Responses);

    // Obtener rankings
    const ranking2018 = await this.getExam2018Ranking(100);
    const ranking2024 = await this.getExam2024Ranking(100);
    
    const userRank2018 = ranking2018.find(r => r.user.telegramuserid === telegramuserid)?.rank;
    const userRank2024 = ranking2024.find(r => r.user.telegramuserid === telegramuserid)?.rank;

    // Calcular comparativa general
    const improvement = exam2024Stats.accuracy - exam2018Stats.accuracy;
    const strongerExam = Math.abs(improvement) < 1 ? 'equal' : 
                       improvement > 0 ? '2024' : '2018';

    return {
      exam2018: {
        attempted: exam2018Stats.attempted,
        totalquestions: exam2018Stats.totalquestions,
        correctAnswers: exam2018Stats.correctAnswers,
        accuracy: exam2018Stats.accuracy,
        averageTime: exam2018Stats.averageTime,
        rank: userRank2018,
        lastAttempt: exam2018Stats.lastAttempt
      },
      exam2024: {
        attempted: exam2024Stats.attempted,
        totalquestions: exam2024Stats.totalquestions,
        correctAnswers: exam2024Stats.correctAnswers,
        accuracy: exam2024Stats.accuracy,
        averageTime: exam2024Stats.averageTime,
        rank: userRank2024,
        lastAttempt: exam2024Stats.lastAttempt
      },
      overall: {
        improvement,
        strongerExam,
        totalquestions: exam2018Stats.totalquestions + exam2024Stats.totalquestions,
        globalAccuracy: (exam2018Stats.totalquestions + exam2024Stats.totalquestions) > 0 ? 
          ((exam2018Stats.correctAnswers + exam2024Stats.correctAnswers) / 
           (exam2018Stats.totalquestions + exam2024Stats.totalquestions)) * 100 : 0
      }
    };
  }

  /**
   * Calcula estadísticas de un examen específico
   */
  private static calculateExamStats(responses: any[]): {
    attempted: boolean;
    totalquestions: number;
    correctAnswers: number;
    accuracy: number;
    averageTime: number;
    lastAttempt?: Date;
  } {
    if (responses.length === 0) {
      return {
        attempted: false,
        totalquestions: 0,
        correctAnswers: 0,
        accuracy: 0,
        averageTime: 0
      };
    }

    const totalQuestions = responses.length;
    const correctAnswers = responses.filter(r => r.iscorrect).length;
    const accuracy = (correctAnswers / totalQuestions) * 100;
    const totalTime = responses.reduce((sum, r) => sum + (r.responsetime || 0), 0);
    const averageTime = totalTime / totalQuestions;
    const lastAttempt = new Date(Math.max(...responses.map(r => new Date(r.answeredAt || r.createdAt).getTime())));

    return {
      attempted: true,
      totalquestions: totalQuestions,
      correctAnswers,
      accuracy,
      averageTime,
      lastAttempt
    };
  }
}