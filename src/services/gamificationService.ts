import { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ log: ['query', 'error', 'warn'] });
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export interface TelegramUserStats {
  telegramuserid: string;
  username?: string;
  firstName?: string;
  totalpoints: number;
  level: number;
  streak: number;
  bestStreak: number;
  totalResponses: number;
  correctResponses: number;
  accuracy: number;
  rank: number;
  lastActivity?: Date;
}

export interface LeaderboardEntry {
  rank: number;
  user: {
    telegramuserid: string;
    username?: string;
    firstName?: string;
  };
  points: number;
  level: number;
  streak: number;
}

export interface UserResponse {
  telegramuserid: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  questionid: string;
  telegramMsgId?: string;
  iscorrect: boolean;
  responsetime?: number;
}

export class GamificationService {
  /**
   * Procesa la respuesta de un usuario y actualiza su progreso
   * @param response La respuesta del usuario
   */
  static async processUserResponse(response: UserResponse): Promise<TelegramUserStats> {
    // Variables para usar fuera de la transacción
    let user: any = null;
    let telegramResponse: any = null;
    let updatedUser: any = null;
    
    // 1. Solo las queries críticas dentro de la transacción con timeout aumentado
    await prisma.$transaction(async (tx) => {
      user = await tx.telegramuser.findUnique({ 
        where: { telegramuserid: response.telegramuserid } 
      });
      
      if (!user) {
        const userid = `user_${response.telegramuserid}_${Date.now()}`;
        user = await tx.telegramuser.create({
          data: {
            id: userid,
            telegramuserid: response.telegramuserid,
            username: response.username,
            firstname: response.firstName,
            lastname: response.lastName,
            lastactivity: new Date(),
            totalpoints: 0,
            level: 1,
            streak: 0,
            beststreak: 0,
          },
        });
      }
      
      const responseId = `response_${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      telegramResponse = await tx.telegramresponse.create({
        data: {
          id: responseId,
          userid: user.id,
          questionid: response.questionid,
          telegrammsgid: response.telegramMsgId,
          iscorrect: response.iscorrect,
          responsetime: response.responsetime,
          answeredat: new Date(),
          points: 0, // Se calculará fuera
        },
      });
      // Solo guardar la respuesta y el usuario, el resto fuera
    }, {
      timeout: 15000, // Aumentar timeout a 15 segundos
    });
    
    // 2. Calcular puntos, actualizar usuario y estadísticas fuera de la transacción
    const pointsToAdd = this.calculatePointsWithPenalty(response.iscorrect, user.level);
    
    updatedUser = await prisma.telegramuser.update({
      where: { id: user.id },
      data: {
        totalpoints: Math.max(0, user.totalpoints + pointsToAdd),
        level: this.calculateLevel(user.totalpoints + pointsToAdd),
        streak: response.iscorrect ? user.streak + 1 : 0,
        beststreak: Math.max(user.beststreak, response.iscorrect ? user.streak + 1 : 0),
        lastactivity: new Date(),
      },
    });
    
    // Actualizar puntos en la respuesta
    await prisma.telegramresponse.update({
      where: { id: telegramResponse.id },
      data: { points: pointsToAdd },
    });
    
    // Obtener estadísticas completas fuera de la transacción
    const responses = await prisma.telegramresponse.findMany({ 
      where: { userid: user.id } 
    });
    const totalResponses = responses.length;
    const correctResponses = responses.filter(r => r.iscorrect).length;
    const accuracy = totalResponses > 0 ? (correctResponses / totalResponses) * 100 : 0;
    
    // Calcular ranking fuera de la transacción
    const rank = await this.getUserRank(response.telegramuserid);
    
    // 🔧 FIX: Verificar y desbloquear logros fuera de la transacción
    await this.checkAndUnlockAchievementsAsync(user.id.toString(), updatedUser);
    
    return {
      telegramuserid: updatedUser.telegramuserid,
      username: updatedUser.username || undefined,
      firstName: updatedUser.firstname || undefined,
      totalpoints: updatedUser.totalpoints,
      level: updatedUser.level,
      streak: updatedUser.streak,
      bestStreak: updatedUser.beststreak,
      totalResponses,
      correctResponses,
      accuracy,
      rank,
      lastActivity: updatedUser.lastactivity || undefined,
    };
  }

  /**
   * Lógica interna para procesar la respuesta de un usuario dentro de una transacción existente.
   * @param response La respuesta del usuario.
   * @param tx El cliente de la transacción de Prisma.
   */
  static async _processUserResponseWithinTransaction(
    response: UserResponse,
    tx: TransactionClient
  ): Promise<TelegramUserStats> {
    // 1. Buscar o crear usuario
    let user = await tx.telegramuser.findUnique({
      where: { telegramuserid: response.telegramuserid },
    });

    if (!user) {
      // Generar un ID único para el usuario
      const userid = `user_${response.telegramuserid}_${Date.now()}`;
      
      user = await tx.telegramuser.create({
        data: {
          id: userid,
          telegramuserid: response.telegramuserid,
          username: response.username,
          firstname: response.firstName,
          lastname: response.lastName,
          lastactivity: new Date(),
          totalpoints: 0,
          level: 1,
          streak: 0,
          beststreak: 0,
        },
      });
    }

    // 2. Guardar la respuesta
    const responseId = `response_${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 🔧 FIX: Calcular puntos con penalización ANTES de guardar la respuesta
    const pointsToAdd = this.calculatePointsWithPenalty(response.iscorrect, user.level);
    
    const telegramResponse = await tx.telegramresponse.create({
      data: {
        id: responseId,
        userid: user.id,
        questionid: response.questionid,
        telegrammsgid: response.telegramMsgId,
        iscorrect: response.iscorrect,
        responsetime: response.responsetime,
        answeredat: new Date(),
        points: pointsToAdd, // 🔧 FIX: Usar puntos con penalización real
      },
    });

    // 3. Actualizar estadísticas del usuario
    // 🔧 FIX: Implementar sistema de penalización por nivel
    const newStreak = response.iscorrect ? user.streak + 1 : 0;
    const newBestStreak = Math.max(user.beststreak, newStreak);
    const newTotalPoints = Math.max(0, user.totalpoints + pointsToAdd); // Evitar puntos negativos
    const newLevel = this.calculateLevel(newTotalPoints);

    const updatedUser = await tx.telegramuser.update({
      where: { id: user.id },
      data: {
        totalpoints: newTotalPoints,
        level: newLevel,
        streak: newStreak,
        beststreak: newBestStreak,
        lastactivity: new Date(),
      },
    });

    // 4. Obtener estadísticas completas
    const responses = await tx.telegramresponse.findMany({
      where: { userid: user.id }
    });

    const totalResponses = responses.length;
    const correctResponses = responses.filter(r => r.iscorrect).length;
    const accuracy = totalResponses > 0 ? (correctResponses / totalResponses) * 100 : 0;

    // 5. Calcular ranking
    const rank = await this.getUserRank(response.telegramuserid);

    // 6. Verificar y desbloquear logros
    await this.checkAndUnlockAchievementsAsync(user.id.toString(), updatedUser);

    return {
      telegramuserid: updatedUser.telegramuserid,
      username: updatedUser.username || undefined,
      firstName: updatedUser.firstname || undefined,
      totalpoints: updatedUser.totalpoints,
      level: updatedUser.level,
      streak: updatedUser.streak,
      bestStreak: updatedUser.beststreak,
      totalResponses,
      correctResponses,
      accuracy,
      rank,
      lastActivity: updatedUser.lastactivity || undefined,
    };
  }

  /**
   * Calcula el nivel basado en los puntos totales
   */
  static calculateLevel(points: number): number {
    if (points < 100) return 1;
    if (points < 300) return 2;
    if (points < 600) return 3;
    if (points < 1000) return 4;
    if (points < 1500) return 5;
    if (points < 2100) return 6;
    if (points < 2800) return 7;
    if (points < 3600) return 8;
    if (points < 4500) return 9;
    return 10;
  }

  /**
   * Calcula puntos con penalización basada en el nivel del usuario
   * A mayor nivel, mayor penalización por errores
   */
  static calculatePointsWithPenalty(iscorrect: boolean, userLevel: number): number {
    if (iscorrect) {
      // Puntos por respuesta correcta (siempre positivos)
      return 10;
    } else {
      // Penalización por respuesta incorrecta (basada en nivel)
      const penaltyByLevel: { [key: number]: number } = {
        1: -1,  // Nivel 1: -1 punto
        2: -2,  // Nivel 2: -2 puntos
        3: -3,  // Nivel 3: -3 puntos
        4: -4,  // Nivel 4: -4 puntos
        5: -5,  // Nivel 5: -5 puntos
        6: -6,  // Nivel 6: -6 puntos
        7: -7,  // Nivel 7: -7 puntos
        8: -8,  // Nivel 8: -8 puntos
        9: -9,  // Nivel 9: -9 puntos
        10: -10 // Nivel 10: -10 puntos
      };
      
      return penaltyByLevel[userLevel] || -2; // Default -2 si nivel no está en la lista
    }
  }

  /**
   * Obtiene las estadísticas completas de un usuario
   */
  static async getUserStats(telegramuserid: string): Promise<TelegramUserStats | null> {
    const user = await prisma.telegramuser.findUnique({
      where: { telegramuserid: telegramuserid }
    });

    if (!user) return null;

    // Obtener respuestas por separado ya que no hay relación definida en el esquema
    const responses = await prisma.telegramresponse.findMany({
      where: { userid: user.id }
    });

    const totalResponses = responses.length;
    const correctResponses = responses.filter(r => r.iscorrect).length;
    const accuracy = totalResponses > 0 ? (correctResponses / totalResponses) * 100 : 0;

    // Calcular ranking
    const rank = await this.getUserRank(telegramuserid);

    return {
      telegramuserid: user.telegramuserid,
      username: user.username || undefined,
      firstName: user.firstname || undefined,
      totalpoints: user.totalpoints,
      level: user.level,
      streak: user.streak,
      bestStreak: user.beststreak,
      totalResponses,
      correctResponses,
      accuracy,
      rank,
      lastActivity: user.lastactivity || undefined,
    };
  }

  /**
   * Obtiene el ranking de un usuario específico
   */
  static async getUserRank(telegramuserid: string): Promise<number> {
    const user = await prisma.telegramuser.findUnique({
      where: { telegramuserid: telegramuserid },
      select: { totalpoints: true }
    });

    if (!user) return 0;

    const usersAbove = await prisma.telegramuser.count({
      where: {
        totalpoints: {
          gt: user.totalpoints
        }
      }
    });

    return usersAbove + 1;
  }

  /**
   * Obtiene el leaderboard general
   */
  static async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    const users = await prisma.telegramuser.findMany({
      orderBy: [
        { totalpoints: 'desc' },
        { level: 'desc' },
        { streak: 'desc' }
      ],
      take: limit,
      select: {
        telegramuserid: true,
        username: true,
        firstname: true,
        totalpoints: true,
        level: true,
        streak: true
      }
    });

    return users.map((user, index) => ({
      rank: index + 1,
      user: {
        telegramuserid: user.telegramuserid,
        username: user.username || undefined,
        firstName: user.firstname || undefined
      },
      points: user.totalpoints,
      level: user.level,
      streak: user.streak
    }));
  }

  /**
   * Obtiene el leaderboard semanal (semana fija: lunes a domingo)
   */
  static async getWeeklyLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    // 🔧 FIX: Usar semana fija en lugar de móvil
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const mondayOfWeek = new Date(now);
    mondayOfWeek.setDate(now.getDate() - daysFromMonday);
    mondayOfWeek.setHours(0, 0, 0, 0);
    
    const sundayOfWeek = new Date(mondayOfWeek);
    sundayOfWeek.setDate(mondayOfWeek.getDate() + 6);
    sundayOfWeek.setHours(23, 59, 59, 999);

    const weeklyStats = await prisma.telegramresponse.groupBy({
      by: ['userid'],
      where: {
        answeredat: {
          gte: mondayOfWeek,
          lte: sundayOfWeek
        }
      },
      _sum: {
        points: true
      },
      _count: {
        id: true
      },
      orderBy: {
        _sum: {
          points: 'desc'
        }
      },
      take: limit
    });

    const leaderboard: LeaderboardEntry[] = [];

    for (let i = 0; i < weeklyStats.length; i++) {
      const stat = weeklyStats[i];
      const user = await prisma.telegramuser.findUnique({
        where: { id: stat.userid },
        select: {
          telegramuserid: true,
          username: true,
          firstname: true,
          level: true,
          streak: true
        }
      });

      if (user) {
        leaderboard.push({
          rank: i + 1,
          user: {
            telegramuserid: user.telegramuserid,
            username: user.username || undefined,
            firstName: user.firstname || undefined
          },
          points: stat._sum.points || 0,
          level: user.level,
          streak: user.streak
        });
      }
    }

    return leaderboard;
  }

  /**
   * Obtiene el leaderboard mensual
   */
  static async getMonthlyLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const monthlyStats = await prisma.telegramresponse.groupBy({
      by: ['userid'],
      where: {
        answeredat: {
          gte: firstDayOfMonth
        }
      },
      _sum: {
        points: true
      },
      _count: {
        id: true
      },
      orderBy: {
        _sum: {
          points: 'desc'
        }
      },
      take: limit
    });

    const leaderboard: LeaderboardEntry[] = [];

    for (let i = 0; i < monthlyStats.length; i++) {
      const stat = monthlyStats[i];
      const user = await prisma.telegramuser.findUnique({
        where: { id: stat.userid },
        select: {
          telegramuserid: true,
          username: true,
          firstname: true,
          level: true,
          streak: true
        }
      });

      if (user) {
        leaderboard.push({
          rank: i + 1,
          user: {
            telegramuserid: user.telegramuserid,
            username: user.username || undefined,
            firstName: user.firstname || undefined
          },
          points: stat._sum.points || 0,
          level: user.level,
          streak: user.streak
        });
      }
    }

    return leaderboard;
  }

