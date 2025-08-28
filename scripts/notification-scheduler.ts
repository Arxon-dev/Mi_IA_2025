import * as cron from 'node-cron';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync, existsSync, watchFile } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

interface SchedulerConfig {
  notifications: {
    enabled: boolean;
    intervalHours: number;
    enabledRules: string[];
  };
  dailyPolls: {
    enabled: boolean;
    time: string; // formato cron
    frequency?: string;
    customMinutes?: number;
    startHour?: number;
    startMinute?: number;
    endHour?: number;
    endMinute?: number;
  };
  monitoring: {
    enabled: boolean;
    intervalMinutes: number;
  };
  premiumFeaturesNotification?: {
    enabled: boolean;
    time: string;
    cronExpression: string;
    timezone: string;
    description?: string;
  };
}

const CONFIG_FILE = join(process.cwd(), 'scheduler-config.json');

const DEFAULT_CONFIG: SchedulerConfig = {
  notifications: {
    enabled: true,
    intervalHours: 4, // cada 4 horas
    enabledRules: ['streak_encouragement', 'level_celebration', 'inactive_users', 'high_performers', 'close_competition']
  },
  dailyPolls: {
    enabled: true,
    time: "*/5 * * * *", // cada 5 minutos (formato cron)
    frequency: 'custom',
    customMinutes: 5,
    startHour: 8,
    startMinute: 0,
    endHour: 22,
    endMinute: 0
  },
  monitoring: {
    enabled: true,
    intervalMinutes: 30 // cada 30 minutos
  }
};

function loadConfig(): SchedulerConfig {
  if (existsSync(CONFIG_FILE)) {
    try {
      const content = readFileSync(CONFIG_FILE, 'utf-8');
      const webConfig = JSON.parse(content);
      console.log('📁 Configuración cargada desde archivo web');
      return { ...DEFAULT_CONFIG, ...webConfig };
    } catch (error) {
      console.warn('⚠️ Error leyendo configuración web, usando default:', error);
      return DEFAULT_CONFIG;
    }
  }
  console.log('📋 Usando configuración por defecto');
  return DEFAULT_CONFIG;
}

class NotificationScheduler {
  private config: SchedulerConfig;
  private scheduledTasks: any[] = [];
  private configWatcherSetup = false;

  constructor() {
    this.config = loadConfig();
    this.setupConfigWatcher();
  }

  private setupConfigWatcher() {
    if (this.configWatcherSetup) return;
    
    console.log('👁️ Configurando monitor de cambios de configuración...');
    
    // Vigilar cambios en el archivo de configuración
    watchFile(CONFIG_FILE, { interval: 2000 }, (curr, prev) => {
      // Solo recargar si el archivo realmente cambió
      if (curr.mtime > prev.mtime) {
        console.log('');
        console.log('🔄 ============ CAMBIO DE CONFIGURACIÓN DETECTADO ============');
        console.log('📁 Archivo modificado:', CONFIG_FILE);
        console.log('⏰ Momento del cambio:', new Date().toLocaleString());
        console.log('🔄 Recargando configuración automáticamente...');
        
        this.reloadConfiguration();
      }
    });
    
    this.configWatcherSetup = true;
    console.log('✅ Monitor de configuración activo');
  }

