import { IntelligentAlertsScheduler } from './intelligent-alerts-scheduler';
import { NotificationService } from '../src/services/notificationService';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Script principal para ejecutar el sistema de alertas inteligentes
 * Puede ejecutarse de forma manual o programada
 */

const prisma = new PrismaClient();
const notificationService = new NotificationService();
const scheduler = new IntelligentAlertsScheduler();

// Función para mostrar estadísticas del sistema
async function showSystemStats() {
  try {
    console.log('📊 Estadísticas del Sistema de Alertas Inteligentes');
    console.log('=' .repeat(60));
    
    const stats = await notificationService.getIntelligentAlertsStats();
    
    console.log(`🎯 Alertas enviadas hoy: ${stats.alertsSentToday}`);
    console.log(`👥 Usuarios activos monitorizados: ${stats.activeUsersMonitored}`);
    console.log(`⚡ Última ejecución: ${stats.lastExecution || 'Nunca'}`);
    console.log(`🔄 Estado del scheduler: ${scheduler.getStatus().isRunning ? 'Activo' : 'Inactivo'}`);
    
    if (stats.alertsByType && Object.keys(stats.alertsByType).length > 0) {
      console.log('\n📈 Alertas por tipo:');
      Object.entries(stats.alertsByType).forEach(([type, count]) => {
        console.log(`  • ${type}: ${count}`);
      });
    }
    
    console.log('=' .repeat(60));
  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);
  }
}

/**
 * 🔍 Ejecutar alertas para un usuario específico
 */
async function runAlertsForUser(userId: string): Promise<void> {
  try {
    console.log(`🔍 Verificando alertas para usuario: ${userId}`);
    
    const alerts = await notificationService.checkUserAlerts(userId);
    
    if (alerts && alerts.length > 0) {
      console.log(`\n📨 Se encontraron ${alerts.length} alertas:`);
      alerts.forEach((alert: any, index: number) => {
        console.log(`  ${index + 1}. ${alert.type}: ${alert.message}`);
      });
    } else {
      console.log('\n✅ No se encontraron alertas para este usuario');
    }
  } catch (error) {
    console.error(`❌ Error verificando alertas para usuario ${userId}:`, error);
  }
}

/**
 * 🚀 Ejecutar alertas para todos los usuarios
 */
async function runAlertsForAllUsers(): Promise<void> {
  try {
    console.log('🤖 Ejecutando alertas inteligentes para todos los usuarios...');
    
    const result = await notificationService.runIntelligentAlerts();
    
    console.log('\n📊 Resultados:');
    console.log(`👥 Usuarios procesados: ${result.usersProcessed}`);
    console.log(`📨 Alertas enviadas: ${result.alertsSent}`);
    console.log(`❌ Errores: ${result.errors}`);
    
    if (result.alertsByType && Object.keys(result.alertsByType).length > 0) {
      console.log('\n📈 Alertas por tipo:');
      Object.entries(result.alertsByType).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });
    }
    
    console.log('\n✅ Proceso completado exitosamente');
  } catch (error) {
    console.error('❌ Error ejecutando alertas:', error);
  }
}

// Función para mostrar métricas de rendimiento de un usuario
async function showUserMetrics(userId: string) {
  try {
    console.log(`📊 Métricas de rendimiento para usuario ${userId}`);
    console.log('=' .repeat(50));
    
    const metrics = await notificationService.getUserPerformanceMetrics(userId);
    
    console.log(`📈 Tendencia de precisión: ${(metrics.accuracyTrend * 100).toFixed(1)}%`);
    console.log(`📚 Frecuencia de estudio: ${metrics.studyFrequency.toFixed(1)} preguntas/día`);
    console.log(`⏱️ Tiempo de respuesta promedio: ${metrics.averageResponseTime.toFixed(1)}s`);
    console.log(`🔥 Racha actual: ${metrics.currentStreak} días`);
    console.log(`📊 Progresión de dificultad: ${(metrics.difficultyProgression * 100).toFixed(1)}%`);
    console.log(`💪 Engagement score: ${(metrics.engagementScore * 100).toFixed(1)}%`);
    
    console.log('=' .repeat(50));
  } catch (error) {
    console.error(`❌ Error al obtener métricas para usuario ${userId}:`, error);
  }
}

// Función principal
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  console.log('🤖 Sistema de Alertas Inteligentes - OpoMelilla 2025');
  console.log('=' .repeat(60));
  
  try {
    switch (command) {
      case 'stats':
        await showSystemStats();
        break;
        
      case 'run':
        await runAlertsForAllUsers();
        break;
        
      case 'user':
        const userId = args[1];
        if (!userId) {
          console.error('❌ Debes especificar un ID de usuario');
          console.log('Uso: npm run alerts user <userId>');
          process.exit(1);
        }
        await runAlertsForUser(userId);
        break;
        
      case 'metrics':
        const metricsUserId = args[1];
        if (!metricsUserId) {
          console.error('❌ Debes especificar un ID de usuario');
          console.log('Uso: npm run alerts metrics <userId>');
          process.exit(1);
        }
        await showUserMetrics(metricsUserId);
        break;
        
      case 'start':
        console.log('🔄 Iniciando scheduler continuo...');
        scheduler.startScheduler();
        break;
        
      case 'test':
        console.log('🧪 Ejecutando prueba del sistema...');
        await scheduler.testIntelligentAlerts();
        break;
        
      case 'status':
        const status = scheduler.getStatus();
        console.log('📊 Estado del Scheduler:');
        console.log(`  • Activo: ${status.isRunning ? 'Sí' : 'No'}`);
        console.log(`  • Última ejecución: ${status.lastRun || 'Nunca'}`);
        console.log(`  • Próxima ejecución: ${status.nextRun || 'No programada'}`);
        console.log(`  • Configuración cargada: ${status.configLoaded ? 'Sí' : 'No'}`);
        break;
        
      default:
        console.log('📖 Comandos disponibles:');
        console.log('  • stats     - Mostrar estadísticas del sistema');
        console.log('  • run       - Ejecutar alertas para todos los usuarios');
        console.log('  • user <id> - Ejecutar alertas para un usuario específico');
        console.log('  • metrics <id> - Mostrar métricas de un usuario');
        console.log('  • start     - Iniciar scheduler continuo');
        console.log('  • test      - Ejecutar prueba del sistema');
        console.log('  • status    - Mostrar estado del scheduler');
        console.log('\nEjemplos:');
        console.log('  npm run alerts stats');
        console.log('  npm run alerts run');
        console.log('  npm run alerts user 123456789');
        console.log('  npm run alerts metrics 123456789');
        break;
    }
  } catch (error) {
    console.error('❌ Error durante la ejecución:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Manejo de señales para cierre limpio
process.on('SIGINT', async () => {
  console.log('\n🛑 Cerrando sistema de alertas inteligentes...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Cerrando sistema de alertas inteligentes...');
  await prisma.$disconnect();
  process.exit(0);
});

// Ejecutar función principal
if (require.main === module) {
  main().catch(console.error);
}

export { main, showSystemStats, runAlertsForAllUsers, runAlertsForUser, showUserMetrics };