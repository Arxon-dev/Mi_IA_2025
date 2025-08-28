import { PrismaClient } from '@prisma/client';
import { studySessionService } from './studySessionService';

const prisma = new PrismaClient();

export class StudyTimeoutScheduler {
  private static instance: StudyTimeoutScheduler;
  private timeouts: Map<string, NodeJS.Timeout> = new Map();
  private isRunning: boolean = false;

  static getInstance(): StudyTimeoutScheduler {
    if (!StudyTimeoutScheduler.instance) {
      StudyTimeoutScheduler.instance = new StudyTimeoutScheduler();
    }
    return StudyTimeoutScheduler.instance;
  }

  /**
   * Iniciar el scheduler de timeouts
   */
  start(): void {
    if (this.isRunning) return;
    
    console.log('🚀 Iniciando StudyTimeoutScheduler...');
    this.isRunning = true;
    
    // Revisar timeouts cada 30 segundos
    this.scheduleTimeoutCheck();
    
    // Cargar timeouts existentes de sesiones activas
    this.loadExistingTimeouts();
  }

  /**
   * Detener el scheduler
   */
  stop(): void {
    if (!this.isRunning) return;
    
    console.log('🛑 Deteniendo StudyTimeoutScheduler...');
    this.isRunning = false;
    
    // Cancelar todos los timeouts pendientes
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.timeouts.clear();
  }

  /**
   * Programar timeout para una sesión específica
   */
  scheduleTimeout(sessionid: string, timeoutat: Date): void {
    // Cancelar timeout existente si hay uno
    this.cancelTimeout(sessionid);
    
    const now = new Date();
    const delay = timeoutat.getTime() - now.getTime();
    
    // Solo programar si está en el futuro
    if (delay > 0) {
      const timeout = setTimeout(async () => {
        await this.handleTimeout(sessionid);
        this.timeouts.delete(sessionid);
      }, delay);
      
      this.timeouts.set(sessionid, timeout);
      
              console.log(`⏰ Timeout programado para sesión ${sessionid} en ${Math.round(delay / 1000)}s`);
    }
  }

  /**
   * Cancelar timeout de una sesión
   */
  cancelTimeout(sessionid: string): void {
    const timeout = this.timeouts.get(sessionid);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(sessionid);
      console.log(`❌ Timeout cancelado para sesión ${sessionid}`);
    }
  }

  /**
   * Revisar timeouts periódicamente
   */
  private scheduleTimeoutCheck(): void {
    if (!this.isRunning) return;
    
    setTimeout(async () => {
      await this.checkExpiredSessions();
      this.scheduleTimeoutCheck();
    }, 30000); // Revisar cada 30 segundos
  }

  /**
   * Buscar sesiones expiradas que no han sido procesadas
   */
  private async checkExpiredSessions(): Promise<void> {
    try {
      const now = new Date();
      
      const expiredSessions = await prisma.userstudysession.findMany({
        where: {
          status: 'active',
          timeoutat: {
            lte: now
          }
        }
      });

      for (const session of expiredSessions) {
        // Verificar si hay respuestas pendientes para esta sesión
        const pendingResponses = await prisma.studyresponse.findMany({
          where: {
            sessionid: session.id,
            answeredat: null
          },
          take: 1
        });

        // Solo procesar si tiene respuestas pendientes
        if (pendingResponses.length > 0) {
          console.log(`⏱️ Procesando timeout de sesión expirada: ${session.id}`);
          await this.handleTimeout(session.id);
        }
      }

    } catch (error) {
      console.error('Error revisando sesiones expiradas:', error);
    }
  }

  /**
   * Cargar timeouts de sesiones activas existentes
   */
  private async loadExistingTimeouts(): Promise<void> {
    try {
      const activeSessions = await prisma.userstudysession.findMany({
        where: {
          status: 'active',
          timeoutat: {
            gt: new Date()
          }
        }
      });

      console.log(`📋 Cargando ${activeSessions.length} timeouts existentes...`);

      for (const session of activeSessions) {
        if (session.timeoutat) {
          this.scheduleTimeout(session.id, session.timeoutat);
        }
      }

    } catch (error) {
      console.error('Error cargando timeouts existentes:', error);
    }
  }

  /**
   * Manejar timeout de una sesión específica
   */
  private async handleTimeout(sessionid: string): Promise<void> {
    try {
      console.log(`⏰ Procesando timeout para sesión: ${sessionid}`);
      await studySessionService.handleQuestionTimeout(sessionid);
    } catch (error) {
      console.error(`Error manejando timeout de sesión ${sessionid}:`, error);
    }
  }

  /**
   * Obtener estadísticas del scheduler
   */
  getStats(): {
    isRunning: boolean;
    activeTimeouts: number;
    timeouts: { sessionid: string; scheduledFor: string }[];
  } {
    const timeouts = Array.from(this.timeouts.keys()).map(sessionid => ({
      sessionid,
      scheduledFor: 'unknown' // Node.js no expone cuando se ejecutará un timeout
    }));

    return {
      isRunning: this.isRunning,
      activeTimeouts: this.timeouts.size,
      timeouts
    };
  }
}

// Instancia singleton
export const studyTimeoutScheduler = StudyTimeoutScheduler.getInstance();

// Auto-start del scheduler cuando se importe el módulo
if (typeof window === 'undefined') { // Solo en servidor
  studyTimeoutScheduler.start();
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('📝 Cerrando StudyTimeoutScheduler...');
    studyTimeoutScheduler.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('📝 Cerrando StudyTimeoutScheduler...');
    studyTimeoutScheduler.stop();
    process.exit(0);
  });
} 