  private async reloadConfiguration() {
    try {
      // Cargar nueva configuración
      const newConfig = loadConfig();
      const oldConfig = this.config;
      
      // Verificar si hubo cambios significativos
      const hasSignificantChanges = 
        newConfig.dailyPolls.time !== oldConfig.dailyPolls.time ||
        newConfig.dailyPolls.enabled !== oldConfig.dailyPolls.enabled ||
        newConfig.dailyPolls.startHour !== oldConfig.dailyPolls.startHour ||
        newConfig.dailyPolls.endHour !== oldConfig.dailyPolls.endHour ||
        newConfig.notifications.enabled !== oldConfig.notifications.enabled ||
        newConfig.notifications.intervalHours !== oldConfig.notifications.intervalHours ||
        newConfig.monitoring.enabled !== oldConfig.monitoring.enabled ||
        newConfig.monitoring.intervalMinutes !== oldConfig.monitoring.intervalMinutes;
      
      if (!hasSignificantChanges) {
        console.log('ℹ️ No hay cambios significativos en la configuración');
        return;
      }
      
      console.log('📊 Cambios detectados:');
      console.log('  ANTES:', {
        pollsEnabled: oldConfig.dailyPolls.enabled,
        pollTime: oldConfig.dailyPolls.time,
        pollHours: `${oldConfig.dailyPolls.startHour}:00-${oldConfig.dailyPolls.endHour}:00`,
        notificationsEnabled: oldConfig.notifications.enabled
      });
      console.log('  DESPUÉS:', {
        pollsEnabled: newConfig.dailyPolls.enabled,
        pollTime: newConfig.dailyPolls.time,
        pollHours: `${newConfig.dailyPolls.startHour}:00-${newConfig.dailyPolls.endHour}:00`,
        notificationsEnabled: newConfig.notifications.enabled
      });
      
      // Parar todos los schedulers actuales
      console.log('🛑 Parando schedulers actuales...');
      this.stopAllSchedulers();
      
      // Esperar un momento para asegurar que se pararon
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Actualizar configuración
      this.config = newConfig;
      
      // Reiniciar schedulers con nueva configuración
      console.log('🚀 Reiniciando schedulers con nueva configuración...');
      this.startDailyPollScheduler();
      this.startNotificationScheduler();
      this.startMonitoringScheduler();
      
      console.log('✅ ============ CONFIGURACIÓN RECARGADA EXITOSAMENTE ============');
      console.log('');
      console.log('🎯 Nueva configuración aplicada:');
      if (this.config.dailyPolls.enabled) {
        const startTime = `${(this.config.dailyPolls.startHour ?? 8).toString().padStart(2, '0')}:${(this.config.dailyPolls.startMinute ?? 0).toString().padStart(2, '0')}`;
        const endTime = `${(this.config.dailyPolls.endHour ?? 22).toString().padStart(2, '0')}:${(this.config.dailyPolls.endMinute ?? 0).toString().padStart(2, '0')}`;
        console.log(`  🗳️ Polls: ${this.config.dailyPolls.time} (${startTime} - ${endTime})`);
      } else {
        console.log('  🗳️ Polls: DESHABILITADO');
      }
      
      if (this.config.notifications.enabled) {
        console.log(`  🔔 Notificaciones: cada ${this.config.notifications.intervalHours}h`);
      } else {
        console.log('  🔔 Notificaciones: DESHABILITADO');
      }
      
      if (this.config.monitoring.enabled) {
        console.log(`  📊 Monitoreo: cada ${this.config.monitoring.intervalMinutes}min`);
      } else {
        console.log('  📊 Monitoreo: DESHABILITADO');
      }
      
      console.log('');
      console.log('💡 ¡No necesitas reiniciar manualmente! Los cambios se aplican automáticamente.');
      console.log('');
      
    } catch (error) {
      console.error('❌ Error recargando configuración:', error);
      console.log('⚠️ Continuando con configuración anterior...');
    }
  }

  private stopAllSchedulers() {
    this.scheduledTasks.forEach((task, index) => {
      task.stop();
      console.log(`  ✅ Scheduler ${index + 1} detenido`);
    });
    this.scheduledTasks = [];
  }

  private isWithinScheduledHours(): boolean {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinute;
    
    const startHour = this.config.dailyPolls.startHour ?? 8;
    const startMinute = this.config.dailyPolls.startMinute ?? 0;
    const endHour = this.config.dailyPolls.endHour ?? 22;
    const endMinute = this.config.dailyPolls.endMinute ?? 0;
    
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;
    
    // Si startTime < endTime (mismo día)
    if (startTotalMinutes < endTotalMinutes) {
      return currentTotalMinutes >= startTotalMinutes && currentTotalMinutes < endTotalMinutes;
    }
    // Si startTime > endTime (cruza medianoche)
    else if (startTotalMinutes > endTotalMinutes) {
      return currentTotalMinutes >= startTotalMinutes || currentTotalMinutes < endTotalMinutes;
    }
    // Si startTime == endTime (24 horas)
    else {
      return true;
    }
  }