  /**
   * Verifica y desbloquea logros para un usuario (versión asíncrona sin transacción)
   */
  static async checkAndUnlockAchievementsAsync(userid: string, user: any): Promise<void> {
    try {
      // Logro por primera respuesta correcta
      if (user.totalpoints >= 10) {
        await this.unlockAchievementAsync(userid, 'first_correct', 'Primera Respuesta Correcta');
      }

      // Logro por 10 respuestas correctas
      if (user.totalpoints >= 100) {
        await this.unlockAchievementAsync(userid, 'ten_correct', '10 Respuestas Correctas');
      }

      // Logro por racha de 5
      if (user.streak >= 5) {
        await this.unlockAchievementAsync(userid, 'streak_5', 'Racha de 5');
      }

      // Logro por racha de 10
      if (user.streak >= 10) {
        await this.unlockAchievementAsync(userid, 'streak_10', 'Racha de 10');
      }

      // Logro por alcanzar nivel 5
      if (user.level >= 5) {
        await this.unlockAchievementAsync(userid, 'level_5', 'Nivel 5 Alcanzado');
      }

      // Logro por alcanzar nivel 10
      if (user.level >= 10) {
        await this.unlockAchievementAsync(userid, 'level_10', 'Nivel Máximo');
      }

    } catch (error) {
      console.error('Error verificando logros:', error);
      // No lanzamos el error para no interrumpir el flujo principal
    }
  }

