import { TelegramBot } from 'node-telegram-bot-api';

// Cambiar el nombre de la función principal
export async function handleAnalisisAvanzado(bot: TelegramBot, msg: any) {
  const chatId = msg.chat.id;
  const telegramUserId = msg.from.id.toString();

  try {
    console.log('🔍 [DEBUG] Iniciando análisis avanzado para usuario:', telegramUserId);
    console.log('🔍 [DEBUG] NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
    
    // Mostrar mensaje de carga
    const loadingMsg = await bot.sendMessage(chatId, '📊 Analizando tu rendimiento...');
    console.log('🔍 [DEBUG] Mensaje de carga enviado');

    // Verificar que la URL esté definida
    if (!process.env.NEXT_PUBLIC_API_URL) {
      console.error('❌ [ERROR] NEXT_PUBLIC_API_URL no está definida');
      await bot.editMessageText('❌ Error de configuración del servidor.', {
        chat_id: chatId,
        message_id: loadingMsg.message_id
      });
      return;
    }

    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/telegram/analytics-advanced`;
    console.log('🔍 [DEBUG] URL de la API:', apiUrl);

    // Obtener analytics avanzados
    console.log('🔍 [DEBUG] Enviando solicitud a la API...');
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ telegramUserId }),
    });

    console.log('🔍 [DEBUG] Respuesta recibida. Status:', response.status);
    console.log('🔍 [DEBUG] Response OK:', response.ok);

    if (!response.ok) {
      console.error('❌ [ERROR] Respuesta no OK:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('❌ [ERROR] Texto de error:', errorText);
      
      await bot.editMessageText('❌ Error del servidor al obtener analytics.', {
        chat_id: chatId,
        message_id: loadingMsg.message_id
      });
      return;
    }

    const data = await response.json();
    console.log('🔍 [DEBUG] Datos recibidos:', JSON.stringify(data, null, 2));

    if (!data.success || !data.analytics) {
      console.error('❌ [ERROR] Datos inválidos recibidos:', data);
      await bot.editMessageText('❌ No se pudieron obtener tus analytics avanzados.', {
        chat_id: chatId,
        message_id: loadingMsg.message_id
      });
      return;
    }

    const analytics = data.analytics;
    console.log('🔍 [DEBUG] Analytics procesados correctamente');
    
    // Construir mensaje de analytics avanzados
    let message = `📊 **ANALYTICS AVANZADO**\n\n`;
    
    // Información básica
    if (analytics.userInfo) {
      message += `👤 **${analytics.userInfo.firstname}**\n`;
      message += `📈 Puntos: ${analytics.userInfo.totalpoints.toLocaleString()}\n`;
      message += `🏆 Nivel: ${analytics.userInfo.level}\n`;
      
      // Validar accuracy del usuario
      const userAccuracy = typeof analytics.userInfo.accuracy === 'number' ? analytics.userInfo.accuracy : parseFloat(analytics.userInfo.accuracy) || 0;
      message += `🎯 Precisión: ${userAccuracy}%\n\n`;
    }

    // Rendimiento por temas
    if (analytics.topicPerformance && analytics.topicPerformance.length > 0) {
      message += `📚 **RENDIMIENTO POR TEMAS**\n\n`;
      
      analytics.topicPerformance.slice(0, 5).forEach((topic: any, index: number) => {
        // Validar accuracy del tema
        const topicAccuracy = typeof topic.accuracy === 'number' ? topic.accuracy : parseFloat(topic.accuracy) || 0;
        const emoji = topicAccuracy >= 80 ? '✅' : topicAccuracy >= 60 ? '⚠️' : '❌';
        
        message += `${emoji} **${topic.sectionname}**\n`;
        message += `   Precisión: ${topicAccuracy.toFixed(1)}%\n`;
        message += `   Preguntas: ${topic.totalquestions}\n\n`;
      });
    }

    // Temas que necesitan mejorar
    const weakTopics = analytics.topicPerformance?.filter((t: any) => {
      const accuracy = typeof t.accuracy === 'number' ? t.accuracy : parseFloat(t.accuracy) || 0;
      return accuracy < 70 && t.totalquestions >= 5;
    }) || [];
    
    if (weakTopics.length > 0) {
      message += `⚠️ **TEMAS QUE NECESITAN MEJORAR**\n\n`;
      weakTopics.slice(0, 3).forEach((topic: any) => {
        const accuracy = typeof topic.accuracy === 'number' ? topic.accuracy : parseFloat(topic.accuracy) || 0;
        message += `• ${topic.sectionname} (${accuracy.toFixed(1)}%)\n`;
      });
      message += `\n`;
    }

    // Recomendaciones
    if (analytics.recommendations && analytics.recommendations.length > 0) {
      message += `💡 **RECOMENDACIONES**\n\n`;
      analytics.recommendations.slice(0, 3).forEach((rec: any) => {
        message += `• ${rec.reason}\n`;
      });
      message += `\n`;
    }

    // Logros recientes
    if (analytics.achievements && analytics.achievements.length > 0) {
      message += `🏆 **LOGROS RECIENTES**\n\n`;
      analytics.achievements.slice(0, 3).forEach((achievement: any) => {
        message += `• ${achievement.achievementname}\n`;
      });
      message += `\n`;
    }

    // Progreso temporal
    if (analytics.timeline && analytics.timeline.length > 0) {
      const recentWeeks = analytics.timeline.slice(-4);
      message += `📅 **PROGRESO RECIENTE**\n\n`;
      
      recentWeeks.forEach((week: any) => {
        const date = new Date(week.date).toLocaleDateString('es-ES', { 
          month: 'short', 
          day: 'numeric' 
        });
        
        // Validar que accuracy sea un número
        const accuracy = typeof week.accuracy === 'number' ? week.accuracy : parseFloat(week.accuracy) || 0;
        const questionsAnswered = typeof week.questions_answered === 'number' ? week.questions_answered : parseInt(week.questions_answered) || 0;
        
        message += `${date}: ${questionsAnswered} preguntas, ${accuracy.toFixed(1)}% precisión\n`;
      });
    }

    // Comandos adicionales actualizados
    message += `\n📋 **COMANDOS DISPONIBLES**\n`;
    message += `/recomendaciones - Ver recomendaciones detalladas\n`;
    message += `/temas - Análisis por temas específicos\n`;
    message += `/progreso - Gráfico de progreso temporal\n`;
    message += `/logros - Ver todos tus logros\n`;

    // Editar mensaje con analytics - Asegurar que los parámetros sean correctos
    const messageId = loadingMsg.result?.message_id || loadingMsg.message_id;
    if (!messageId) {
      console.error('❌ [ERROR] No se pudo obtener message_id del mensaje de carga');
      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      return;
    }

    await bot.editMessageText(message, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown'
    });

    console.log('🔍 [DEBUG] Mensaje final enviado exitosamente');

  } catch (error) {
    console.error('❌ [ERROR] Error en análisis avanzado:', error);
    console.error('❌ [ERROR] Stack trace:', error.stack);
    
    // Enviar mensaje de error más específico
    try {
      await bot.sendMessage(chatId, '❌ Error al procesar análisis avanzado. Intenta más tarde.');
    } catch (sendError) {
      console.error('❌ [ERROR] Error enviando mensaje de error:', sendError);
    }
  }
}

export async function handleRecommendations(bot: TelegramBot, msg: any) {
  const chatId = msg.chat.id;
  const telegramUserId = msg.from.id.toString();

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/telegram/analytics-advanced`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ telegramUserId }),
    });

    const data = await response.json();
    const analytics = data.analytics;

    if (!analytics?.recommendations || analytics.recommendations.length === 0) {
      await bot.sendMessage(chatId, '💡 No tienes recomendaciones activas en este momento. ¡Sigue practicando!');
      return;
    }

    let message = `💡 **RECOMENDACIONES PERSONALIZADAS**\n\n`;
    
    analytics.recommendations.forEach((rec: any, index: number) => {
      const priority = rec.priority === 1 ? '🔴' : rec.priority === 2 ? '🟡' : '🟢';
      message += `${priority} **Recomendación ${index + 1}**\n`;
      message += `${rec.reason}\n\n`;
    });

    message += `📊 **TIPOS DE RECOMENDACIONES**\n`;
    message += `• practice_topic - Practicar temas específicos\n`;
    message += `• review_failed - Repasar preguntas fallidas\n`;
    message += `• challenge_yourself - Desafíos personalizados\n`;
    message += `• maintain_streak - Mantener rachas de aciertos\n`;

    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });

  } catch (error) {
    console.error('Error obteniendo recomendaciones:', error);
    await bot.sendMessage(chatId, '❌ Error al obtener recomendaciones.');
  }
}