  private async executeScript(scriptPath: string, args: string[] = []): Promise<{ success: boolean; output?: string; error?: string }> {
    try {
      const command = `npx tsx ${scriptPath} ${args.join(' ')}`;
      console.log(`🔄 Ejecutando: ${command}`);
      
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr) {
        console.warn(`⚠️ Warnings: ${stderr}`);
      }
      
      return { success: true, output: stdout };
    } catch (error: any) {
      console.error(`❌ Error ejecutando ${scriptPath}:`, error);
      return { success: false, error: error.toString() };
    }
  }

  startNotificationScheduler() {
    if (!this.config.notifications.enabled) {
      console.log('🔕 Notificaciones deshabilitadas');
      return;
    }

    // Ejecutar cada X horas
    const cronExpression = `0 */${this.config.notifications.intervalHours} * * *`;
    
    const task = cron.schedule(cronExpression, async () => {
      console.log(`🔔 [${new Date().toLocaleString()}] Ejecutando notificaciones inteligentes...`);
      
      const result = await this.executeScript('scripts/smart-notifications.ts');
      
      if (result.success) {
        console.log('✅ Notificaciones procesadas exitosamente');
      } else {
        console.log('❌ Error en notificaciones');
      }
    }, {
      timezone: 'America/Bogota'
    });

    this.scheduledTasks.push(task);
    task.start();
    
    console.log(`🔔 Scheduler de notificaciones iniciado (cada ${this.config.notifications.intervalHours} horas)`);
  }

  startDailyPollScheduler() {
    if (!this.config.dailyPolls.enabled) {
      console.log('🗳️  Polls diarios deshabilitados');
      return;
    }

    // Usar directamente el formato cron del config
    const cronExpression = this.config.dailyPolls.time;
    
    const task = cron.schedule(cronExpression, async () => {
      console.log(`🗳️ [${new Date().toLocaleString()}] Verificando horario para poll automático...`);
      
      // Verificar si estamos dentro del horario permitido
      if (!this.isWithinScheduledHours()) {
        const startHour = (this.config.dailyPolls.startHour ?? 8).toString().padStart(2, '0');
        const startMinute = (this.config.dailyPolls.startMinute ?? 0).toString().padStart(2, '0');
        const endHour = (this.config.dailyPolls.endHour ?? 22).toString().padStart(2, '0');
        const endMinute = (this.config.dailyPolls.endMinute ?? 0).toString().padStart(2, '0');
        
        console.log(`⏰ Fuera del horario de envío (${startHour}:${startMinute} - ${endHour}:${endMinute}). Poll omitido.`);
        return;
      }
      
      console.log(`🗳️ [${new Date().toLocaleString()}] Enviando poll automático...`);
      
      const result = await this.executeScript('scripts/auto-send-daily-poll.ts');
      
      if (result.success) {
        console.log('✅ Poll automático enviado exitosamente');
      } else {
        console.log('❌ Error enviando poll automático');
      }
      
      // Ejecutar una sola vez las notificaciones de torneo después del poll
      await this.executeScript('scripts/tournament-notifications.ts', ['--quiet']);
    }, {
      timezone: 'America/Bogota'
    });

    this.scheduledTasks.push(task);
    task.start();
    
    const startTime = `${(this.config.dailyPolls.startHour ?? 8).toString().padStart(2, '0')}:${(this.config.dailyPolls.startMinute ?? 0).toString().padStart(2, '0')}`;
    const endTime = `${(this.config.dailyPolls.endHour ?? 22).toString().padStart(2, '0')}:${(this.config.dailyPolls.endMinute ?? 0).toString().padStart(2, '0')}`;
    
    console.log(`🗳️ Scheduler de polls iniciado (${cronExpression})`);
    console.log(`⏰ Horario activo: ${startTime} - ${endTime}`);
  }

  startTournamentNotificationScheduler() {
    console.log('🏆 Iniciando scheduler de notificaciones de torneos...');
    
    // Procesar notificaciones de torneos cada 10 minutos en lugar de cada minuto
    // para evitar ejecuciones excesivas
    const cronExpression = '*/10 * * * *'; // cada 10 minutos
    
    const task = cron.schedule(cronExpression, async () => {
      console.log(`🏆 [${new Date().toLocaleString()}] Verificando notificaciones de torneos...`);
      const result = await this.executeScript('scripts/tournament-notifications.ts', ['--quiet']);
      
      if (!result.success) {
        console.log('⚠️ Error en procesamiento de notificaciones de torneos');
      }
    }, {
      timezone: 'America/Bogota'
    });

    this.scheduledTasks.push(task);
    task.start();
    
    console.log('🏆 Scheduler de notificaciones de torneos iniciado (cada 10 minutos)');
  }

  startMonitoringScheduler() {
    if (!this.config.monitoring.enabled) {
      console.log('📊 Monitoreo deshabilitado');
      return;
    }

    const cronExpression = `*/${this.config.monitoring.intervalMinutes} * * * *`;
    
    const task = cron.schedule(cronExpression, async () => {
      const now = new Date();
      console.log(`📊 [${now.toLocaleTimeString()}] Monitoreando sistema...`);
      
      const result = await this.executeScript('scripts/monitor-system.ts', ['--quiet']);
      
      if (!result.success) {
        console.log('⚠️ Detectado problema en el monitoreo del sistema');
      }
    }, {
      timezone: 'America/Bogota'
    });

    this.scheduledTasks.push(task);
    task.start();
    
    console.log(`📊 Scheduler de monitoreo iniciado (cada ${this.config.monitoring.intervalMinutes} min)`);
  }

  startPromotionalNotificationScheduler() {
    console.log('💰 Iniciando scheduler de notificaciones promocionales...');
    
    // Notificación matutina a las 10:00
    const morningTask = cron.schedule('0 10 * * *', async () => {
      console.log(`🌅 [${new Date().toLocaleString()}] Enviando notificaciones promocionales matutinas...`);
      
      const result = await this.executeScript('scripts/subscription-promotional-notifications.ts', ['morning']);
      
      if (result.success) {
        console.log('✅ Notificaciones promocionales matutinas enviadas');
      } else {
        console.log('❌ Error en notificaciones promocionales matutinas');
      }
    }, {
      timezone: 'Europe/Madrid'
    });
  
  // Notificación vespertina a las 18:00
  const eveningTask = cron.schedule('0 18 * * *', async () => {
    console.log(`🌆 [${new Date().toLocaleString()}] Enviando notificaciones promocionales vespertinas...`);
    
    const result = await this.executeScript('scripts/subscription-promotional-notifications.ts', ['evening']);
    
    if (result.success) {
      console.log('✅ Notificaciones promocionales vespertinas enviadas');
    } else {
      console.log('❌ Error en notificaciones promocionales vespertinas');
    }
  }, {
    timezone: 'Europe/Madrid'
  });
  
  this.scheduledTasks.push(morningTask, eveningTask);
  morningTask.start();
  eveningTask.start();
  
  console.log('💰 Scheduler de notificaciones promocionales iniciado:');
  console.log('  🌅 Matutinas: 10:00 AM');
  console.log('  🌆 Vespertinas: 18:00 PM');
}