  /**
   * Desbloquea un logro específico para un usuario (versión asíncrona sin transacción)
   */
  static async unlockAchievementAsync(userid: string, achievementId: string, achievementName: string): Promise<void> {
    try {
      // Verificar si el usuario ya tiene este logro
      const existingAchievement = await prisma.userachievement.findFirst({
        where: {
          userid: userid,
          achievementid: achievementId
        }
      });

      if (!existingAchievement) {
        // Generar un ID único para el achievement del usuario
        const userAchievementId = `userachievement_${userid}_${achievementId}_${Date.now()}`;
        
        // Crear el logro
        await prisma.userachievement.create({
          data: {
            id: userAchievementId,
            userid: userid,
            achievementid: achievementId,
            unlockedat: new Date(),
          }
        });

        console.log(`🏆 Logro desbloqueado para usuario ${userid}: ${achievementName}`);
      }
    } catch (error) {
      console.error(`Error desbloqueando logro ${achievementId}:`, error);
    }
  }

  /**
   * Inicializa los logros básicos en la base de datos
   */
  static async initializeBasicAchievements(): Promise<void> {
    const achievements = [
      { id: 'first_correct', name: 'Primera Respuesta Correcta', description: 'Responde correctamente tu primera pregunta' },
      { id: 'ten_correct', name: '10 Respuestas Correctas', description: 'Responde correctamente 10 preguntas' },
      { id: 'streak_5', name: 'Racha de 5', description: 'Consigue una racha de 5 respuestas correctas' },
      { id: 'streak_10', name: 'Racha de 10', description: 'Consigue una racha de 10 respuestas correctas' },
      { id: 'level_5', name: 'Nivel 5 Alcanzado', description: 'Alcanza el nivel 5' },
      { id: 'level_10', name: 'Nivel Máximo', description: 'Alcanza el nivel máximo (10)' }
    ];

    for (const achievement of achievements) {
      try {
        await prisma.achievement.upsert({
          where: { id: achievement.id },
          update: {},
          create: {
            id: achievement.id,
            name: achievement.name,
            description: achievement.description,
            icon: '🏆',
            category: 'basic',
            condition: 'manual',
            rarity: 'common',
            createdat: new Date(),
            isactive: true
          }
        });
      } catch (error) {
        console.error(`Error inicializando logro ${achievement.id}:`, error);
      }
    }

    console.log('✅ Logros básicos inicializados');
  }
}