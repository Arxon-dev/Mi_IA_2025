import { SubscriptionService } from './subscriptionService';
import { prisma } from '@/lib/prisma';

// ==========================================
// 💎 COMANDOS AVANZADOS DE SUSCRIPCIÓN (FASE 2)
// ==========================================

export async function handleRenovarCommand(userid: string, fromtelegramuser: any): Promise<string | null> {
  try {
    console.log('🔄 RENOVAR COMMAND - Solicitar renovación manual de suscripción');

    // Verificar usuario registrado
    const user = await prisma.telegramuser.findUnique({
      where: { telegramuserid: userid }
    });

    if (!user) {
      return `❌ <b>Usuario no registrado</b>\n\n🔧 Envía <code>/start</code> primero para registrarte.`;
    }

    // Obtener suscripción actual
    const subscription = await SubscriptionService.getCurrentSubscription(user.id);
    
    if (!subscription) {
      return `❌ <b>SIN SUSCRIPCIÓN ACTIVA</b>

👤 <b>${user.firstname || user.username || 'Usuario'}</b>

🔒 No tienes una suscripción activa para renovar.

💡 <b>¿Quieres suscribirte?</b>

💰 <b>PLANES DISPONIBLES:</b>
🥉 <b>Plan Básico (€4.99/mes):</b>
• 📚 100 preguntas diarias en privado
• 🔄 Sistema de preguntas falladas
• 📊 Estadísticas básicas

💎 <b>Plan Premium (€9.99/mes):</b>
• ♾️ Preguntas ilimitadas
• 🎯 Simulacros personalizados
• 📊 Estadísticas avanzadas
• 🔗 Integración Moodle
• 🤖 Análisis con IA

🚀 <b>Suscríbete ahora:</b>
• <code>/basico</code> - Plan Básico
• <code>/premium</code> - Plan Premium`;
    }

    const plan = subscription.plan;
    const endDate = subscription.enddate ? new Date(subscription.enddate) : null;
    const today = new Date();
    const daysRemaining = endDate ? Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;

    // Verificar si la suscripción está próxima a vencer (menos de 7 días)
    const isNearExpiry = daysRemaining !== null && daysRemaining <= 7;
    const hasExpired = daysRemaining !== null && daysRemaining <= 0;

    let message = `🔄 <b>RENOVACIÓN DE SUSCRIPCIÓN</b>\n\n`;
    message += `👤 <b>${user.firstname || user.username || 'Usuario'}</b>\n\n`;

    // Estado actual
    message += `💎 <b>PLAN ACTUAL:</b> ${plan.displayname}\n`;
    message += `💰 <b>Precio:</b> €${plan.price}/mes\n`;
    
    if (hasExpired) {
      message += `📋 <b>Estado:</b> ❌ Expirada\n`;
      message += `📅 <b>Expiró:</b> ${Math.abs(daysRemaining)} días atrás\n\n`;
      
      message += `⚠️ <b>TU SUSCRIPCIÓN HA EXPIRADO</b>\n\n`;
      message += `🔒 <b>Limitaciones actuales:</b>\n`;
      message += `• Solo canal público disponible\n`;
      message += `• Sin acceso a funciones premium\n`;
      message += `• Sin preguntas privadas ilimitadas\n\n`;
      
      message += `🚀 <b>RENOVAR AHORA:</b>\n`;
      if (plan.name === 'basic') {
        message += `• <code>/basico</code> - Renovar Plan Básico (€4.99/mes)\n`;
        message += `• <code>/premium</code> - Actualizar a Premium (€9.99/mes)\n\n`;
      } else {
        message += `• <code>/premium</code> - Renovar Plan Premium (€9.99/mes)\n`;
        message += `• <code>/basico</code> - Cambiar a Básico (€4.99/mes)\n\n`;
      }
      
      message += `💡 Al renovar, recuperarás inmediatamente todas las funcionalidades.`;
      
    } else if (isNearExpiry) {
      message += `📋 <b>Estado:</b> ⚠️ Próximo a vencer\n`;
      message += `📅 <b>Vence en:</b> ${daysRemaining} días\n\n`;
      
      message += `⏰ <b>¡RENUEVA PRONTO!</b>\n\n`;
      message += `Tu suscripción vence en pocos días. Renueva ahora para evitar interrupciones.\n\n`;
      
      message += `🚀 <b>RENOVAR:</b>\n`;
      if (plan.name === 'basic') {
        message += `• <code>/basico</code> - Renovar Plan Básico (€4.99/mes)\n`;
        message += `• <code>/premium</code> - Actualizar a Premium (€9.99/mes)\n\n`;
      } else {
        message += `• <code>/premium</code> - Renovar Plan Premium (€9.99/mes)\n`;
        message += `• <code>/basico</code> - Cambiar a Básico (€4.99/mes)\n\n`;
      }
      
      message += `✨ <b>Beneficio:</b> Al renovar antes del vencimiento, no perderás acceso.`;
      
    } else {
      message += `📋 <b>Estado:</b> ✅ Activa\n`;
      message += `📅 <b>Vence en:</b> ${daysRemaining} días\n\n`;
      
      message += `✅ <b>TU SUSCRIPCIÓN ESTÁ ACTIVA</b>\n\n`;
      message += `No es necesario renovar aún. Tu suscripción está vigente por ${daysRemaining} días más.\n\n`;
      
      message += `🎯 <b>¿QUIERES CAMBIAR DE PLAN?</b>\n`;
      if (plan.name === 'basic') {
        message += `• <code>/premium</code> - Actualizar a Premium (€9.99/mes)\n`;
        message += `  ♾️ Preguntas ilimitadas + funciones avanzadas\n\n`;
      } else {
        message += `• <code>/basico</code> - Cambiar a Básico (€4.99/mes)\n`;
        message += `  🔒 Límite de 100 preguntas/día\n\n`;
      }
      
      message += `📅 <b>Renovación automática:</b> Tu suscripción se renovará automáticamente.`;
    }

    message += `\n\n📞 <b>GESTIÓN:</b>\n`;
    message += `• <code>/mi_plan</code> - Ver detalles completos\n`;
    message += `• <code>/facturas</code> - Historial de pagos\n`;
    message += `• <code>/cambiar_plan</code> - Cambiar entre planes\n`;
    message += `• <code>/cancelar</code> - Cancelar suscripción`;

    return message;

  } catch (error) {
    console.error('❌ Error en handleRenovarCommand:', error);
    return `❌ <b>Error interno</b>\n\nInténtalo de nuevo en unos segundos.`;
  }
}

