// Configuración de notificaciones del sistema
export const NotificationConfig = {
  // Modo del grupo principal (donde se envían las preguntas)
  groupMode: {
    // Solo mostrar notificaciones esenciales en el grupo principal
    duel: {
      enabled: false, // No mostrar duelos en grupo principal
      fallbackMessage: true, // Mostrar mensaje muy corto si falla privada
      maxLength: 50 // Máximo 50 caracteres para fallback
    },
    achievements: {
      enabled: false, // No mostrar logros individuales
      milestones: true // Solo hitos importantes (cada 10 niveles, etc)
    },
    goals: {
      enabled: false // No mostrar metas personales
    },
    rankings: {
      enabled: true, // Ranking semanal está bien
      frequency: 'weekly' // Solo una vez por semana
    }
  },
  
  // Configuración de comandos inteligentes
  commands: {
    // Comandos que DEBEN ir en privado (para evitar spam)
    forcePrivate: [
      // 📊 Estadísticas personales
      '/stats', '/mi_stats', '/estadisticas',
      '/logros', '/achievements', 
      '/prediccion', '/prediction', 
      '/metas', '/goals', 
      '/racha',
      
      // 🏆 Rankings (ahora privados)
      '/ranking', '/leaderboard',
      
      // ⚔️ Duelos
      '/duelos', '/duels',
      
      // 📚 Exámenes oficiales
      '/examen2018', '/examen2018stats',
      '/examen2024', '/examen2024stats',
      '/ranking_oficial2018', '/ranking_oficial2024',
      '/comparativa_examenes',
      
      // 🎓 Simulacros
      '/simulacro', '/simulacro_continuar', '/simulacro_abandonar',
      '/simulacro_historial', '/simulacro2024', '/simulacro_oficial',
      
      // 🏆 Torneos
      '/torneo', '/tournament', '/torneos', '/tournaments',
      '/torneo_unirse', '/torneo_salir', '/torneo_historial'
    ],
    
    // Comandos permitidos en grupo (información general)
    allowInGroup: ['/help', '/notificaciones', '/privadas', '/test'],
    
    // Comandos contextuales (depende de la situación)
    contextual: ['/duelo', '/duel', '/aceptar', '/accept', '/rechazar', '/reject']
  },
  
  // Intentar notificaciones privadas
  private: {
    duel: true,
    achievements: true,
    goals: true,
    commands: true // Nueva configuración para comandos
  },
  
  // Configuración de fallback para cuando falla privada
  fallback: {
    enabled: true,
    template: {
      duel: '⚔️ {challenged} retado por {challenger} | /duelos',
      achievement: '🏅 {user} desbloqueó logro | /logros',
      goal: '🎯 {user} completó meta | /metas',
      command: '📊 {user} usa /privadas para configurar respuestas privadas'
    }
  },
  
  // Límites anti-spam
  limits: {
    maxNotificationsPerHour: 5, // Máximo 5 notificaciones por usuario por hora
    maxGroupMessagesPerHour: 20, // Máximo 20 mensajes del bot por hora en grupo
    cooldownBetweenMessages: 30 // 30 segundos entre mensajes del bot
  },

  // Configuración de respuestas a quiz
  quizResponses: {
    // Modo del grupo principal
    groupMode: {
      enabled: false, // No mostrar respuestas individuales en grupo
      showAggregate: true, // Mostrar contador general: "5 personas han respondido"
      maxAggregateUsers: 10, // Máximo de usuarios a mostrar en contador
      fallbackMessage: true, // Mensaje breve si falla privada
      maxFallbackLength: 30 // Máximo 30 caracteres para fallback: "Juan: ✅ +15pts"
    },
    
    // Configuración de mensajes privados
    privateMode: {
      enabled: true, // Enviar respuestas detalladas por privado
      includeStats: true, // Incluir estadísticas completas
      includeMotivation: true, // Incluir mensaje motivacional
      includeProgress: true, // Incluir progreso hacia siguiente nivel
      includeAchievements: true // Incluir logros desbloqueados
    },
    
    // Templates para diferentes tipos de respuesta
    templates: {
      correct: {
        private: `✅ <b>¡RESPUESTA CORRECTA!</b> 🎉\n\n{question_result}\n\n🏆 <b>ESTADÍSTICAS ACTUALIZADAS:</b>\n{stats}\n\n{motivation}\n\n{progress}`,
        fallback: `{name}: ✅ +{points}pts`
      },
      incorrect: {
        private: `❌ <b>RESPUESTA INCORRECTA</b> 💪\n\n{question_result}\n\n📊 <b>TUS ESTADÍSTICAS:</b>\n{stats}\n\n{motivation}\n\n{progress}`,
        fallback: `{name}: ❌ +{points}pts`
      },
      aggregate: `📊 <b>{count} persona{plural} {have} respondido</b> esta pregunta`
    }
  }
}; 