#!/usr/bin/env tsx

/**
 * Railway Notification Scheduler
 * Script optimizado para ejecutar en Railway como servicio separado
 */

import { spawn } from 'child_process';
import path from 'path';

const isDev = process.argv.includes('--dev');
const isProduction = process.env.NODE_ENV === 'production';

console.log('🚀 Iniciando Railway Notification Scheduler...');
console.log(`📍 Entorno: ${isProduction ? 'PRODUCCIÓN' : 'DESARROLLO'}`);
console.log(`🔧 Modo dev: ${isDev}`);

// Configuración específica para Railway
process.env.TZ = 'Europe/Madrid'; // Zona horaria española
process.env.NODE_OPTIONS = '--max-old-space-size=512'; // Límite de memoria para Railway

// Función para manejar errores y reiniciar el proceso
function startScheduler() {
  const schedulerPath = path.join(__dirname, 'notification-scheduler.ts');
  
  console.log(`📂 Ejecutando: ${schedulerPath}`);
  
  const child = spawn('tsx', [schedulerPath], {
    stdio: 'inherit',
    env: {
      ...process.env,
      RAILWAY_SCHEDULER: 'true',
      NODE_ENV: isProduction ? 'production' : 'development'
    }
  });

  child.on('error', (error) => {
    console.error('❌ Error al iniciar el scheduler:', error);
    setTimeout(() => {
      console.log('🔄 Reintentando en 30 segundos...');
      startScheduler();
    }, 30000);
  });

  child.on('exit', (code, signal) => {
    console.log(`⚠️ Scheduler terminado con código: ${code}, señal: ${signal}`);
    
    if (code !== 0) {
      console.log('🔄 Reiniciando scheduler en 10 segundos...');
      setTimeout(startScheduler, 10000);
    }
  });

  // Manejar señales de terminación
  process.on('SIGTERM', () => {
    console.log('🛑 Recibida señal SIGTERM, terminando scheduler...');
    child.kill('SIGTERM');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('🛑 Recibida señal SIGINT, terminando scheduler...');
    child.kill('SIGINT');
    process.exit(0);
  });

  return child;
}

// Verificar que las dependencias estén disponibles
try {
  require('node-cron');
  console.log('✅ node-cron disponible');
} catch (error) {
  console.error('❌ node-cron no está disponible:', error);
  process.exit(1);
}

// Iniciar el scheduler
startScheduler();

console.log('🎯 Railway Scheduler iniciado correctamente');
console.log('📊 Para monitorear: railway logs --service scheduler');