export async function handleCambiarPlanCommand(userid: string, fromtelegramuser: any): Promise<string | null> {
  try {
    console.log('🔄 CAMBIAR_PLAN COMMAND - Gestionar upgrade/downgrade entre planes');

    // Verificar usuario registrado
    const user = await prisma.telegramuser.findUnique({
      where: { telegramuserid: userid }
    });

    if (!user) {
      return `❌ <b>Usuario no registrado</b>\n\n🔧 Envía <code>/start</code> primero para registrarte.`;
    }

    // Obtener suscripción actual
    const subscription = await SubscriptionService.getCurrentSubscription(user.id);
    
    if (!subscription || subscription.status !== 'active') {
      return `❌ <b>SIN SUSCRIPCIÓN ACTIVA</b>

👤 <b>${user.firstname || user.username || 'Usuario'}</b>

🔒 Necesitas una suscripción activa para cambiar de plan.

💡 <b>¿Quieres suscribirte primero?</b>

💰 <b>PLANES DISPONIBLES:</b>
🥉 <b>Plan Básico (€4.99/mes):</b>
• 📚 100 preguntas diarias en privado
• 🔄 Sistema de preguntas falladas
• 📊 Estadísticas básicas

💎 <b>Plan Premium (€9.99/mes):</b>
• ♾️ Preguntas ilimitadas
• 🎯 Simulacros personalizados
• 📊 Estadísticas avanzadas
• 🔗 Integración Moodle
• 🤖 Análisis con IA

🚀 <b>Suscríbete ahora:</b>
• <code>/basico</code> - Plan Básico
• <code>/premium</code> - Plan Premium`;
    }

    const plan = subscription.plan;
    const endDate = subscription.enddate ? new Date(subscription.enddate) : null;
    const daysRemaining = endDate ? Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

    let message = `🔄 <b>CAMBIAR PLAN DE SUSCRIPCIÓN</b>\n\n`;
    message += `👤 <b>${user.firstname || user.username || 'Usuario'}</b>\n\n`;

    // Plan actual
    message += `💎 <b>PLAN ACTUAL:</b> ${plan.displayname}\n`;
    message += `💰 <b>Precio:</b> €${plan.price}/mes\n`;
    message += `📅 <b>Vence en:</b> ${daysRemaining} días\n\n`;

    // Opciones según el plan actual
    if (plan.name === 'basic') {
      // Usuario Básico -> puede upgrade a Premium
      message += `🚀 <b>ACTUALIZAR A PREMIUM</b>\n\n`;
      message += `💎 <b>Plan Premium (€9.99/mes):</b>\n`;
      message += `• ♾️ <b>Preguntas ilimitadas</b> (vs 100/día)\n`;
      message += `• 🎯 <b>Simulacros personalizados</b> (vs básicos)\n`;
      message += `• 📊 <b>Estadísticas avanzadas</b> (vs básicas)\n`;
      message += `• 🔗 <b>Integración Moodle</b> (nuevo)\n`;
      message += `• 🤖 <b>Análisis con IA</b> (nuevo)\n\n`;
      
      message += `💰 <b>COSTO DEL CAMBIO:</b>\n`;
      message += `• Diferencia: +€5.00/mes\n`;
      message += `• Cambio inmediato con prorrateo\n`;
      message += `• Acceso instantáneo a todas las funciones\n\n`;
      
      message += `🚀 <b>ACTUALIZAR AHORA:</b>\n`;
      message += `• <code>/premium</code> - Cambiar a Premium\n\n`;
      
      message += `✨ <b>¿Por qué Premium?</b>\n`;
      message += `• Sin límites de estudio diarios\n`;
      message += `• Funciones exclusivas para preparación avanzada\n`;
      message += `• Herramientas de análisis profesionales`;
      
    } else if (plan.name === 'premium') {
      // Usuario Premium -> puede downgrade a Básico
      message += `⬇️ <b>CAMBIAR A BÁSICO</b>\n\n`;
      message += `🥉 <b>Plan Básico (€4.99/mes):</b>\n`;
      message += `• 📚 <b>100 preguntas/día</b> (vs ilimitadas)\n`;
      message += `• 🔄 <b>Sistema de preguntas falladas</b> (mantiene)\n`;
      message += `• 📊 <b>Estadísticas básicas</b> (vs avanzadas)\n`;
      message += `• ❌ <b>Sin simulacros personalizados</b>\n`;
      message += `• ❌ <b>Sin integración Moodle</b>\n`;
      message += `• ❌ <b>Sin análisis con IA</b>\n\n`;
      
      message += `💰 <b>AHORRO DEL CAMBIO:</b>\n`;
      message += `• Ahorro: -€5.00/mes\n`;
      message += `• Cambio al final del período actual\n`;
      message += `• Mantienes Premium hasta el vencimiento\n\n`;
      
      message += `⚠️ <b>CONFIRMAR DOWNGRADE:</b>\n`;
      message += `• <code>/basico</code> - Cambiar a Básico\n\n`;
      
      message += `🤔 <b>¿Seguro del cambio?</b>\n`;
      message += `• Perderás acceso a funciones premium\n`;
      message += `• Tendrás límite de 100 preguntas/día\n`;
      message += `• Podrás volver a Premium cuando quieras`;
    }

    message += `\n\n📋 <b>INFORMACIÓN IMPORTANTE:</b>\n`;
    message += `• Los cambios son inmediatos\n`;
    message += `• Se aplica prorrateo justo\n`;
    message += `• Puedes cambiar las veces que quieras\n`;
    message += `• Sin penalizaciones por cambios\n\n`;

    message += `📞 <b>OTRAS OPCIONES:</b>\n`;
    message += `• <code>/mi_plan</code> - Ver detalles actuales\n`;
    message += `• <code>/facturas</code> - Historial de pagos\n`;
    message += `• <code>/renovar</code> - Gestionar renovación\n`;
    message += `• <code>/cancelar</code> - Cancelar suscripción`;

    return message;

  } catch (error) {
    console.error('❌ Error en handleCambiarPlanCommand:', error);
    return `❌ <b>Error interno</b>\n\nInténtalo de nuevo en unos segundos.`;
  }
} 