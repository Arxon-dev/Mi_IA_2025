import cron from 'node-cron';
import { prisma } from '../src/lib/prisma';
import { readFileSync } from 'fs';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8039179482:AAG6bugxwgsmWLVHGoWpE5nih_PQpD3KPBs';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '-1002352049779';

interface RankingUser {
  telegramuserid: string;
  firstname: string;
  username?: string;
  totalpoints: number;
  level: number;
  streak: number;
  totalResponses: number;
  correctResponses: number;
  incorrectResponses: number;
  accuracy: number;
  averageResponseTime: number;
  weeklyPoints: number;
  lastActive: Date;
}

type FrequencyKey = 'test' | 'hourly' | 'every3h' | 'every4h' | 'every6h' | 'daily' | 'evening' | 'weekly';

// 🎯 CONFIGURACIÓN DEL RANKING AUTOMÁTICO
const RANKING_CONFIG: {
  frequencies: Record<FrequencyKey, string>;
  active: {
    frequency: FrequencyKey;
    enabled: boolean;
    includeWeeklyStats: boolean;
    showFailStats: boolean;
    topUsersCount: number;
    showAverageTime: boolean;
    showAccuracy: boolean;
    includeMemes: boolean;
  };
} = {
  // Frecuencias disponibles (puedes cambiar cualquiera)
  frequencies: {
    test: '*/2 * * * *',      // Cada 2 minutos (para pruebas)
    hourly: '0 * * * *',      // Cada hora en punto
    every3h: '0 */3 * * *',   // Cada 3 horas
    every4h: '0 */4 * * *',   // Cada 4 horas
    every6h: '0 */6 * * *',   // Cada 6 horas  
    daily: '0 12 * * *',      // Diario a las 12:00 PM
    evening: '0 20 * * *',    // Diario a las 8:00 PM
    weekly: '0 10 * * 1',     // Lunes a las 10:00 AM
  },
  
  // Configuración activa (cambia aquí la frecuencia)
  active: {
    frequency: 'every4h',      // 🔧 CAMBIA ESTO: test, hourly, every3h, every4h, every6h, daily, evening, weekly
    enabled: true,
    includeWeeklyStats: true,
    showFailStats: true,
    topUsersCount: 8,
    showAverageTime: true,
    showAccuracy: true,
    includeMemes: true         // Añade emojis y frases motivacionales
  }
};

async function fetchRankingData(): Promise<RankingUser[]> {
  console.log('📊 Obteniendo datos del ranking...');

  // Obtener usuarios con todas sus estadísticas
  const users = await prisma.telegramuser.findMany({
    select: {
      telegramuserid: true,
      firstname: true,
      username: true,
      totalpoints: true,
      level: true,
      streak: true,
      lastActivity: true,
      responses: {
        select: {
          iscorrect: true,
          responsetime: true,
          answeredAt: true,
          points: true
        }
      }
    },
    orderBy: { totalpoints: 'desc' }
  });

  // Calcular estadísticas de la última semana
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const weeklyResponses = await prisma.telegramResponse.groupBy({
    by: ['userid'],
    where: { answeredAt: { gte: oneWeekAgo } },
    _sum: { points: true },
    _avg: { responsetime: true },
    _count: { id: true }
  });

  // Crear mapa de estadísticas semanales
  const weeklyStatsMap = new Map();
  weeklyResponses.forEach(stat => {
    weeklyStatsMap.set(stat.userid, {
      weeklyPoints: stat._sum.points || 0,
      avgTime: Math.round(stat._avg.responsetime || 0),
      weeklyCount: stat._count.id
    });
  });

  // Combinar datos
  const rankingUsers: RankingUser[] = [];
  
  for (const user of users) {
    // Buscar ID interno del usuario
    const userRecord = await prisma.telegramuser.findUnique({
      where: { telegramuserid: user.telegramuserid },
      select: { id: true }
    });

    const weeklyStats = userRecord ? weeklyStatsMap.get(userRecord.id) : null;
    
    // Calcular estadísticas desde las respuestas
    const totalResponses = user.responses.length;
    const correctResponses = user.responses.filter(r => r.iscorrect).length;
    const avgResponseTime = totalResponses > 0 
      ? Math.round(user.responses.reduce((sum, r) => sum + (r.responsetime || 0), 0) / totalResponses)
      : 0;
    
    rankingUsers.push({
      telegramuserid: user.telegramuserid,
      firstname: user.firstname || 'Usuario',
      username: user.username || undefined,
      totalpoints: user.totalpoints,
      level: user.level,
      streak: user.streak,
      totalResponses,
      correctResponses,
      incorrectResponses: totalResponses - correctResponses,
      accuracy: totalResponses > 0 ? Math.round((correctResponses / totalResponses) * 100) : 0,
      averageResponseTime: weeklyStats?.avgTime || avgResponseTime,
      weeklyPoints: weeklyStats?.weeklyPoints || 0,
      lastActive: user.lastActivity
    });
  }

  return rankingUsers;
}

