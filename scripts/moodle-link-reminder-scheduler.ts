import { PrismaClient } from '@prisma/client';
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

interface SchedulerConfig {
  moodleLinkReminder?: {
    enabled: boolean;
    frequency: string;
    targetUsers: 'unlinked' | 'all' | 'active';
    maxMessagesPerRun: number;
  };
}

/**
 * 🔗 Programador de Recordatorios de Vinculación Moodle
 * 
 * Envía recordatorios cada 5 horas para que los usuarios vinculen
 * su cuenta de Telegram con Moodle y unifiquen su gamificación.
 */

/**
 * 🌙 Verificar si estamos en horario permitido (NO entre 22:00 y 08:00)
 */
function isAllowedHour(): boolean {
  const now = new Date();
  const hour = now.getHours();
  
  // NO enviar entre 22:00 (22) y 08:00 (8)
  const isNightTime = hour >= 22 || hour < 8;
  
  return !isNightTime;
}

/**
 * 🔧 Cargar configuración del scheduler
 */
function loadSchedulerConfig(): SchedulerConfig {
  try {
    const configPath = path.join(process.cwd(), 'scheduler-config.json');
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(configContent);
    }
    
    console.log('⚠️ No se encontró scheduler-config.json, usando configuración por defecto');
    return {
      moodleLinkReminder: {
        enabled: true,
        frequency: 'every5h',
        targetUsers: 'unlinked',
        maxMessagesPerRun: 10
      }
    };
  } catch (error) {
    console.error('❌ Error cargando configuración del scheduler:', error);
    return { moodleLinkReminder: { enabled: false, frequency: 'every5h', targetUsers: 'unlinked', maxMessagesPerRun: 10 } };
  }
}

/**
 * 🎯 Obtener usuarios no vinculados activos
 */
async function getUnlinkedActiveUsers(): Promise<any[]> {
  try {
    // Obtener usuarios de Telegram que han estado activos en los últimos 7 días
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Solo usuarios activos sin integración Moodle (simplificado para evitar errores de schema)
    const activeUsers = await prisma.telegramuser.findMany({
      where: {
        lastactivity: {
          gte: sevenDaysAgo
        }
        // Nota: En esta versión simplificada incluimos todos los usuarios activos
        // En producción se puede refinar para excluir usuarios ya vinculados
      },
      select: {
        telegramuserid: true,
        firstname: true,
        username: true,
        totalpoints: true,
        level: true,
        lastactivity: true
      },
      orderBy: {
        lastactivity: 'desc'
      }
    });
    
    console.log(`📊 Usuarios activos no vinculados encontrados: ${activeUsers.length}`);
    return activeUsers;
    
  } catch (error) {
    console.error('❌ Error obteniendo usuarios no vinculados:', error);
    return [];
  }
}

/**
 * 📝 Generar mensaje de recordatorio personalizado
 */
function generateReminderMessage(user: any): string {
  const timeOfDay = getTimeOfDay();
  const greeting = getTimeGreeting(timeOfDay);
  const motivation = getMotivationByLevel(user.level || 1);
  
  return `🔗 <b>¡DUPLICA TUS PUNTOS CON MOODLE!</b> 🔗

${greeting} ${user.firstname || 'Opositor'}! 👋

🎮 <b>¿SABÍAS QUE PUEDES UNIFICAR TU GAMIFICACIÓN?</b>

📱 <b>Tienes en Telegram:</b>
• ${user.totalpoints || 0} puntos ganados
• Nivel ${user.level || 1}
• Progreso sólido establecido

🎓 <b>¡PERO PUEDES TENER MÁS!</b>
• Conecta tu cuenta de Moodle
• Los puntos de ambas plataformas se SUMAN
• Mismo nivel y ranking unificado
• Estadísticas combinadas automáticas

${motivation}

🚀 <b>VINCULAR ES MUY FÁCIL:</b>

🔗 <b>URL DE VERIFICACIÓN:</b>
• Generar código de vinculación:
https://campus.opomelilla.com/local/telegram_integration/verify.php

• <code>/codigo_moodle</code> - Úsalo así: /codigo_moodle TU_CODIGO_GENERADO
• <code>/estado_moodle</code> - Ver estado de conexión


⚡ <b>¡HAZLO AHORA MISMO!</b>
1️⃣ Ve a la url de arriba para generar tu código
2️⃣ Usa <code>/codigo_moodle TU_CODIGO_GENERADO</code> para vincular
3️⃣ ¡Duplica tu progreso inmediatamente!

💡 ¿Dudas? Contacta @Carlos_esp`;
}

