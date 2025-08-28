import { MilitarySimulationService } from './militarySimulationService';
import { checkMilitarySimulationPermission } from './militarySimulationPermissions';
import { prisma } from '@/lib/prisma';

// ==========================================
// 🎖️ COMANDOS DE SIMULACROS MILITARES PREMIUM
// ==========================================

/**
 * Comando /simulacro_premium_et - Simulacro Ejército de Tierra
 */
export async function handleSimulacroEjercitoTierraCommand(userid: string, fromtelegramuser: any): Promise<string | null> {
  try {
    console.log('🎖️ SIMULACRO_PREMIUM_ET COMMAND - Iniciando simulacro Ejército de Tierra');

    // Verificar permisos Premium
    const permission = await checkMilitarySimulationPermission(userid);
    
    if (!permission.allowed) {
      return permission.message || '🥈 Los simulacros militares premium requieren plan **Premium**';
    }

    // Verificar si tiene un simulacro activo
    const activeSimulation = await MilitarySimulationService.getActiveSimulation(userid, 'et');
    
    if (activeSimulation) {
      const progress = activeSimulation.currentquestionindex || 0;
      const total = activeSimulation.totalquestions || 100;
      const timeElapsed = activeSimulation.timeelapsed || 0;
      const timeRemaining = Math.max(0, activeSimulation.timelimit - timeElapsed);
      const minutesRemaining = Math.floor(timeRemaining / 60);
      
      return `🎖️ **SIMULACRO EJÉRCITO DE TIERRA ACTIVO**\n\n` +
        `📊 **Progreso:** ${progress}/${total} preguntas\n` +
        `⏱️ **Tiempo restante:** ${minutesRemaining} minutos\n\n` +
        `💡 **Opciones disponibles:**\n` +
        `• /simulacro_continuar - Continuar simulacro\n` +
        `• /simulacro_abandonar - Abandonar y empezar nuevo`;
    }

    // Crear nuevo simulacro
    console.log('🎖️ Creando simulacro militar ET...');
    const result = await MilitarySimulationService.createMilitarySimulation(userid, 'et');
    console.log('✅ Simulacro creado con ID:', result.simulationId);
    
    // Enviar primera pregunta automáticamente
    console.log('📤 Intentando enviar primera pregunta...');
    const questionSent = await MilitarySimulationService.sendFirstQuestion(result.simulationId, userid);
    console.log('📋 Resultado envío primera pregunta:', questionSent);
    
    if (questionSent) {
      return `🎖️ **SIMULACRO EJÉRCITO DE TIERRA INICIADO** ✅\n\n` +
        `🎯 <b>Características:</b>\n` +
        `• 📚 100 preguntas con distribución oficial ET\n` +
        `• ⏱️ Tiempo límite: 105 minutos\n` +
        `• 📊 Distribución exacta por materias\n` +
        `• 🏆 Formato examen oficial\n\n` +
        `📋 <b>Distribución principal:</b>\n` +
        `• PDC: 12 preguntas\n` +
        `• ET: 9 preguntas\n` +
        `• PAC: 9 preguntas\n` +
        `• Carrera: 8 preguntas\n` +
        `• Y 21 materias más...\n\n` +
        `✅ <b>Primera pregunta enviada por privado</b>\n` +
        `💡 Responde la pregunta para continuar el simulacro`;
    } else {
      return `🎖️ **SIMULACRO EJÉRCITO DE TIERRA CREADO** ⚠️\n\n` +
        `✅ Simulacro creado exitosamente\n` +
        `❌ Error enviando primera pregunta\n\n` +
        `💡 Usa /simulacro_continuar para obtener la primera pregunta`;
    }

  } catch (error) {
    console.error('Error en comando simulacro_premium_et:', error);
    
    if (error.message.includes('premium')) {
      return '🥈 **Plan Premium requerido**\n\nLos simulacros militares premium están disponibles exclusivamente para usuarios Premium.\n\n🚀 /premium - Suscríbete al plan Premium';
    }
    
    if (error.message.includes('Insuficientes preguntas')) {
      return '⚠️ **Insuficientes preguntas disponibles**\n\nActualmente no hay suficientes preguntas para crear un simulacro completo del Ejército de Tierra.\n\nContacta con @Carlos_esp para más información.';
    }
    
    return '❌ Error al crear el simulacro del Ejército de Tierra. Inténtalo más tarde.';
  }
}

/**
 * Comando /simulacro_premium_aire - Simulacro Ejército del Aire
 */
