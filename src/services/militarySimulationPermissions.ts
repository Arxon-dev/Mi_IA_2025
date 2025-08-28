import { prisma } from '@/lib/prisma';

// ==========================================
// 🔐 VERIFICADOR DE PERMISOS SIMPLE - SIMULACROS MILITARES
// ==========================================

export interface PermissionResult {
  allowed: boolean;
  message?: string;
}

/**
 * Verificar permisos Premium específicamente para simulacros militares
 * Usa el mismo patrón que /mi_plan (que SÍ funciona)
 */
export async function checkMilitarySimulationPermission(telegramuserid: string): Promise<PermissionResult> {
  try {
    console.log(`🔐 Verificando permisos simulacros militares para usuario: ${telegramuserid}`);

    // Buscar usuario en la base de datos
    const user = await prisma.telegramuser.findUnique({
      where: { telegramuserid }
    });

    if (!user) {
      console.log('❌ Usuario no encontrado');
      return {
        allowed: false,
        message: '❌ Usuario no registrado. Usa /start para registrarte.'
      };
    }

    console.log(`✅ Usuario encontrado: ${user.firstname || 'Sin nombre'}`);

    // Buscar suscripción activa usando SQL directo (como /mi_plan que SÍ funciona)
    const activeSubscriptionResult = await prisma.$queryRaw`
      SELECT 
        s.*,
        p.displayname as planDisplayName,
        p.name as planName,
        p.price
      FROM usersubscription s
      JOIN subscriptionplan p ON s.planid = p.id
      WHERE s.userid = ${user.id} 
        AND s.status = 'active' 
        AND s.enddate >= NOW()
      ORDER BY s.createdat DESC
      LIMIT 1
    ` as any[];

    const activeSubscription = activeSubscriptionResult[0];

    if (!activeSubscription) {
      console.log('❌ Sin suscripción activa');
      return {
        allowed: false,
        message: `🎖️ Los simulacros militares requieren plan de **suscripción activa**\n\n` +
          `📋 **Plan actual:** Gratuito\n` +
          `🚀 **Solución:** Actualizar a plan de pago\n\n` +
          `💰 **OPCIONES DISPONIBLES:**\n` +
          `🥉 /basico - Plan Básico (€4.99/mes) - 1 simulacro/día\n` +
          `🥈 /premium - Plan Premium (€9.99/mes) - Simulacros ilimitados\n` +
          `📋 /planes - Ver comparativa completa\n\n` +
          `💡 **¿Dudas?** Contacta @Carlos_esp`
      };
    }

    console.log(`🔍 Suscripción encontrada: ${activeSubscription.planDisplayName}`);

    // Verificar que es plan Básico o Premium
    const isAllowed = ['basic', 'premium'].includes(activeSubscription.planName);
    console.log(`🎯 ¿Plan permite simulacros? ${isAllowed ? '✅ SÍ' : '❌ NO'} (${activeSubscription.planName})`);

    if (!isAllowed) {
      return {
        allowed: false,
        message: `🎖️ Los simulacros militares requieren plan de **suscripción activa**\n\n` +
          `📋 **Plan actual:** ${activeSubscription.planDisplayName}\n` +
          `🚀 **Solución:** Actualizar a plan de pago\n\n` +
          `💰 **OPCIONES DISPONIBLES:**\n` +
          `🥉 /basico - Plan Básico (€4.99/mes) - 1 simulacro/día\n` +
          `🥈 /premium - Plan Premium (€9.99/mes) - Simulacros ilimitados\n` +
          `📋 /planes - Ver comparativa completa\n\n` +
          `💡 **¿Dudas?** Contacta @Carlos_esp`
      };
    }

    console.log(`✅ Usuario ${telegramuserid} tiene permisos de simulacros confirmados (${activeSubscription.planName})`);
    return { allowed: true };

  } catch (error) {
    console.error('❌ Error verificando permisos simulacros militares:', error);
    return {
      allowed: false,
      message: '⚠️ Error verificando permisos. Inténtalo más tarde o contacta @Carlos_esp'
    };
  }
}