startPremiumFeaturesNotificationScheduler() {
  if (!this.config.premiumFeaturesNotification?.enabled) {
    console.log('⏭️ Notificaciones de funcionalidades premium deshabilitadas');
    return;
  }

  console.log('🎓 Iniciando scheduler de notificaciones de funcionalidades premium...');
  
  const cronExpression = this.config.premiumFeaturesNotification.cronExpression || '0 16 * * *';
  const timezone = this.config.premiumFeaturesNotification.timezone || 'Europe/Madrid';
  
  // Notificación diaria a las 16:00
  const premiumTask = cron.schedule(cronExpression, async () => {
    console.log(`🎓 [${new Date().toLocaleString()}] Enviando notificación de funcionalidades premium...`);
    
    const result = await this.executeScript('scripts/premium-features-notification.ts');
    
    if (result.success) {
      console.log('✅ Notificación de funcionalidades premium enviada exitosamente');
    } else {
      console.log('❌ Error enviando notificación de funcionalidades premium:', result.error);
    }
  }, {
    timezone: timezone
  });

  this.scheduledTasks.push(premiumTask);
  premiumTask.start();
  
  console.log('🎓 Scheduler de funcionalidades premium iniciado:');
  console.log(`  ⏰ Horario: ${this.config.premiumFeaturesNotification.time}`);
  console.log(`  🌍 Zona horaria: ${timezone}`);
}