export async function handleSimulacroEjercitoAireCommand(userid: string, fromtelegramuser: any): Promise<string | null> {
  try {
    console.log('✈️ SIMULACRO_PREMIUM_AIRE COMMAND - Iniciando simulacro Ejército del Aire');

    // Verificar permisos Premium
    const permission = await checkMilitarySimulationPermission(userid);
    
    if (!permission.allowed) {
      return permission.message || '🥈 Los simulacros militares premium requieren plan **Premium**';
    }

    // Verificar si tiene un simulacro activo
    const activeSimulation = await MilitarySimulationService.getActiveSimulation(userid, 'aire');
    
    if (activeSimulation) {
      const progress = activeSimulation.currentquestionindex || 0;
      const total = activeSimulation.totalquestions || 100;
      const timeElapsed = activeSimulation.timeelapsed || 0;
      const timeRemaining = Math.max(0, activeSimulation.timelimit - timeElapsed);
      const minutesRemaining = Math.floor(timeRemaining / 60);
      
      return `✈️ <b>SIMULACRO EJÉRCITO DEL AIRE ACTIVO</b>\n\n` +
        `📊 <b>Progreso:</b> ${progress}/${total} preguntas\n` +
        `⏱️ <b>Tiempo restante:</b> ${minutesRemaining} minutos\n\n` +
        `💡 <b>Opciones disponibles:</b>\n` +
        `• /simulacro_continuar - Continuar simulacro\n` +
        `• /simulacro_abandonar - Abandonar y empezar nuevo`;
    }

    // Crear nuevo simulacro
    const result = await MilitarySimulationService.createMilitarySimulation(userid, 'aire');
    
    // Enviar primera pregunta automáticamente
    const questionSent = await MilitarySimulationService.sendFirstQuestion(result.simulationId, userid);
    
    if (questionSent) {
      return `✈️ <b>SIMULACRO EJÉRCITO DEL AIRE INICIADO</b> ✅\n\n` +
        `🎯 <b>Características:</b>\n` +
        `• 📚 100 preguntas con distribución oficial EA\n` +
        `• ⏱️ Tiempo límite: 105 minutos\n` +
        `• 📊 Distribución exacta por materias\n` +
        `• 🏆 Formato examen oficial\n\n` +
        `📋 <b>Distribución principal:</b>\n` + 
        `• Aire: 9 preguntas\n` +
        `• PAC: 8 preguntas\n` +
        `• Carrera: 8 preguntas\n` +
        `• Minsdef: 7 preguntas\n` +
        `• Y 21 materias más...\n\n` +
        `✅ <b>Primera pregunta enviada por privado</b>\n` +
        `💡 Responde la pregunta para continuar el simulacro`;
    } else {
      return `✈️ <b>SIMULACRO EJÉRCITO DEL AIRE CREADO</b> ⚠️\n\n` +
        `✅ Simulacro creado exitosamente\n` +
        `❌ Error enviando primera pregunta\n\n` +
        `💡 Usa /simulacro_continuar para obtener la primera pregunta`;
    }

  } catch (error) {
    console.error('Error en comando simulacro_premium_aire:', error);
    
    if (error.message.includes('premium')) {
      return '🥈 **Plan Premium requerido**\n\nLos simulacros militares premium están disponibles exclusivamente para usuarios Premium.\n\n🚀 /premium - Suscríbete al plan Premium';
    }
    
    if (error.message.includes('Insuficientes preguntas')) {
      return '⚠️ <b>Insuficientes preguntas disponibles</b>\n\nActualmente no hay suficientes preguntas para crear un simulacro completo del Ejército del Aire.\n\nContacta con @Carlos_esp para más información.';
    }
    
    return '❌ Error al crear el simulacro del Ejército del Aire. Inténtalo más tarde.';
  }
}

/**
 * Comando /simulacro_premium_armada - Simulacro Armada
 */