function generateRankingMessage(users: RankingUser[]): string {
  const config = RANKING_CONFIG.active;
  const now = new Date();
  const timeStr = now.toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  const dateStr = now.toLocaleDateString('es-ES', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });

  // Emojis aleatorios para hacer más dinámico
  const trophyEmojis = ['🏆', '👑', '🎯', '⭐', '🔥', '💎'];
  const randomTrophy = trophyEmojis[Math.floor(Math.random() * trophyEmojis.length)];

  let message = `${randomTrophy} <b>RANKING ACTUALIZADO</b> ${randomTrophy}\n`;
  message += `📅 ${dateStr} - 🕐 ${timeStr}\n\n`;

  if (users.length === 0) {
    message += '📊 <i>No hay actividad registrada aún</i>\n\n';
    message += '💡 ¡Responde preguntas para aparecer aquí!';
    return message;
  }

  const topUsers = users.slice(0, config.topUsersCount);

  topUsers.forEach((user, index) => {
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : 
                 index === 3 ? '🏅' : '🔸';
    const name = user.username || user.firstname || 'Usuario';
    
    message += `${medal} <b>${index + 1}.</b> ${name}\n`;
    message += `   📊 ${user.totalpoints} pts total | ${getLevelEmoji(user.level)} Nv.${user.level} | 🔥 ${user.streak} días\n`;
    
    if (config.showFailStats && user.totalResponses > 0) {
      message += `   ✅ ${user.correctResponses} aciertos | ❌ ${user.incorrectResponses} fallos`;
      
      if (config.showAccuracy) {
        const accuracyEmoji = user.accuracy >= 80 ? '🎯' : user.accuracy >= 60 ? '📈' : '📊';
        message += ` | ${accuracyEmoji} ${user.accuracy}%`;
      }
      
      if (config.showAverageTime && user.averageResponseTime > 0) {
        const speedEmoji = user.averageResponseTime <= 15 ? '⚡' : user.averageResponseTime <= 30 ? '🏃' : '🚶';
        message += ` | ${speedEmoji} ${user.averageResponseTime}s`;
      }
      
      message += '\n';
    }
    
    if (config.includeWeeklyStats && user.weeklyPoints > 0) {
      message += `   📈 ${user.weeklyPoints} pts esta semana\n`;
    }
    
    message += '\n';
  });

  // Estadísticas generales
  const totalUsers = users.length;
  const activeThisWeek = users.filter(u => u.weeklyPoints > 0).length;
  const topStreakUser = users.reduce((prev, current) => 
    prev.streak > current.streak ? prev : current
  );

  message += `📈 <b>ESTADÍSTICAS GENERALES:</b>\n`;
  message += `👥 ${totalUsers} usuarios activos | 🔥 Racha top: ${topStreakUser.streak} días\n`;
  message += `📊 ${activeThisWeek} usuarios activos esta semana\n\n`;

  // Frases motivacionales aleatorias
  if (config.includeMemes) {
    const motivationalPhrases = [
      '💪 ¡Sigue así! ¡La plaza te espera!',
      '🎯 ¡Cada respuesta te acerca a ser PERMANENTE!',
      '🔥 ¡El estudio constante es la clave del éxito!',
      '⭐ ¡Brillen como las estrellas que son!',
      '🚀 ¡Despeguen hacia su futuro como funcionarios!',
      '💎 ¡Cada pregunta los convierte en diamantes!',
      '🏆 ¡Champions de las oposiciones!',
      '⚡ ¡Velocidad y precisión = ÉXITO!',
      '🎪 ¡El circo de los puntos continúa!',
      '🎭 ¡Drama y emoción en cada ranking!'
    ];
    
    const randomPhrase = motivationalPhrases[Math.floor(Math.random() * motivationalPhrases.length)];
    message += randomPhrase + '\n\n';
  }

  // CTAs ACCIONABLES MEJORADOS
  message += `🎯 <b>ACELERA TU PROGRESO:</b>\n`;
  if (topUsers.length > 0) {
    const topUser = topUsers[0];
    const topUserName = topUser.username || topUser.firstname;
    message += `• <code>/duelo @${topUserName}</code> - Reta al #1 actual\n`;
  }
  if (topUsers.length > 1) {
    const secondUser = topUsers[1];
    const secondUserName = secondUser.username || secondUser.firstname;
    message += `• <code>/duelo @${secondUserName}</code> - Desafía al #2\n`;
  }
  message += `• <code>/torneo</code> - Únete al torneo activo\n`;
  message += `• <code>/simulacro</code> - Simulacro oficial\n\n`;

  message += `📊 <b>VE TU POSICIÓN:</b>\n`;
  message += `• <code>/mi_stats</code> - Tu rendimiento completo\n`;
  message += `• <code>/ranking</code> - Ranking actualizado\n`;
  message += `• <code>/progreso</code> - Tu evolución diaria\n\n`;

  message += `🔥 <b>¡Sube posiciones estudiando!</b>`;

  return message;
}

