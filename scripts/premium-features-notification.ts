import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

/**
 * Envía notificación diaria sobre funcionalidades premium al grupo de Telegram
 */
async function sendPremiumFeaturesNotification(): Promise<void> {
  console.log('🎯 [PREMIUM FEATURES] Iniciando notificación de funcionalidades premium...');
  
  if (!BOT_TOKEN || !CHAT_ID) {
    console.error('❌ Variables de entorno TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID no configuradas');
    return;
  }

  const message = `🎓 <b>¡FUNCIONALIDADES PREMIUM DISPONIBLES!</b> 🎓

🔥 <b>¿Sabías que con una suscripción puedes acceder a:</b>

📋 <b>SISTEMA DE SIMULACROS:</b>
🎯 Simulacro oficial: Examen 2024
🎖️ Simulacros: Ejército de Tierra, Aire y Armada
⏱️ Tiempo límite: 1 minuto por pregunta
📊 Estadísticas detalladas de rendimiento
📈 Historial completo de simulacros

📚 <b>SESIONES DE ESTUDIO POR TEMAS:</b>
📖 <code>/constitucion20</code> → Test de 20 preguntas sobre Constitución
⚖️ <code>/pdc50</code> → Test de 50 preguntas sobre Doctrina
🏛️ <code>/pac5</code> → Test de 5 preguntas sobre PAC
✅ Y así con todos los temas disponibles

🎯 <b>PREGUNTAS FALLADAS INTELIGENTES:</b>
❌ Realiza tests únicamente de preguntas incorrectas
📝 Ejemplo: Si fallas 8 en <code>/pdc50</code>, usa <code>/pdcfalladas8</code>
🔄 Convierte tus errores en aciertos
💪 Mejora específicamente donde más lo necesitas

💎 <b>PLANES DISPONIBLES:</b>
🥉 <b>Básico (€4.99/mes):</b> 100 preguntas diarias + sistema de falladas
🥈 <b>Premium (€9.99/mes):</b> Todo ilimitado + IA + simulacros

🚀 <b>¡Lleva tu preparación al siguiente nivel!</b>

💡 Usa <code>/planes</code> para ver todos los detalles
📞 Usa <code>/basico</code> o <code>/premium</code> para suscribirte`;

  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });

    const result = await response.json() as any;
    
    if (result.ok) {
      console.log('✅ [PREMIUM FEATURES] Notificación enviada exitosamente al grupo');
      console.log(`📊 Message ID: ${result.result.message_id}`);
      
      // Registrar en base de datos para estadísticas
      await logPremiumNotification(true);
    } else {
      console.error('❌ [PREMIUM FEATURES] Error enviando notificación:', result.description);
      await logPremiumNotification(false, result.description);
    }
  } catch (error) {
    console.error('❌ [PREMIUM FEATURES] Error crítico enviando notificación:', error);
    await logPremiumNotification(false, error instanceof Error ? error.message : 'Error desconocido');
  }
}

/**
 * Registra la notificación en la base de datos para estadísticas
 */
async function logPremiumNotification(success: boolean, errorMessage?: string): Promise<void> {
  try {
    // Crear tabla de logs si no existe (opcional, depende de tu esquema)
    // Por ahora solo logueamos en consola
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'premium_features_notification',
      success,
      errorMessage: errorMessage || null
    };
    
    console.log('📝 [PREMIUM FEATURES] Log registrado:', logEntry);
    
    // Si tienes una tabla de logs, puedes descomentar esto:
    /*
    await prisma.notificationLog.create({
      data: {
        type: 'premium_features_notification',
        success,
        errorMessage,
        sentAt: new Date()
      }
    });
    */
  } catch (error) {
    console.error('❌ Error registrando log de notificación premium:', error);
  }
}

/**
 * Función principal que se ejecuta cuando se llama al script
 */
async function main(): Promise<void> {
  console.log('🚀 [PREMIUM FEATURES] Script de notificación de funcionalidades premium iniciado');
  console.log('⏰ Hora de ejecución:', new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' }));
  
  try {
    await sendPremiumFeaturesNotification();
    console.log('✅ [PREMIUM FEATURES] Script completado exitosamente');
  } catch (error) {
    console.error('❌ [PREMIUM FEATURES] Error en script principal:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Solo ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

export { sendPremiumFeaturesNotification };