export async function handleSimulacroArmadaCommand(userid: string, fromtelegramuser: any): Promise<string | null> {
  try {
    console.log('⚓ SIMULACRO_PREMIUM_ARMADA COMMAND - Iniciando simulacro Armada');

    // Verificar permisos Premium
    const permission = await checkMilitarySimulationPermission(userid);
    
    if (!permission.allowed) {
      return permission.message || '🥈 <b>Los simulacros militares premium requieren plan Premium</b>';
    }

    // Verificar si tiene un simulacro activo
    const activeSimulation = await MilitarySimulationService.getActiveSimulation(userid, 'armada');
    
    if (activeSimulation) {
      const progress = activeSimulation.currentquestionindex || 0;
      const total = activeSimulation.totalquestions || 100;
      const timeElapsed = activeSimulation.timeelapsed || 0;
      const timeRemaining = Math.max(0, activeSimulation.timelimit - timeElapsed);
      const minutesRemaining = Math.floor(timeRemaining / 60);
      
      return `⚓ <b>SIMULACRO ARMADA ACTIVO</b>\n\n` +
        `📊 <b>Progreso:</b> ${progress}/${total} preguntas\n` +
        `⏱️ <b>Tiempo restante:</b> ${minutesRemaining} minutos\n\n` +
        `💡 <b>Opciones disponibles:</b>\n` +
        `• /simulacro_continuar - Continuar simulacro\n` +
        `• /simulacro_abandonar - Abandonar y empezar nuevo`;
    }

    // Crear nuevo simulacro
    const result = await MilitarySimulationService.createMilitarySimulation(userid, 'armada');
    
    // Enviar primera pregunta automáticamente
    const questionSent = await MilitarySimulationService.sendFirstQuestion(result.simulationId, userid);
    
    if (questionSent) {
      return `⚓ <b>SIMULACRO ARMADA INICIADO</b> ✅\n\n` +
        `🎯 <b>Características:</b>\n` +
        `• 📚 100 preguntas con distribución oficial Armada\n` +
        `• ⏱️ Tiempo límite: 105 minutos\n` +
        `• 📊 Distribución exacta por materias\n` +
        `• 🏆 Formato examen oficial\n\n` +
        `📋 <b>Distribución principal:</b>\n` +
        `• PDC: 14 preguntas\n` +
        `• Carrera: 10 preguntas\n` +
        `• Armada: 6 preguntas\n` +
        `• Seguiridad Nacional: 6 preguntas\n` +
        `• Y 21 materias más...\n\n` +
        `✅ <b>Primera pregunta enviada por privado</b>\n` +
        `💡 Responde la pregunta para continuar el simulacro`;
    } else {
      return `⚓ <b>SIMULACRO ARMADA CREADO</b> ⚠️\n\n` +
        `✅ Simulacro creado exitosamente\n` +
        `❌ Error enviando primera pregunta\n\n` +
        `💡 Usa /simulacro_continuar para obtener la primera pregunta`;
    }

  } catch (error) {
    console.error('Error en comando simulacro_premium_armada:', error);
    
    if (error.message.includes('premium')) {
      return '🥈 <b>Plan Premium requerido</b>\n\nLos simulacros militares premium están disponibles exclusivamente para usuarios Premium.\n\n🚀 /premium - Suscríbete al plan Premium';
    }
    
    if (error.message.includes('Insuficientes preguntas')) {
      return '⚠️ <b>Insuficientes preguntas disponibles</b>\n\nActualmente no hay suficientes preguntas para crear un simulacro completo de la Armada.\n\nContacta con @Carlos_esp para más información.';
    }
    
    return '❌ Error al crear el simulacro de la Armada. Inténtalo más tarde.';
  }
}

/**
 * Comando helper para información general de simulacros militares
 */
export async function handleSimulacrosPremiumInfoCommand(userid: string, fromtelegramuser: any): Promise<string | null> {
  try {
    const canAccess = await MilitarySimulationService.canUserCreatePremiumSimulation(userid);
    
    if (!canAccess) {
      return `🎖️ <b>Simulacros Premium</b> 🥈\n\n` +
        `Los simulacros militares son una funcionalidad <b>exclusiva Premium</b> que simula exámenes oficiales por arma militar.\n\n` +
        `🚀 <b>¿Qué incluye?</b>\n` +
        `✈️ Ejército del Aire - 100 preguntas\n` +
        `🎖️ Ejército de Tierra - 100 preguntas\n` +
        `⚓ Armada - 100 preguntas\n\n` +
        `🎯 <b>Características:</b>\n` +
        `• <b>Distribución exacta por arma militar</b>\n` +
        `• 105 minutos como examen oficial\n` +
        `• Orden específico de envío\n` +
        `• Materias especializadas por rama\n\n` +
        `💎 <b>Suscríbete a Premium:</b>\n` +
        `/premium - €9.99/mes\n` +
        `/planes - Ver comparativa completa`;
    }

    // Usuario Premium - mostrar comandos disponibles
    const activeSimulation = await MilitarySimulationService.getActiveSimulation(userid);
    
    let message = `🎖️ <b>Simulacros Premium</b> 💎\n\n`;
    
    if (activeSimulation) {
      const branchNames = {
        'simulacro_premium_et': '🎖️ Ejército de Tierra',
        'simulacro_premium_aire': '✈️ Ejército del Aire', 
        'simulacro_premium_armada': '⚓ Armada'
      };
      
      const branchName = branchNames[activeSimulation.examtype] || 'Simulacro Militar';
      const progress = activeSimulation.currentquestionindex || 0;
      const total = activeSimulation.totalquestions || 100;
      
      message += `🔄 <b>Simulacro Activo:</b> ${branchName}\n`;
      message += `📊 <b>Progreso:</b> ${progress}/${total} preguntas\n\n`;
      message += `💡 /simulacro_continuar para continuar\n\n`;
    }
    
    message += `🚀 <b>Comandos disponibles:</b>\n`;
    message += `🎖️ /simulacro_premium_et - Ejército de Tierra\n`;
    message += `✈️ /simulacro_premium_aire - Ejército del Aire\n`;
    message += `⚓ /simulacro_premium_armada - Armada\n\n`;
    
    message += `📊 <b>Características:</b>\n`;
    message += `• 100 preguntas por simulacro\n`;
    message += `• Distribución oficial por arma\n`;
    message += `• 105 minutos tiempo límite\n`;
    message += `• Materias especializadas\n`;
    message += `• Formato examen real\n\n`;
    
    message += `💡 <b>Tip:</b> Cada simulacro refleja la especialización de cada rama militar española.`;
    
    return message;

  } catch (error) {
    console.error('Error en comando simulacros premium info:', error);
    return '❌ Error al obtener información de simulacros premium.';
  }
}