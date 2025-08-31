import { IntelligentAlertsService } from '../src/services/intelligentAlertsService';
import { NotificationService } from '../src/services/notificationService';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const CONFIG_FILE = join(process.cwd(), 'scheduler-config.json');

interface SchedulerConfig {
  intelligentAlerts: {
    enabled: boolean;
    interval: number; // en horas
    allowedHours: {
      start: number;
      end: number;
    };
    maxAlertsPerUser: number;
    cooldownBetweenChecks: number; // en minutos
  };
}

/**
 * 🧠 Scheduler para Alertas Inteligentes
 * 
 * Ejecuta el sistema de alertas inteligentes según la configuración
 * y respeta los horarios permitidos para envío de notificaciones.
 */
class IntelligentAlertsScheduler {
  private config: SchedulerConfig;
  private isRunning: boolean = false;
  private lastExecutionTime: Date | null = null;
  private intelligentAlertsService: IntelligentAlertsService;
  private notificationService: NotificationService;

  constructor() {
    this.config = this.loadConfig();
    this.intelligentAlertsService = new IntelligentAlertsService();
    this.notificationService = new NotificationService();
  }

  /**
   * 📋 Cargar configuración desde archivo
   */
  private loadConfig(): SchedulerConfig {
    try {
      if (existsSync(CONFIG_FILE)) {
        const configData = JSON.parse(readFileSync(CONFIG_FILE, 'utf8'));
        
        // Configuración por defecto para alertas inteligentes
        const defaultConfig = {
          intelligentAlerts: {
            enabled: true,
            interval: 4, // cada 4 horas
            allowedHours: {
              start: 7,
              end: 22
            },
            maxAlertsPerUser: 3, // máximo 3 alertas por usuario por día
            cooldownBetweenChecks: 30 // 30 minutos entre verificaciones
          }
        };

        // Combinar configuración existente con la nueva
        return {
          ...defaultConfig,
          ...configData,
          intelligentAlerts: {
            ...defaultConfig.intelligentAlerts,
            ...configData.intelligentAlerts
          }
        };
      }
    } catch (error) {
      console.error('❌ Error cargando configuración:', error);
    }

    // Configuración por defecto si no existe archivo
    return {
      intelligentAlerts: {
        enabled: true,
        interval: 4,
        allowedHours: {
          start: 7,
          end: 22
        },
        maxAlertsPerUser: 3,
        cooldownBetweenChecks: 30
      }
    };
  }

  /**
   * ⏰ Verificar si está en horario permitido
   */
  private isWithinAllowedHours(): boolean {
    const now = new Date();
    const currentHour = now.getHours();
    const { start, end } = this.config.intelligentAlerts.allowedHours;
    
    return currentHour >= start && currentHour < end;
  }

  /**
   * 🔍 Verificar si debe ejecutarse según el intervalo
   */
  private shouldExecute(): boolean {
    if (!this.config.intelligentAlerts.enabled) {
      return false;
    }

    if (!this.isWithinAllowedHours()) {
      return false;
    }

    if (!this.lastExecutionTime) {
      return true;
    }

    const now = new Date();
    const timeDiff = now.getTime() - this.lastExecutionTime.getTime();
    const intervalMs = this.config.intelligentAlerts.interval * 60 * 60 * 1000;
    
    return timeDiff >= intervalMs;
  }