startAll() {
  console.log('🚀 INICIANDO SCHEDULER AUTOMÁTICO');
  console.log('=================================');
  console.log('');
  
  // Iniciar los schedulers en orden de prioridad
  this.startDailyPollScheduler();
  this.startNotificationScheduler();
  this.startTournamentNotificationScheduler();
  this.startMonitoringScheduler();
  this.startPromotionalNotificationScheduler();
  this.startPremiumFeaturesNotificationScheduler();
  
  console.log('');
  console.log('✅ Todos los schedulers iniciados');
  console.log('⏰ Sistema corriendo en segundo plano...');
  console.log('');
  console.log('📋 Configuración actual:');
  console.log(`  🗳️ Polls: ${this.config.dailyPolls.time} (${this.config.dailyPolls.frequency})`);
  console.log(`  🏆 Notificaciones de torneos: cada 10 minutos`);
  console.log(`  🔔 Notificaciones inteligentes: cada ${this.config.notifications.intervalHours} horas`);
  console.log(`  📊 Monitoreo: cada ${this.config.monitoring.intervalMinutes} minutos`);
  console.log('');
  console.log('📊 Para ver el estado: npx tsx scripts/monitor-system.ts');
  console.log('🛑 Para parar: Ctrl+C');
  
  // Mantener el proceso vivo
  process.on('SIGINT', () => {
    this.stopAll();
    process.exit(0);
  });
}

stopAll() {
  console.log('');
  console.log('🛑 Parando todos los schedulers...');
  
  this.scheduledTasks.forEach((task, index) => {
    task.stop();
    console.log(`✅ Scheduler ${index + 1} detenido`);
  });
  
  console.log('🏁 Scheduler automático detenido');
}

getStatus() {
  console.log('📊 ESTADO DE SCHEDULERS');
  console.log('========================');
  console.log('');
  
  console.log(`🔔 Notificaciones inteligentes: ${this.config.notifications.enabled ? '✅ ACTIVO' : '❌ INACTIVO'}`);
  if (this.config.notifications.enabled) {
    console.log(`   📅 Cada ${this.config.notifications.intervalHours} horas`);
    console.log(`   🔄 Reglas activas: ${this.config.notifications.enabledRules.join(', ')}`);
  }
  
  console.log(`🗳️  Polls diarios: ${this.config.dailyPolls.enabled ? '✅ ACTIVO' : '❌ INACTIVO'}`);
  if (this.config.dailyPolls.enabled) {
    const startTime = `${(this.config.dailyPolls.startHour ?? 8).toString().padStart(2, '0')}:${(this.config.dailyPolls.startMinute ?? 0).toString().padStart(2, '0')}`;
    const endTime = `${(this.config.dailyPolls.endHour ?? 22).toString().padStart(2, '0')}:${(this.config.dailyPolls.endMinute ?? 0).toString().padStart(2, '0')}`;
    console.log(`   ⏰ Programación: ${this.config.dailyPolls.time} (${this.config.dailyPolls.frequency})`);
    console.log(`   🕒 Horario activo: ${startTime} - ${endTime}`);
  }
  
  console.log(`🏆 Notificaciones de torneos: ✅ ACTIVO`);
  console.log(`   🔄 Cada 10 minutos`);
  
  console.log(`📊 Monitoreo: ${this.config.monitoring.enabled ? '✅ ACTIVO' : '❌ INACTIVO'}`);
  if (this.config.monitoring.enabled) {
    console.log(`   🔄 Cada ${this.config.monitoring.intervalMinutes} minutos`);
  }
  
  console.log(`💰 Notificaciones promocionales: ✅ ACTIVO`);
  console.log(`   🌅 Matutinas: 10:00 AM (Europe/Madrid)`);
  console.log(`   🌆 Vespertinas: 18:00 PM (Europe/Madrid)`);
  
  const premiumEnabled = this.config.premiumFeaturesNotification?.enabled ?? false;
  console.log(`🎓 Notificaciones funcionalidades premium: ${premiumEnabled ? '✅ ACTIVO' : '❌ INACTIVO'}`);
  if (premiumEnabled) {
    const time = this.config.premiumFeaturesNotification?.time || '16:00';
    const timezone = this.config.premiumFeaturesNotification?.timezone || 'Europe/Madrid';
    console.log(`   ⏰ Horario: ${time} (${timezone})`);
    console.log(`   📋 Descripción: ${this.config.premiumFeaturesNotification?.description || 'Promoción de funcionalidades premium'}`);
  }
  
  console.log('');
  console.log(`🏃 Tareas activas: ${this.scheduledTasks.filter(t => t.running).length}/${this.scheduledTasks.length}`);
  console.log(`⏰ Última actualización: ${new Date().toLocaleString()}`);
}