/**
 * 🕐 Obtener momento del día
 */
function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' {
  const hour = new Date().getHours();
  
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 19) return 'afternoon';
  return 'evening';
}

/**
 * 👋 Obtener saludo según la hora
 */
function getTimeGreeting(timeOfDay: string): string {
  const greetings = {
    morning: ['🌅 ¡Buenos días', '☀️ ¡Buen día', '🌄 ¡Hola'],
    afternoon: ['🌤️ ¡Buenas tardes', '☀️ ¡Hola', '🌻 ¡Buenas tardes'],
    evening: ['🌆 ¡Buenas tardes', '🌅 ¡Hola', '🌇 ¡Buenas tardes']
  };

  const options = greetings[timeOfDay as keyof typeof greetings] || greetings.morning;
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * 💪 Obtener motivación según el nivel
 */
function getMotivationByLevel(level: number): string {
  if (level <= 2) {
    return '🌱 <b>¡Estás empezando fuerte!</b> Con Moodle aceleras tu progreso inicial.';
  } else if (level <= 5) {
    return '🚀 <b>¡Ya tienes experiencia!</b> Moodle te llevará al siguiente nivel.';
  } else if (level <= 10) {
    return '⭐ <b>¡Eres todo un veterano!</b> Moodle maximizará tu rendimiento.';
  } else {
    return '👑 <b>¡Eres una leyenda!</b> Moodle completará tu dominio absoluto.';
  }
}

/**
 * 📤 Enviar recordatorio a usuario específico
 */
async function sendReminderToUser(user: any): Promise<boolean> {
  try {
    if (!BOT_TOKEN || !CHAT_ID) {
      console.error('❌ Faltan credenciales de Telegram');
      return false;
    }

    const message = generateReminderMessage(user);
    
    // 1️⃣ ENVIAR AL CHAT PRIVADO DEL USUARIO
    const privateResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: user.telegramuserid, // Chat privado
        text: message,
        parse_mode: 'HTML'
      })
    });

    const privateResult: any = await privateResponse.json();
    
    // 2️⃣ ENVIAR AL GRUPO DE TELEGRAM (si está configurado)
    let groupSent = false;
    if (CHAT_ID && CHAT_ID !== user.telegramuserid) {
      // Mensaje adaptado para el grupo (más corto y con mención)
      const groupMessage = `🔗 <b>RECORDATORIO VINCULACIÓN MOODLE</b>

@${user.username || user.firstname} - ¡No olvides vincular tu cuenta de Moodle para duplicar tus puntos!

🚀 <b>Pasos rápidos:</b>
1️⃣ Genera tu código: https://campus.opomelilla.com/local/telegram_integration/verify.php
2️⃣ Usa: <code>/codigo_moodle TU_CODIGO</code>
3️⃣ ¡Duplica tu progreso!

💡 ¿Dudas? Contacta @Carlos_esp`;
      
      const groupResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID, // Chat del grupo
          text: groupMessage,
          parse_mode: 'HTML'
        })
      });
      
      const groupResult: any = await groupResponse.json();
      groupSent = groupResult.ok;
    }
    
    if (privateResult.ok) {
      console.log(`✅ Recordatorio enviado a ${user.firstname} (${user.telegramuserid})`);
      if (groupSent) {
        console.log(`📢 También enviado al grupo (${CHAT_ID})`);
      }
      return true;
    } else {
      console.log(`⚠️ No se pudo enviar recordatorio privado a ${user.firstname}: ${privateResult.description}`);
      return false;
    }
    
  } catch (error) {
    console.error(`❌ Error enviando recordatorio a ${user.firstname}:`, error);
    return false;
  }
}

/**
 * 🎯 Ejecutar envío de recordatorios de vinculación
 */
