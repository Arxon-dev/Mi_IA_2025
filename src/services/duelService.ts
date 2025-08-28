import { PrismaClient, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { DuelManager } from './duelManager';

export interface DuelStats {
  id: string;
  type: string;
  status: string;
  questionscount: number;
  timelimit: number;
  stake: number;
  expiresAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: string;
  challenger: {
    telegramuserid: string;
    username?: string;
    firstName?: string;
  };
  challenged: {
    telegramuserid: string;
    username?: string;
    firstName?: string;
  };
  winner?: {
    telegramuserid: string;
    username?: string;
    firstName?: string;
  };
  challengerScore?: number;
  challengedScore?: number;
  currentQuestion?: number;
}

export interface CreateDuelRequest {
  challengerTelegramId: string;
  challengedTelegramId: string;
  type?: 'standard' | 'speed' | 'accuracy';
  questionsCount?: number;
  timeLimit?: number;
  stake?: number;
}

export class DuelService {
  
  /**
   * Validar que los modelos de duelos estén disponibles
   */
  private static validateDuelModels(): void {
    console.log('🔧 DuelService - Validando modelos de duelos...');
    console.log('prisma.duel:', typeof prisma.duel);
    console.log('prisma.duelQuestion:', typeof prisma.duelQuestion);
    console.log('prisma.duelResponse:', typeof prisma.duelResponse);
    
    if (!prisma.duel) {
      throw new Error('prisma.duel no está disponible');
    }
    if (!prisma.duelQuestion) {
      throw new Error('prisma.duelQuestion no está disponible');
    }
    if (!prisma.duelResponse) {
      throw new Error('prisma.duelResponse no está disponible');
    }
    
    console.log('✅ DuelService - Todos los modelos de duelos están disponibles');
  }
  
  /**
   * Crear un nuevo duelo
   */
  static async createDuel(request: CreateDuelRequest): Promise<DuelStats | null> {
    try {
      console.log('🗡️ DuelService.createDuel - Iniciando con request:', request);
      
      // Validar modelos antes de usar
      this.validateDuelModels();
      
      // Buscar usuarios
      console.log('🗡️ DuelService.createDuel - Buscando usuarios...');
      const challenger = await prisma.telegramuser.findUnique({
        where: { telegramuserid: request.challengerTelegramId }
      });
      
      const challenged = await prisma.telegramuser.findUnique({
        where: { telegramuserid: request.challengedTelegramId }
      });
      
      console.log('🗡️ DuelService.createDuel - Usuarios encontrados:', {
        challenger: challenger ? 'Sí' : 'No',
        challenged: challenged ? 'Sí' : 'No'
      });
      
      if (!challenger || !challenged) {
        throw new Error('Uno o ambos usuarios no encontrados');
      }
      
      if (challenger.id === challenged.id) {
        throw new Error('No puedes retarte a ti mismo');
      }
      
      // Configurar stake por defecto según el tipo de duelo
      let stake = request.stake;
      if (stake === undefined || stake === null) {
        // Stakes por defecto según tipo de duelo
        switch (request.type || 'standard') {
          case 'standard':
            stake = 5; // 5 puntos por defecto para duelos estándar (más accesible)
            break;
          case 'speed':
            stake = 10; // 10 puntos para duelos de velocidad
            break;
          case 'accuracy':
            stake = 15; // 15 puntos para duelos de precisión
            break;
          default:
            stake = 5;
        }
      }
      
      console.log(`🗡️ DuelService.createDuel - Stake configurado: ${stake} puntos`);
      
      // Verificar que el retado tenga puntos suficientes si hay apuesta
      if (stake > 0 && (challenger.totalpoints < stake || challenged.totalpoints < stake)) {
        throw new Error('Uno o ambos usuarios no tienen puntos suficientes para la apuesta');
      }
      
      // Verificar que no haya duelos pendientes entre estos usuarios
      console.log('🗡️ DuelService.createDuel - Verificando duelos existentes...');
      const existingDuel = await prisma.duel.findFirst({
        where: {
          OR: [
            { challengerId: challenger.id, challengedId: challenged.id, status: 'pending' },
            { challengerId: challenged.id, challengedId: challenger.id, status: 'pending' }
          ]
        }
      });
      
      if (existingDuel) {
        throw new Error('Ya hay un duelo pendiente entre estos usuarios');
      }
      
      // Crear el duelo
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30); // Expira en 30 minutos
      
      console.log('🗡️ DuelService.createDuel - Creando duelo en base de datos...');
      
      const duel = await prisma.duel.create({
        data: {
          challengerId: challenger.id,
          challengedId: challenged.id,
          type: request.type || 'standard',
          questionscount: request.questionscount || 5,
          timelimit: request.timelimit || 300,
          stake: stake,
          expiresAt: expiresAt
        },
        include: {
          challenger: true,
          challenged: true
        }
      });
      
      console.log('🗡️ DuelService.createDuel - Duelo creado exitosamente:', duel.id);
      
      return this.formatDuelStats(duel);
      
    } catch (error) {
      console.error('🗡️ DuelService.createDuel - Error:', error);
      return null;
    }
  }
  
  /**
   * Aceptar un duelo
   */
  static async acceptDuel(duelId: string, userTelegramId: string): Promise<DuelStats | null> {
    try {
      this.validateDuelModels();
      
      const user = await prisma.telegramuser.findUnique({
        where: { telegramuserid: userTelegramId }
      });
      
      if (!user) {
        throw new Error('Usuario no encontrado');
      }
      
      const duel = await prisma.duel.findUnique({
        where: { id: duelId },
        include: {
          challenger: true,
          challenged: true
        }
      });
      
      if (!duel) {
        throw new Error('Duelo no encontrado');
      }
      
      if (duel.challengedId !== user.id) {
        throw new Error('Solo el usuario retado puede aceptar el duelo');
      }
      
      if (duel.status !== 'pending') {
        throw new Error('Este duelo ya no está pendiente');
      }
      
      if (new Date() > duel.expiresAt) {
        // Marcar como expirado
        await prisma.duel.update({
          where: { id: duelId },
          data: { status: 'expired' }
        });
        throw new Error('Este duelo ha expirado');
      }
      
      console.log('🗡️ DuelService.acceptDuel - Aceptando duelo...');
      
      // Aceptar el duelo
      const updatedDuel = await prisma.duel.update({
        where: { id: duelId },
        data: {
          status: 'accepted',
          startedAt: new Date()
        },
        include: {
          challenger: true,
          challenged: true
        }
      });
      
      console.log('✅ DuelService.acceptDuel - Duelo aceptado, iniciando batalla automáticamente...');
      
      // 🚀 INICIAR AUTOMÁTICAMENTE EL DUELO ACTIVO
      try {
        const battleStarted = await DuelManager.startActiveDuel(duelId);
        
        if (battleStarted) {
          console.log('🎯 DuelService.acceptDuel - ¡Batalla iniciada exitosamente!');
        } else {
          console.warn('⚠️ DuelService.acceptDuel - Error iniciando batalla automática');
        }
      } catch (battleError) {
        console.error('❌ DuelService.acceptDuel - Error en inicio automático de batalla:', battleError);
        // No fallar la aceptación del duelo si hay error en el inicio de batalla
      }
      
      return this.formatDuelStats(updatedDuel);
      
    } catch (error) {
      console.error('❌ DuelService.acceptDuel - Error:', error);
      return null;
    }
  }
  
  /**
   * Rechazar un duelo
   */
  static async rejectDuel(duelId: string, userTelegramId: string): Promise<boolean> {
    try {
      this.validateDuelModels();
      
      const user = await prisma.telegramuser.findUnique({
        where: { telegramuserid: userTelegramId }
      });
      
      if (!user) {
        return false;
      }
      
      const duel = await prisma.duel.findUnique({
        where: { id: duelId }
      });
      
      if (!duel || duel.challengedId !== user.id || duel.status !== 'pending') {
        return false;
      }
      
      await prisma.duel.update({
        where: { id: duelId },
        data: { status: 'cancelled' }
      });
      
      return true;
      
    } catch (error) {
      console.error('Error rechazando duelo:', error);
      return false;
    }
  }
  
  /**
   * Obtener duelos de un usuario
   */
  static async getUserDuels(telegramuserid: string): Promise<DuelStats[]> {
    try {
      this.validateDuelModels();
      
      const user = await prisma.telegramuser.findUnique({
        where: { telegramuserid }
      });
      
      if (!user) return [];
      
      const duels = await prisma.duel.findMany({
        where: {
          OR: [
            { challengerId: user.id },
            { challengedId: user.id }
          ]
        },
        include: {
          challenger: true,
          challenged: true,
          winner: true,
          responses: true
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      });
      
      return duels.map(duel => this.formatDuelStats(duel));
      
    } catch (error) {
      console.error('Error obteniendo duelos del usuario:', error);
      return [];
    }
  }
  
  /**
   * Obtener duelos pendientes de un usuario
   */
  static async getPendingDuels(telegramuserid: string): Promise<DuelStats[]> {
    try {
      this.validateDuelModels();
      
      const user = await prisma.telegramuser.findUnique({
        where: { telegramuserid }
      });
      
      if (!user) return [];
      
      const duels = await prisma.duel.findMany({
        where: {
          challengedId: user.id,
          status: 'pending',
          expiresAt: {
            gt: new Date()
          }
        },
        include: {
          challenger: true,
          challenged: true
        },
        orderBy: { createdAt: 'desc' }
      });
      
      return duels.map(duel => this.formatDuelStats(duel));
      
    } catch (error) {
      console.error('Error obteniendo duelos pendientes:', error);
      return [];
    }
  }
  
  /**
   * Obtener estadísticas de duelos de un usuario
   */
  static async getDuelStatistics(telegramuserid: string) {
    try {
      this.validateDuelModels();
      
      const user = await prisma.telegramuser.findUnique({
        where: { telegramuserid }
      });
      
      if (!user) return null;
      
      const totalDuels = await prisma.duel.count({
        where: {
          OR: [
            { challengerId: user.id },
            { challengedId: user.id }
          ],
          status: 'completed'
        }
      });
      
      const wonDuels = await prisma.duel.count({
        where: {
          winnerId: user.id,
          status: 'completed'
        }
      });
      
      const currentStreak = await this.calculateDuelStreak(user.id);
      
      return {
        totalDuels,
        wonDuels,
        lostDuels: totalDuels - wonDuels,
        winRate: totalDuels > 0 ? (wonDuels / totalDuels) * 100 : 0,
        currentStreak
      };
      
    } catch (error) {
      console.error('Error obteniendo estadísticas de duelos:', error);
      return null;
    }
  }
  
  /**
   * Buscar usuario por username o firstName
   */
  static async findUserByIdentifier(identifier: string): Promise<any> {
    try {
      // Remover @ si existe
      const cleanIdentifier = identifier.startsWith('@') ? identifier.slice(1) : identifier;
      
      const user = await prisma.telegramuser.findFirst({
        where: {
          OR: [
            { username: { equals: cleanIdentifier, mode: 'insensitive' } },
            { firstname: { contains: cleanIdentifier, mode: 'insensitive' } }
          ]
        }
      });
      
      return user;
      
    } catch (error) {
      console.error('Error buscando usuario:', error);
      return null;
    }
  }
  
  /**
   * Formatear datos del duelo para respuesta
   */
  private static formatDuelStats(duel: any): DuelStats {
    // Calcular puntuaciones si el duelo está completado
    let challengerScore = 0;
    let challengedScore = 0;
    
    if (duel.responses) {
      challengerScore = duel.responses
        .filter((r: any) => r.userid === duel.challengerId && r.iscorrect)
        .length;
      challengedScore = duel.responses
        .filter((r: any) => r.userid === duel.challengedId && r.iscorrect)
        .length;
    }
    
    return {
      id: duel.id,
      type: duel.type,
      status: duel.status,
      questionscount: duel.questionscount,
      timelimit: duel.timelimit,
      stake: duel.stake,
      expiresAt: duel.expiresAt,
      startedAt: duel.startedAt,
      completedAt: duel.completedAt,
      result: duel.result,
      challenger: {
        telegramuserid: duel.challenger.telegramuserid,
        username: duel.challenger.username,
        firstname: duel.challenger.firstname
      },
      challenged: {
        telegramuserid: duel.challenged.telegramuserid,
        username: duel.challenged.username,
        firstname: duel.challenged.firstname
      },
      winner: duel.winner ? {
        telegramuserid: duel.winner.telegramuserid,
        username: duel.winner.username,
        firstname: duel.winner.firstname
      } : undefined,
      challengerScore,
      challengedScore
    };
  }
  
  /**
   * Calcular racha de victorias en duelos
   */
  private static async calculateDuelStreak(userid: string): Promise<number> {
    try {
      this.validateDuelModels();
      
      const recentDuels = await prisma.duel.findMany({
        where: {
          OR: [
            { challengerId: userid },
            { challengedId: userid }
          ],
          status: 'completed'
        },
        orderBy: { completedAt: 'desc' },
        take: 50
      });
      
      let streak = 0;
      for (const duel of recentDuels) {
        if (duel.winnerId === userid) {
          streak++;
        } else {
          break;
        }
      }
      
      return streak;
      
    } catch (error) {
      console.error('Error calculando racha de duelos:', error);
      return 0;
    }
  }
  
  /**
   * Limpiar duelos expirados
   */
  static async cleanupExpiredDuels(): Promise<number> {
    try {
      this.validateDuelModels();
      
      const result = await prisma.duel.updateMany({
        where: {
          status: 'pending',
          expiresAt: {
            lt: new Date()
          }
        },
        data: {
          status: 'expired'
        }
      });
      
      return result.count;
      
    } catch (error) {
      console.error('Error limpiando duelos expirados:', error);
      return 0;
    }
  }
}

export default DuelService; 