function getLevelEmoji(level: number): string {
  if (level >= 10) return '💎';
  if (level >= 8) return '👑';
  if (level >= 6) return '🏆';
  if (level >= 4) return '⭐';
  if (level >= 2) return '🔥';
  return '📖';
}

async function sendRankingMessage(message: string): Promise<boolean> {
  try {
    console.log('📤 Enviando ranking automático...');
    
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
    
    if (result.ok) {
      console.log(`✅ Ranking enviado exitosamente (ID: ${result.result.message_id})`);
      return true;
    } else {
      console.error('❌ Error en respuesta de Telegram:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Error enviando ranking:', error);
    return false;
  }
}

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

async function generateAndSendRanking(): Promise<void> {
  try {
    // 🌙 VERIFICAR HORARIO PERMITIDO
    if (!isAllowedHour()) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      console.log(`🌙 Ranking general omitido - Horario nocturno (${timeStr})`);
      console.log('💤 Respetando horas de descanso (22:00-08:00)');
      return;
    }
    
    console.log('\n🏆 ===== GENERANDO RANKING AUTOMÁTICO =====');
    console.log(`⏰ Frecuencia activa: ${RANKING_CONFIG.active.frequency}`);
    console.log(`🎯 Configuración: Top ${RANKING_CONFIG.active.topUsersCount} usuarios`);
    
    const users = await fetchRankingData();
    const message = generateRankingMessage(users);
    const success = await sendRankingMessage(message);
    
    if (success) {
      console.log('🎉 Ranking automático completado exitosamente');
      
      // Log de estadísticas para debugging
      console.log('📊 Resumen enviado:', {
        totalUsers: users.length,
        topUser: users[0] ? `${users[0].firstname} (${users[0].totalpoints} pts)` : 'No hay usuarios',
        activeThisWeek: users.filter(u => u.weeklyPoints > 0).length
      });
    } else {
      console.error('❌ Fallo en el envío del ranking automático');
    }
    
  } catch (error) {
    console.error('❌ Error en generateAndSendRanking:', error);
  }
}

function startRankingScheduler(): void {
  const config = RANKING_CONFIG.active;
  
  if (!config.enabled) {
    console.log('❌ Ranking automático deshabilitado en configuración');
    return;
  }

  const cronExpression = RANKING_CONFIG.frequencies[config.frequency];
  
  if (!cronExpression) {
    console.error('❌ Frecuencia inválida:', config.frequency);
    return;
  }

  console.log('🚀 ===== INICIANDO SCHEDULER DE RANKING AUTOMÁTICO =====');
  console.log(`⏰ Frecuencia: ${config.frequency} (${cronExpression})`);
  console.log(`🎯 Top usuarios: ${config.topUsersCount}`);
  console.log(`📊 Incluye fallos: ${config.showFailStats ? 'Sí' : 'No'}`);
  console.log(`📈 Incluye estadísticas semanales: ${config.includeWeeklyStats ? 'Sí' : 'No'}`);
  console.log(`🎪 Incluye frases motivacionales: ${config.includeMemes ? 'Sí' : 'No'}`);
  console.log('================================================\n');

  const task = cron.schedule(cronExpression, async () => {
    console.log(`\n⏰ [${new Date().toLocaleString()}] Ejecutando ranking automático...`);
    await generateAndSendRanking();
  }, {
    timezone: 'Europe/Madrid'
  });

  task.start();
  
  console.log('✅ Scheduler de ranking iniciado exitosamente');
  console.log(`🔄 Próximo envío programado según: ${cronExpression}`);
  console.log('\n💡 Para cambiar la frecuencia, edita RANKING_CONFIG.active.frequency');
  console.log('🛑 Para detener: Ctrl+C\n');

  // Enviar inmediatamente uno de prueba si está en modo test
  if (config.frequency === 'test') {
    console.log('🧪 Modo prueba detectado. Enviando ranking inmediatamente...');
    setTimeout(async () => {
      await generateAndSendRanking();
    }, 3000);
  }
}

// Función para envío manual
async function sendManualRanking(): Promise<void> {
  console.log('📤 Enviando ranking manual...\n');
  await generateAndSendRanking();
  process.exit(0);
}

// Ejecutar según argumentos
const args = process.argv.slice(2);

if (args.includes('--manual') || args.includes('-m')) {
  sendManualRanking();
} else {
  startRankingScheduler();
}

export { generateAndSendRanking, startRankingScheduler }; 