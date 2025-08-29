import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface LeaderboardEntry {
  id: string;
  firstname: string | null;
  lastname?: string | null;
  totalpoints: number;
  level: number;
  accuracy?: number;
  averageSpeed?: number;
  rank: number;
}

interface PlayerStats {
  id: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  totalPoints: number;
  level: number;
  averageResponseTime?: number;
  streakCurrent: number;
  streakBest: number;
  lastActivity?: Date;
}

class AdvancedRankingSystem {
  async getOverallLeaderboard(timeframe: string = 'ALL_TIME', limit: number = 50): Promise<LeaderboardEntry[]> {
    try {
      let whereClause = {};
      
      if (timeframe !== 'ALL_TIME') {
        const now = new Date();
        let startDate: Date;
        
        switch (timeframe) {
          case 'WEEKLY':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'MONTHLY':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case 'YEARLY':
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(0);
        }
        
        whereClause = {
          lastactivity: {
            gte: startDate
          }
        };
      }
      
      const users = await prisma.telegramuser.findMany({
        where: whereClause,
        orderBy: { totalpoints: 'desc' },
        take: limit,
        select: {
          id: true,
          firstname: true,
          lastname: true,
          totalpoints: true,
          level: true
        }
      });
      
      return users.map((user, index) => ({
        ...user,
        rank: index + 1
      }));
    } catch (error) {
      console.error('Error getting overall leaderboard:', error);
      return [];
    }
  }
  
  async getSpeedLeaderboard(timeframe: string = 'ALL_TIME', limit: number = 50): Promise<LeaderboardEntry[]> {
    try {
      // Para el ranking de velocidad, necesitaríamos calcular el tiempo promedio de respuesta
      // Por ahora, usamos el ranking general como base
      const users = await this.getOverallLeaderboard(timeframe, limit);
      
      // Aquí se podría implementar lógica específica para velocidad
      // basada en telegramresponse.answeredat vs createdat
      
      return users.map(user => ({
        ...user,
        averageSpeed: Math.random() * 30 + 5 // Placeholder: 5-35 segundos
      }));
    } catch (error) {
      console.error('Error getting speed leaderboard:', error);
      return [];
    }
  }
  
  async getAccuracyLeaderboard(timeframe: string = 'ALL_TIME', limit: number = 50): Promise<LeaderboardEntry[]> {
    try {
      let whereClause = {};
      
      if (timeframe !== 'ALL_TIME') {
        const now = new Date();
        let startDate: Date;
        
        switch (timeframe) {
          case 'WEEKLY':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'MONTHLY':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case 'YEARLY':
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(0);
        }
        
        whereClause = {
          answeredat: {
            gte: startDate
          }
        };
      }
      
      // Calcular precisión basada en respuestas correctas vs totales
      const userAccuracy = await prisma.$queryRaw`
        SELECT 
          tu.userid,
          tu.firstname,
          tu.lastname,
          tu.totalpoints,
          tu.level,
          COUNT(tr.id) as total_responses,
          SUM(CASE WHEN tr.iscorrect = 1 THEN 1 ELSE 0 END) as correct_responses,
          CASE 
            WHEN COUNT(tr.id) > 0 THEN 
              (SUM(CASE WHEN tr.iscorrect = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(tr.id))
            ELSE 0 
          END as accuracy
        FROM telegramuser tu
        LEFT JOIN telegramresponse tr ON tu.id = tr.userid
        ${timeframe !== 'ALL_TIME' ? 'WHERE tr.answeredat >= ?' : ''}
        GROUP BY tu.id, tu.firstname, tu.lastname, tu.totalpoints, tu.level
        HAVING COUNT(tr.id) >= 5
        ORDER BY accuracy DESC, tu.totalpoints DESC
        LIMIT ?
      ` as any[];
      
      return userAccuracy.map((user, index) => ({
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        totalpoints: user.totalpoints,
        level: user.level,
        accuracy: Math.round(user.accuracy * 100) / 100,
        rank: index + 1
      }));
    } catch (error) {
      console.error('Error getting accuracy leaderboard:', error);
      return [];
    }
  }
  
  async getPlayerHistoricalStats(id: string): Promise<PlayerStats | null> {
    try {
      const user = await prisma.telegramuser.findUnique({
        where: { id },
        select: {
          id: true,
          totalpoints: true,
          level: true,
          lastactivity: true
        }
      });
      
      if (!user) {
        return null;
      }
      
      // Obtener estadísticas de respuestas
      const responses = await prisma.telegramresponse.findMany({
        where: { userid: user.id },
        orderBy: { answeredat: 'desc' }
      });
      
      const totalQuestions = responses.length;
      const correctAnswers = responses.filter(r => r.iscorrect).length;
      const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
      
      // Calcular rachas
      let currentStreak = 0;
      let bestStreak = 0;
      let tempStreak = 0;
      
      for (let i = 0; i < responses.length; i++) {
        if (responses[i].iscorrect) {
          tempStreak++;
          if (i === 0) currentStreak = tempStreak;
        } else {
          if (i === 0) currentStreak = 0;
          bestStreak = Math.max(bestStreak, tempStreak);
          tempStreak = 0;
        }
      }
      bestStreak = Math.max(bestStreak, tempStreak);
      
      return {
        id: user.id,
        totalQuestions,
        correctAnswers,
        accuracy: Math.round(accuracy * 100) / 100,
        totalPoints: user.totalpoints,
        level: user.level,
        streakCurrent: currentStreak,
        streakBest: bestStreak,
        lastActivity: user.lastactivity
      };
    } catch (error) {
      console.error('Error getting player historical stats:', error);
      return null;
    }
  }
  
  async updatePlayerRanking(id: string, points: number): Promise<boolean> {
    try {
      await prisma.telegramuser.update({
        where: { id },
        data: {
          totalpoints: {
            increment: points
          },
          lastactivity: new Date()
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error updating player ranking:', error);
      return false;
    }
  }
  
  async getWeeklyLeaderboard(limit: number = 50): Promise<LeaderboardEntry[]> {
    return this.getOverallLeaderboard('WEEKLY', limit);
  }
  
  async getMonthlyLeaderboard(limit: number = 50): Promise<LeaderboardEntry[]> {
    return this.getOverallLeaderboard('MONTHLY', limit);
  }
}

// Factory function para crear instancia del sistema de ranking
export function createRankingSystem(): AdvancedRankingSystem {
  return new AdvancedRankingSystem();
}

export default AdvancedRankingSystem;
export type { LeaderboardEntry, PlayerStats };