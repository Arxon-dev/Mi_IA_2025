import fetch from 'node-fetch';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { prisma } from '../src/lib/prisma';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8039179482:AAG6bugxwgsmWLVHGoWpE5nih_PQpD3KPBs';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '-1002352049779';
const CONFIG_FILE = join(process.cwd(), 'scheduler-config.json');

interface NotificationRule {
  id: string;
  name: string;
  condition: (users: any[]) => any[];
  message: (users: any[]) => string;
  cooldown: number; // minutes
}

// Cargar configuración para obtener reglas habilitadas
function loadEnabledRules(): string[] {
  try {
    if (existsSync(CONFIG_FILE)) {
      const content = readFileSync(CONFIG_FILE, 'utf-8');
      const config = JSON.parse(content);
      return config.notifications?.enabledRules || [];
    }
  } catch (error) {
    console.warn('⚠️ Error leyendo configuración, usando todas las reglas:', error);
  }
  
  // Fallback: todas las reglas
  return ['streak_encouragement', 'level_celebration', 'inactive_users', 'high_performers', 'close_competition'];
}

// Función para validar si estamos dentro del horario permitido para notificaciones
function isWithinAllowedHours(): boolean {
  const now = new Date();
  const currentHour = now.getHours();
  
  // Cargar horarios desde configuración
  let startHour = 7;
  let endHour = 22;
  
  try {
    if (existsSync(CONFIG_FILE)) {
      const content = readFileSync(CONFIG_FILE, 'utf-8');
      const config = JSON.parse(content);
      startHour = config.notifications?.allowedHours?.startHour || 7;
      endHour = config.notifications?.allowedHours?.endHour || 22;
    }
  } catch (error) {
    console.warn('⚠️ Error leyendo configuración de horarios, usando valores por defecto (07:00-22:00)');
  }
  
  return currentHour >= startHour && currentHour < endHour;
}

// Función para obtener el próximo horario permitido
function getNextAllowedTime(): string {
  const now = new Date();
  const currentHour = now.getHours();
  
  // Cargar horarios desde configuración
  let startHour = 7;
  let endHour = 22;
  
  try {
    if (existsSync(CONFIG_FILE)) {
      const content = readFileSync(CONFIG_FILE, 'utf-8');
      const config = JSON.parse(content);
      startHour = config.notifications?.allowedHours?.startHour || 7;
      endHour = config.notifications?.allowedHours?.endHour || 22;
    }
  } catch (error) {
    // Usar valores por defecto
  }
  
  const startTimeStr = startHour.toString().padStart(2, '0') + ':00';
  
  if (currentHour < startHour) {
    return `las ${startTimeStr}`;
  } else if (currentHour >= endHour) {
    return `las ${startTimeStr} del día siguiente`;
  }
  
  return 'dentro del horario permitido';
}

// Definir reglas de notificación
const NOTIFICATION_RULES: NotificationRule[] = [
  {
    id: 'streak_encouragement',
    name: 'Motivación de rachas',
    condition: (users) => users.filter(u => u.streak >= 3 && u.streak <= 7),
    message: (users) => `🔥 <b>¡RACHAS EN MARCHA!</b> 🔥

${users.map(u => `🎯 ${u.firstname} lleva ${u.streak} días consecutivos`).join('\n')}

¡Sigan así! ¿Quién llegará a los 10 días? 💪`,
    cooldown: 720 // 12 horas
  },
  {
    id: 'level_celebration',
    name: 'Celebración de niveles',
    condition: (users) => {
      // Usuarios que subieron de nivel en las últimas 6 horas
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
      return users.filter(u => u.lastActivity && new Date(u.lastActivity) > sixHoursAgo && u.level >= 2);
    },
    message: (users) => `🎉 <b>¡NIVEL ALCANZADO!</b> 🎉

${users.map(u => `🏆 ${u.firstname} ha alcanzado el nivel ${u.level}!`).join('\n')}

¡Felicidades por el progreso! 🌟`,
    cooldown: 360 // 6 horas
  },
  {
    id: 'inactive_users',
    name: 'Reactivación de usuarios inactivos',
    condition: (users) => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      return users.filter(u => !u.lastActivity || new Date(u.lastActivity) < threeDaysAgo);
    },
    message: (users) => `📚 <b>¡TE EXTRAÑAMOS!</b> 📚

Algunos usuarios no han participado recientemente:
${users.slice(0, 3).map(u => `👋 ${u.firstname}`).join(', ')}

🎯 Hay nuevas preguntas esperando por ti
🏆 Tu posición en el ranking te está esperando
💡 ¡Cada respuesta cuenta para tu progreso!

¿Listos para el siguiente desafío? 🚀`,
    cooldown: 1440 // 24 horas
  },
  {
    id: 'high_performers',
    name: 'Reconocimiento a top performers',
    condition: (users) => users.filter(u => u.totalpoints >= 500 && u.level >= 3),
    message: (users) => `👑 <b>HALL OF FAME</b> 👑

Nuestros futuros permanentes con más de 500 puntos:
${users.map(u => `🥇 ${u.firstname} - ${u.totalpoints} pts (Nivel ${u.level})`).join('\n')}

¡Son un ejemplo para todos! 🌟
¿Quién más se unirá al club de los 500? 💪`,
    cooldown: 1440 // 24 horas
  },
  {
    id: 'close_competition',
    name: 'Competencia reñida',
    condition: (users) => {
      const sorted = users.sort((a, b) => b.totalpoints - a.totalpoints);
      if (sorted.length < 2) return [];
      const top1 = sorted[0];
      const top2 = sorted[1];
      const difference = top1.totalpoints - top2.totalpoints;
      return difference <= 50 ? [top1, top2] : [];
    },
    message: (users) => `⚔️ <b>¡COMPETENCIA REÑIDA!</b> ⚔️

🥇 ${users[0].firstname}: ${users[0].totalpoints} pts
🥈 ${users[1].firstname}: ${users[1].totalpoints} pts

¡Solo ${users[0].totalpoints - users[1].totalpoints} puntos de diferencia!

¿Quién tomará la delantera? 🏃‍♂️💨`,
    cooldown: 480 // 8 horas
  }
];