// Ejecutar una tarea manualmente
async runTask(taskName: string) {
  console.log(`🔧 Ejecutando tarea manual: ${taskName}`);
  
  switch (taskName) {
    case 'notifications':
      await this.executeScript('scripts/smart-notifications.ts');
      break;
    case 'poll':
      await this.executeScript('scripts/auto-send-daily-poll.ts');
      break;
    case 'monitor':
      await this.executeScript('scripts/monitor-system.ts');
      break;
    case 'tournament-notifications':
      await this.executeScript('scripts/tournament-notifications.ts');
      break;
    case 'premium-features':
      await this.executeScript('scripts/premium-features-notification.ts');
      break;
    default:
      console.log(`❌ Tarea desconocida: ${taskName}`);
      console.log('📋 Tareas disponibles: notifications, poll, monitor, tournament-notifications, premium-features');
  }
}
}

async function main() {
  const args = process.argv.slice(2);
  
  const scheduler = new NotificationScheduler();
  
  if (args.includes('--help')) {
    console.log('⏰ SCHEDULER AUTOMÁTICO:');
    console.log('');
    console.log('  🚀 Iniciar todos los schedulers:');
    console.log('     npx tsx scripts/notification-scheduler.ts');
    console.log('');
    console.log('  📊 Ver estado de schedulers:');
    console.log('     npx tsx scripts/notification-scheduler.ts --status');
    console.log('');
    console.log('  🔧 Ejecutar tarea manual:');
    console.log('     npx tsx scripts/notification-scheduler.ts --run <task>');
    console.log('     Tasks: notifications, poll, monitor');
    console.log('');
    console.log('  📋 Mostrar ayuda:');
    console.log('     npx tsx scripts/notification-scheduler.ts --help');
    console.log('');
    console.log('🎯 FUNCIONES AUTOMÁTICAS:');
    console.log('   • 🗳️ Envío de polls diarios (9:00 AM)');
    console.log('   • 🔔 Notificaciones inteligentes (cada 4h)');
    console.log('   • 📊 Monitoreo del sistema (cada 30min)');
    
  } else if (args.includes('--status')) {
    scheduler.getStatus();
    
  } else if (args.includes('--run')) {
    const taskIndex = args.indexOf('--run') + 1;
    const taskName = args[taskIndex];
    
    if (!taskName) {
      console.log('❌ Especifica una tarea: notifications, poll, monitor');
      return;
    }
    
    await scheduler.runTask(taskName);
    
  } else {
    // Modo normal: iniciar schedulers
    scheduler.startAll();
    
    // Mantener el proceso corriendo
    setInterval(() => {
      // Heartbeat cada 5 minutos
    }, 5 * 60 * 1000);
  }
}

// Solo ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

export { NotificationScheduler, SchedulerConfig };