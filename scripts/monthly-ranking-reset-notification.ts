#!/usr/bin/env npx tsx

/**
 * Script de notificación para el día 1 de cada mes
 * Anuncia el reinicio del ranking mensual y motiva a los usuarios
 */

import { GamificationService } from '../src/services/gamificationService';

async function sendMonthlyResetNotification() {
  console.log('🔄 Enviando notificación de reinicio de ranking mensual...');

  try {
    // Obtener datos del mes anterior (top 8 ganadores)
    const lastMonthDate = new Date();
    lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
    
    const currentDate = new Date();
    const currentMonthName = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    const lastMonthName = lastMonthDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

    // Obtener ranking actual (que será del nuevo mes, vacío)
    const newMonthLeaderboard = await GamificationService.getMonthlyLeaderboard(8);

    // Crear mensaje de notificación
    let message = `🎆 *¡NUEVO MES, NUEVA OPORTUNIDAD!* 🎆\n\n`;
    message += `📅 **${currentMonthName.toUpperCase()}**\n\n`;
    message += `🔄 **El ranking mensual se ha reiniciado**\n`;
    message += `¡Todos empezamos desde cero otra vez!\n\n`;

    // Mensaje motivacional especial día 1
    message += `🌟 **¡Esta es tu oportunidad!**\n`;
    message += `• Los TOP 8 del mes anterior ya no importan\n`;
    message += `• Puedes ser el nuevo líder mensual\n`;
    message += `• Cada respuesta correcta cuenta desde HOY\n`;
    message += `• ¡El podium está vacío esperándote!\n\n`;

    message += `🎯 **META DEL ${currentMonthName.toUpperCase()}:**\n`;
    message += `Llegar al TOP 8 que se anunciará durante el mes\n\n`;

    message += `⚡ **CÓMO FUNCIONA:**\n`;
    message += `• Solo cuentan las respuestas correctas de este mes\n`;
    message += `• Se actualiza automáticamente cada pocos días\n`;
    message += `• El último día del mes conoceremos a los ganadores\n\n`;

    message += `🏆 **PREMIOS ESPECIALES:**\n`;
    message += `• 🥇 Campeón mensual: Reconocimiento especial\n`;
    message += `• 🥈 Subcampeón: Mención de honor\n`;
    message += `• 🥉 Tercer lugar: Destacado del mes\n`;
    message += `• 🏅 Top 8: ¡Apareces en el ranking oficial!\n\n`;

    message += `📱 **COMANDOS PARA COMPETIR:**\n`;
    message += `• /ranking mensual - Ver clasificación actual\n`;
    message += `• Cualquier comando de estudio para sumar puntos\n`;
    message += `• /mi_progreso - Ver tus estadísticas\n\n`;

    message += `💪 *"Cada mes es una nueva oportunidad de brillar"*\n\n`;
    message += `🚀 **¡QUE COMIENCE LA COMPETENCIA!**`;

    // Enviar mensaje a Telegram
    const telegramResult = await sendTelegramMessage(message);
    
    if (telegramResult.success) {
      console.log(`✅ Notificación de reinicio enviada exitosamente (ID: ${telegramResult.messageId})`);
      console.log(`📅 Nueva competencia de ${currentMonthName} iniciada`);
    } else {
      console.error('❌ Error enviando notificación de reinicio:', telegramResult.error);
    }

  } catch (error) {
    console.error('❌ Error en el proceso de notificación de reinicio:', error);
    process.exit(1);
  }
}

async function sendTelegramMessage(message: string) {
  try {
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      throw new Error('Variables de entorno TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID son requeridas');
    }

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    });

    const result = await response.json() as any;

    if (result.ok) {
      return { success: true, messageId: result.result.message_id };
    } else {
      return { success: false, error: result.description };
    }
  } catch (error) {
    return { success: false, error: error };
  }
}

// Verificar si hoy es día 1 del mes
const today = new Date();
const isFirstDayOfMonth = today.getDate() === 1;

const args = process.argv.slice(2);
const forceRun = args.includes('--force');
const isTestMode = args.includes('--test');

if (isTestMode) {
  console.log('🧪 Modo de prueba - Mostrando mensaje sin enviar');
  console.log('📅 Fecha actual:', today.toLocaleDateString('es-ES'));
  console.log('📅 ¿Es día 1 del mes?:', isFirstDayOfMonth);
  process.exit(0);
}

if (!isFirstDayOfMonth && !forceRun) {
  console.log('⏰ No es día 1 del mes. Use --force para ejecutar manualmente.');
  console.log('📅 Fecha actual:', today.toLocaleDateString('es-ES'));
  process.exit(0);
}

sendMonthlyResetNotification().then(() => {
  process.exit(0);
}); 