async function sendNotification(message: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    });

    const result = await response.json() as any;
    return result.ok;
  } catch (error) {
    console.error('Error enviando notificación:', error);
    return false;
  }
}

async function checkNotificationCooldown(ruleId: string, cooldownMinutes: number): Promise<boolean> {
  try {
    // Verificar si ya se envió esta notificación recientemente
    const recentLog = await prisma.telegramsendlog.findFirst({
      where: {
        questionid: `notification_${ruleId}`,
        sendtime: {
          gte: new Date(Date.now() - cooldownMinutes * 60 * 1000)
        }
      }
    });

    return !recentLog; // true si NO hay log reciente (puede enviar)
  } catch (error) {
    console.error('Error verificando cooldown:', error);
    return false;
  }
}

async function logNotification(ruleId: string, success: boolean): Promise<void> {
  try {
    await prisma.telegramsendlog.create({
      data: {
        id: `notif_${ruleId}_${Date.now()}`,
        questionid: `notification_${ruleId}`,
        sourcemodel: 'notification',
        success,
        telegrammsgid: success ? `notif_${Date.now()}` : null
      }
    });
  } catch (error) {
    console.error('Error logging notification:', error);
  }
}

async function runSmartNotifications() {
  console.log('🧠 SISTEMA DE NOTIFICACIONES INTELIGENTES');
  console.log('=========================================');
  console.log('');

  try {
    // Verificar horario permitido antes de procesar notificaciones
    if (!isWithinAllowedHours()) {
      const now = new Date();
      const nextTime = getNextAllowedTime();
      console.log(`⏰ FUERA DE HORARIO PERMITIDO`);
      console.log(`🕐 Hora actual: ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
      // Obtener horarios desde configuración para mostrar en el log
      let startHour = 7;
      let endHour = 22;
      try {
        if (existsSync(CONFIG_FILE)) {
          const content = readFileSync(CONFIG_FILE, 'utf-8');
          const config = JSON.parse(content);
          startHour = config.notifications?.allowedHours?.startHour || 7;
          endHour = config.notifications?.allowedHours?.endHour || 22;
        }
      } catch (error) {
        // Usar valores por defecto
      }
      
      const startTimeStr = startHour.toString().padStart(2, '0') + ':00';
      const endTimeStr = endHour.toString().padStart(2, '0') + ':00';
      console.log(`🚫 Horario permitido: ${startTimeStr} - ${endTimeStr}`);
      console.log(`⏳ Próximo envío permitido: ${nextTime}`);
      console.log('📵 Notificaciones omitidas para respetar horario de descanso');
      return;
    }
    
    // Mostrar horario permitido actual
    let startHour = 7;
    let endHour = 22;
    try {
      if (existsSync(CONFIG_FILE)) {
        const content = readFileSync(CONFIG_FILE, 'utf-8');
        const config = JSON.parse(content);
        startHour = config.notifications?.allowedHours?.startHour || 7;
        endHour = config.notifications?.allowedHours?.endHour || 22;
      }
    } catch (error) {
      // Usar valores por defecto
    }
    
    const startTimeStr = startHour.toString().padStart(2, '0') + ':00';
    const endTimeStr = endHour.toString().padStart(2, '0') + ':00';
    console.log(`✅ Dentro del horario permitido (${startTimeStr} - ${endTimeStr})`);
    
    // Cargar reglas habilitadas desde configuración
    const enabledRules = loadEnabledRules();
    console.log('📋 Reglas habilitadas:', enabledRules);
    
    // Filtrar solo las reglas habilitadas
    const activeRules = NOTIFICATION_RULES.filter(rule => enabledRules.includes(rule.id));
    console.log(`✅ Evaluando ${activeRules.length} de ${NOTIFICATION_RULES.length} reglas disponibles`);
    
    if (activeRules.length === 0) {
      console.log('⚠️ No hay reglas habilitadas. Configuración necesaria.');
      return;
    }
    
    // Obtener todos los usuarios con sus estadísticas
    const users = await prisma.telegramuser.findMany({
      select: {
        id: true,
        telegramuserid: true,
        firstname: true,
        lastname: true,
        totalpoints: true,
        level: true,
        streak: true,
        lastactivity: true
      }
    });

    // Obtener conteo de respuestas para cada usuario
    const usersWithResponses = await Promise.all(
      users.map(async (user) => {
        const responseCount = await prisma.telegramresponse.count({
          where: { userid: user.telegramuserid }
        });
        return {
          ...user,
          responseCount
        };
      })
    );

    console.log(`📊 Analizando ${usersWithResponses.length} usuarios...`);

    // Procesar cada regla habilitada
    for (const rule of activeRules) {
      console.log(`🔍 Evaluando regla: ${rule.name} (${rule.id})`);
      
      // Verificar cooldown
      const canSend = await checkNotificationCooldown(rule.id, rule.cooldown);
      if (!canSend) {
        console.log(`⏰ Regla ${rule.name} en cooldown`);
        continue;
      }
      
      // Evaluar condición
      const matchingUsers = rule.condition(usersWithResponses);
      
      if (matchingUsers.length > 0) {
        console.log(`✅ Regla ${rule.name} activada para ${matchingUsers.length} usuarios`);
        
        // Generar mensaje
        const message = rule.message(matchingUsers);
        
        // Enviar notificación
        const sent = await sendNotification(message);
        
        if (sent) {
          console.log(`📤 Notificación "${rule.name}" enviada exitosamente`);
          await logNotification(rule.id, true);
        } else {
          console.log(`❌ Error enviando notificación "${rule.name}"`);
          await logNotification(rule.id, false);
        }
        
        // Solo enviar una notificación por ejecución para evitar spam
        break;
      } else {
        console.log(`⚪ Regla ${rule.name} no cumple condiciones`);
      }
    }

    console.log('');
    console.log('✅ Análisis de notificaciones completado');

  } catch (error) {
    console.error('❌ Error en sistema de notificaciones:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function testNotification() {
  console.log('🧪 PRUEBA DE NOTIFICACIÓN');
  console.log('=========================');
  
  const testMessage = `🧪 <b>PRUEBA DEL SISTEMA DE NOTIFICACIONES</b> 🧪

Este es un mensaje de prueba para verificar que el sistema de notificaciones inteligentes funciona correctamente.

✅ Si ves este mensaje, ¡el sistema está funcionando!
🤖 Las notificaciones automáticas están activas
📊 El bot monitoreará la actividad y enviará mensajes contextuales

🔔 Próximos tipos de notificaciones:
• 🔥 Motivación de rachas
• 🏆 Celebraciones de nivel
• 👋 Reactivación de usuarios inactivos
• 👑 Reconocimiento a top performers
• ⚔️ Competencias reñidas

¡Sistema de notificaciones activado! 🚀`;

  const sent = await sendNotification(testMessage);
  
  if (sent) {
    console.log('✅ Notificación de prueba enviada exitosamente');
  } else {
    console.log('❌ Error enviando notificación de prueba');
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--test')) {
    await testNotification();
  } else if (args.includes('--help')) {
    console.log('🧠 SISTEMA DE NOTIFICACIONES INTELIGENTES:');
    console.log('');
    console.log('  🚀 Ejecutar análisis y envío:');
    console.log('     npx tsx scripts/smart-notifications.ts');
    console.log('');
    console.log('  🧪 Enviar notificación de prueba:');
    console.log('     npx tsx scripts/smart-notifications.ts --test');
    console.log('');
    console.log('  📋 Mostrar ayuda:');
    console.log('     npx tsx scripts/smart-notifications.ts --help');
    console.log('');
    
    // Mostrar reglas disponibles y cuáles están habilitadas
    const enabledRules = loadEnabledRules();
    console.log('🔔 REGLAS DE NOTIFICACIÓN:');
    NOTIFICATION_RULES.forEach((rule, index) => {
      const isEnabled = enabledRules.includes(rule.id);
      const status = isEnabled ? '✅ HABILITADA' : '❌ DESHABILITADA';
      console.log(`   ${index + 1}. ${rule.name} - ${status} (cada ${rule.cooldown} min)`);
    });
    console.log('');
    console.log('💡 Configura las reglas en: http://localhost:3000/admin/scheduler');
  } else {
    await runSmartNotifications();
  }
}

main();