  /**
   * 🚀 Ejecutar alertas inteligentes
   */
  async executeIntelligentAlerts(): Promise<void> {
    if (this.isRunning) {
      console.log('⏳ Alertas inteligentes ya en ejecución, saltando...');
      return;
    }

    if (!this.shouldExecute()) {
      console.log('⏰ No es momento de ejecutar alertas inteligentes');
      return;
    }

    this.isRunning = true;
    const startTime = new Date();

    try {
      console.log('🧠 [INTELLIGENT ALERTS] Iniciando ejecución de alertas inteligentes...');
      console.log(`📊 Configuración: Intervalo ${this.config.intelligentAlerts.interval}h, Horario ${this.config.intelligentAlerts.allowedHours.start}:00-${this.config.intelligentAlerts.allowedHours.end}:00`);

      // Ejecutar el procesamiento de alertas
      await this.intelligentAlertsService.processAlertsForAllUsers();

      // Obtener estadísticas
      const stats = await this.intelligentAlertsService.getAlertStats();
      if (stats) {
        console.log('📈 [INTELLIGENT ALERTS] Estadísticas:');
        console.log(`   • Alertas últimas 24h: ${stats.alertsLast24Hours}`);
        console.log(`   • Reglas activas: ${stats.totalAlertRules}`);
        
        if (stats.alertsByType && stats.alertsByType.length > 0) {
          console.log('   • Por tipo:');
          stats.alertsByType.forEach((stat: any) => {
            console.log(`     - ${stat.type}: ${stat._count.id}`);
          });
        }
      }

      this.lastExecutionTime = new Date();
      const duration = (this.lastExecutionTime.getTime() - startTime.getTime()) / 1000;
      
      console.log(`✅ [INTELLIGENT ALERTS] Ejecución completada en ${duration.toFixed(2)}s`);

    } catch (error) {
      console.error('❌ [INTELLIGENT ALERTS] Error ejecutando alertas inteligentes:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * 🔄 Iniciar scheduler continuo
   */
  startScheduler(): void {
    console.log('🚀 [INTELLIGENT ALERTS] Iniciando scheduler de alertas inteligentes...');
    console.log(`⚙️ Configuración: ${this.config.intelligentAlerts.enabled ? 'Habilitado' : 'Deshabilitado'}`);
    
    if (!this.config.intelligentAlerts.enabled) {
      console.log('⏸️ [INTELLIGENT ALERTS] Scheduler deshabilitado en configuración');
      return;
    }

    // Ejecutar inmediatamente si está en horario
    this.executeIntelligentAlerts();

    // Programar ejecuciones periódicas
    const checkInterval = this.config.intelligentAlerts.cooldownBetweenChecks * 60 * 1000; // convertir a ms
    
    setInterval(() => {
      this.executeIntelligentAlerts();
    }, checkInterval);

    console.log(`⏰ [INTELLIGENT ALERTS] Scheduler iniciado. Verificando cada ${this.config.intelligentAlerts.cooldownBetweenChecks} minutos`);
  }

  /**
   * 📊 Obtener estado del scheduler
   */
  getStatus(): any {
    return {
      enabled: this.config.intelligentAlerts.enabled,
      isRunning: this.isRunning,
      lastExecution: this.lastExecutionTime,
      nextExecution: this.lastExecutionTime 
        ? new Date(this.lastExecutionTime.getTime() + (this.config.intelligentAlerts.interval * 60 * 60 * 1000))
        : null,
      withinAllowedHours: this.isWithinAllowedHours(),
      config: this.config.intelligentAlerts
    };
  }

  /**
   * 🧪 Ejecutar prueba de alertas inteligentes
   */
  async testIntelligentAlerts(): Promise<void> {
    console.log('🧪 [INTELLIGENT ALERTS] Ejecutando prueba del sistema...');
    
    try {
      // Forzar ejecución independientemente del horario
      const originalEnabled = this.config.intelligentAlerts.enabled;
      this.config.intelligentAlerts.enabled = true;
      
      await this.intelligentAlertsService.processAlertsForAllUsers();
      
      // Restaurar configuración original
      this.config.intelligentAlerts.enabled = originalEnabled;
      
      console.log('✅ [INTELLIGENT ALERTS] Prueba completada exitosamente');
    } catch (error) {
      console.error('❌ [INTELLIGENT ALERTS] Error en prueba:', error);
    }
  }
}

// Crear instancia del scheduler
const intelligentAlertsScheduler = new IntelligentAlertsScheduler();

// Función principal para ejecutar desde línea de comandos
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'start':
      intelligentAlertsScheduler.startScheduler();
      break;
      
    case 'test':
      await intelligentAlertsScheduler.testIntelligentAlerts();
      process.exit(0);
      break;
      
    case 'execute':
      await intelligentAlertsScheduler.executeIntelligentAlerts();
      process.exit(0);
      break;
      
    case 'status':
      const status = intelligentAlertsScheduler.getStatus();
      console.log('📊 [INTELLIGENT ALERTS] Estado del scheduler:');
      console.log(JSON.stringify(status, null, 2));
      process.exit(0);
      break;
      
    default:
      console.log('🔧 [INTELLIGENT ALERTS] Uso:');
      console.log('  npm run intelligent-alerts start   - Iniciar scheduler continuo');
      console.log('  npm run intelligent-alerts test    - Ejecutar prueba');
      console.log('  npm run intelligent-alerts execute - Ejecutar una vez');
      console.log('  npm run intelligent-alerts status  - Ver estado');
      process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(console.error);
}

export { IntelligentAlertsScheduler, intelligentAlertsScheduler };
export default intelligentAlertsScheduler;