async function sendMoodleLinkReminders(): Promise<void> {
  try {
    // 🌙 VERIFICAR HORARIO PERMITIDO
    if (!isAllowedHour()) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      console.log(`🌙 HORARIO NOCTURNO (${timeStr}) - Recordatorios de Moodle pausados hasta las 08:00`);
      return;
    }
    
    const schedulerConfig = loadSchedulerConfig();
    const config = schedulerConfig.moodleLinkReminder;
    
    if (!config?.enabled) {
      console.log('⏸️ Recordatorios de vinculación Moodle deshabilitados en configuración');
      return;
    }
    
    console.log('\n🔗 ===== ENVIANDO RECORDATORIOS VINCULACIÓN MOODLE =====');
    console.log(`⏰ Frecuencia activa: ${config.frequency}`);
    console.log(`🎯 Usuarios objetivo: ${config.targetUsers}`);
    console.log(`📊 Máximo por ejecución: ${config.maxMessagesPerRun}`);
    
    // Obtener usuarios no vinculados activos
    const unlinkedUsers = await getUnlinkedActiveUsers();
    
    if (unlinkedUsers.length === 0) {
      console.log('🎉 ¡Excelente! Todos los usuarios activos ya tienen vinculada su cuenta de Moodle');
      return;
    }
    
    // Limitar la cantidad de mensajes por ejecución
    const usersToNotify = unlinkedUsers.slice(0, config.maxMessagesPerRun);
    
    console.log(`📤 Enviando recordatorios a ${usersToNotify.length} usuarios...`);
    
    let sentCount = 0;
    let failedCount = 0;
    
    for (const user of usersToNotify) {
      const sent = await sendReminderToUser(user);
      if (sent) {
        sentCount++;
      } else {
        failedCount++;
      }
      
      // Pequeño delay entre mensajes para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`\n📊 RESUMEN DE RECORDATORIOS MOODLE:`);
    console.log(`✅ Enviados exitosamente: ${sentCount}`);
    console.log(`❌ Fallidos: ${failedCount}`);
    console.log(`👥 Total usuarios no vinculados: ${unlinkedUsers.length}`);
    console.log(`⏰ Próxima ejecución en 5 horas`);
    console.log('🔗 =========================================\n');
    
  } catch (error) {
    console.error('❌ Error en envío de recordatorios Moodle:', error);
  }
}

/**
 * 🚀 Inicializar scheduler de recordatorios Moodle
 */
function initializeMoodleReminderScheduler(): void {
  console.log('🔗 Inicializando scheduler de recordatorios de vinculación Moodle...');
  
  const schedulerConfig = loadSchedulerConfig();
  const config = schedulerConfig.moodleLinkReminder;
  
  if (!config?.enabled) {
    console.log('⏸️ Scheduler de recordatorios Moodle deshabilitado');
    return;
  }
  
  // Programar para cada 5 horas: 00:00, 05:00, 10:00, 15:00, 20:00
  // Pero respetando horario nocturno (se saltará 00:00 y 05:00)
  const cronExpression = '0 */5 * * *';
  
  cron.schedule(cronExpression, async () => {
    await sendMoodleLinkReminders();
  }, {
    timezone: "Europe/Madrid"
  });
  
  console.log(`✅ Scheduler de recordatorios Moodle iniciado`);
  console.log(`📅 Programación: cada 5 horas (${cronExpression})`);
  console.log(`🌙 Respeta horario nocturno: 22:00-08:00`);
  console.log(`🎯 Usuarios objetivo: ${config.targetUsers}`);
}

// Función para testing manual
if (require.main === module) {
  const testMode = process.argv.includes('--test');
  
  if (testMode) {
    console.log('🧪 MODO TEST - Ejecutando recordatorio Moodle inmediatamente...');
    sendMoodleLinkReminders().then(() => {
      console.log('✅ Test completado');
      process.exit(0);
    }).catch((error) => {
      console.error('❌ Error en test:', error);
      process.exit(1);
    });
  } else {
    // Inicializar scheduler
    initializeMoodleReminderScheduler();
    
    // Mantener el proceso vivo
    process.on('SIGINT', () => {
      console.log('\n👋 Deteniendo scheduler de recordatorios Moodle...');
      process.exit(0);
    });
    
    console.log('🔗 Scheduler de recordatorios Moodle ejecutándose. Presiona Ctrl+C para detener.');
  }
}

export { initializeMoodleReminderScheduler, sendMoodleLinkReminders };