export async function handleTopicsAnalysis(bot: TelegramBot, msg: any) {
  const chatId = msg.chat.id;
  const telegramUserId = msg.from.id.toString();

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/telegram/analytics-advanced`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ telegramUserId }),
    });

    const data = await response.json();
    const analytics = data.analytics;

    if (!analytics?.topicPerformance || analytics.topicPerformance.length === 0) {
      await bot.sendMessage(chatId, '📚 No hay datos de rendimiento por temas disponibles.');
      return;
    }

    // Definir las variables que faltaban
    const strongTopics = analytics.topicPerformance.filter((t: any) => {
      const accuracy = typeof t.accuracy === 'number' ? t.accuracy : parseFloat(t.accuracy) || 0;
      return accuracy >= 80 && t.totalquestions >= 5;
    });
    
    const weakTopics = analytics.topicPerformance.filter((t: any) => {
      const accuracy = typeof t.accuracy === 'number' ? t.accuracy : parseFloat(t.accuracy) || 0;
      return accuracy < 60 && t.totalquestions >= 5;
    });
    
    const mediumTopics = analytics.topicPerformance.filter((t: any) => {
      const accuracy = typeof t.accuracy === 'number' ? t.accuracy : parseFloat(t.accuracy) || 0;
      return accuracy >= 60 && accuracy < 80 && t.totalquestions >= 5;
    });

    let message = `📚 **ANÁLISIS POR TEMAS**\n\n`;
    
    // Temas con mejor rendimiento
    if (strongTopics.length > 0) {
      message += `✅ **TUS FORTALEZAS**\n`;
      strongTopics.slice(0, 3).forEach((topic: any) => {
        const accuracy = typeof topic.accuracy === 'number' ? topic.accuracy : parseFloat(topic.accuracy) || 0;
        message += `• ${topic.sectionname}: ${accuracy.toFixed(1)}%\n`;
      });
      message += `\n`;
    }

    // Temas que necesitan mejorar
    if (weakTopics.length > 0) {
      message += `⚠️ **ÁREAS DE MEJORA**\n`;
      weakTopics.slice(0, 3).forEach((topic: any) => {
        const accuracy = typeof topic.accuracy === 'number' ? topic.accuracy : parseFloat(topic.accuracy) || 0;
        message += `• ${topic.sectionname}: ${accuracy.toFixed(1)}%\n`;
      });
      message += `\n`;
    }

    // Temas intermedios
    if (mediumTopics.length > 0) {
      message += `🟡 **TEMAS INTERMEDIOS**\n`;
      mediumTopics.slice(0, 3).forEach((topic: any) => {
        const accuracy = typeof topic.accuracy === 'number' ? topic.accuracy : parseFloat(topic.accuracy) || 0;
        message += `• ${topic.sectionname}: ${accuracy.toFixed(1)}%\n`;
      });
      message += `\n`;
    }

    message += `📊 **ESTADÍSTICAS**\n`;
    message += `• Total temas practicados: ${analytics.topicPerformance.length}\n`;
    
    // Calcular promedio con validación
    const totalAccuracy = analytics.topicPerformance.reduce((acc: number, t: any) => {
      const accuracy = typeof t.accuracy === 'number' ? t.accuracy : parseFloat(t.accuracy) || 0;
      return acc + accuracy;
    }, 0);
    const averageAccuracy = analytics.topicPerformance.length > 0 ? totalAccuracy / analytics.topicPerformance.length : 0;
    
    message += `• Promedio de precisión: ${averageAccuracy.toFixed(1)}%\n`;

    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });

  } catch (error) {
    console.error('Error en análisis de temas:', error);
    await bot.sendMessage(chatId, '❌ Error al obtener análisis de temas.');
  }
}