import { NotificationPreferencesService } from '../src/services/notificationPreferencesService';
import { prisma } from '../src/lib/prisma';

/**
 * 🔔 Comandos de Telegram para Preferencias de Notificaciones
 * 
 * Maneja los comandos /alertas_on, /alertas_off y /notificaciones
 * para que los usuarios puedan controlar sus alertas inteligentes.
 */

const notificationPreferencesService = new NotificationPreferencesService();

/**
 * 🔧 Activar alertas inteligentes
 */
export async function handleAlertsOnCommand(telegramUserId: string): Promise<void> {
  try {
    console.log(`🔔 Procesando comando /alertas_on para usuario: ${telegramUserId}`);
    
    // Buscar usuario en la base de datos
    const user = await prisma.telegramuser.findUnique({
      where: { telegramuserid: telegramUserId },
      select: { id: true, firstname: true, username: true }
    });

    if (!user) {
      console.error(`❌ Usuario no encontrado: ${telegramUserId}`);
      await notificationPreferencesService.sendNotificationMessage(
        telegramUserId,
        '❌ <b>Error</b>\n\nNo se pudo encontrar tu perfil de usuario. Asegúrate de estar registrado en el sistema.'
      );
      return;
    }

    // Activar alertas inteligentes
    const result = await notificationPreferencesService.enableIntelligentAlerts(user.id);
    
    // Enviar respuesta al usuario
    await notificationPreferencesService.sendNotificationMessage(telegramUserId, result.message);
    
    console.log(`✅ Alertas activadas para ${user.firstname || user.username}`);
  } catch (error) {
    console.error('❌ Error procesando comando /alertas_on:', error);
    await notificationPreferencesService.sendNotificationMessage(
      telegramUserId,
      '❌ <b>Error interno</b>\n\nOcurrió un error al procesar tu solicitud. Inténtalo de nuevo más tarde.'
    );
  }
}

/**
 * 🔕 Desactivar alertas inteligentes
 */
export async function handleAlertsOffCommand(telegramUserId: string): Promise<void> {
  try {
    console.log(`🔕 Procesando comando /alertas_off para usuario: ${telegramUserId}`);
    
    // Buscar usuario en la base de datos
    const user = await prisma.telegramuser.findUnique({
      where: { telegramuserid: telegramUserId },
      select: { id: true, firstname: true, username: true }
    });

    if (!user) {
      console.error(`❌ Usuario no encontrado: ${telegramUserId}`);
      await notificationPreferencesService.sendNotificationMessage(
        telegramUserId,
        '❌ <b>Error</b>\n\nNo se pudo encontrar tu perfil de usuario. Asegúrate de estar registrado en el sistema.'
      );
      return;
    }

    // Desactivar alertas inteligentes
    const result = await notificationPreferencesService.disableIntelligentAlerts(user.id);
    
    // Enviar respuesta al usuario
    await notificationPreferencesService.sendNotificationMessage(telegramUserId, result.message);
    
    console.log(`🔕 Alertas desactivadas para ${user.firstname || user.username}`);
  } catch (error) {
    console.error('❌ Error procesando comando /alertas_off:', error);
    await notificationPreferencesService.sendNotificationMessage(
      telegramUserId,
      '❌ <b>Error interno</b>\n\nOcurrió un error al procesar tu solicitud. Inténtalo de nuevo más tarde.'
    );
  }
}

/**
 * 📊 Mostrar estado de notificaciones
 */
export async function handleNotificationsStatusCommand(telegramUserId: string): Promise<void> {
  try {
    console.log(`📊 Procesando comando /notificaciones para usuario: ${telegramUserId}`);
    
    // Buscar usuario en la base de datos
    const user = await prisma.telegramuser.findUnique({
      where: { telegramuserid: telegramUserId },
      select: { id: true, firstname: true, username: true }
    });

    if (!user) {
      console.error(`❌ Usuario no encontrado: ${telegramUserId}`);
      await notificationPreferencesService.sendNotificationMessage(
        telegramUserId,
        '❌ <b>Error</b>\n\nNo se pudo encontrar tu perfil de usuario. Asegúrate de estar registrado en el sistema.'
      );
      return;
    }

    // Obtener estado de notificaciones
    const result = await notificationPreferencesService.getNotificationStatus(user.id);
    
    // Enviar respuesta al usuario
    await notificationPreferencesService.sendNotificationMessage(telegramUserId, result.message);
    
    console.log(`📊 Estado de notificaciones enviado a ${user.firstname || user.username}`);
  } catch (error) {
    console.error('❌ Error procesando comando /notificaciones:', error);
    await notificationPreferencesService.sendNotificationMessage(
      telegramUserId,
      '❌ <b>Error interno</b>\n\nOcurrió un error al procesar tu solicitud. Inténtalo de nuevo más tarde.'
    );
  }
}

/**
 * 🧪 Función de prueba para comandos de notificaciones
 */
export async function testNotificationCommands(telegramUserId: string): Promise<void> {
  console.log('🧪 Iniciando prueba de comandos de notificaciones...');
  
  try {
    // Probar comando de estado
    console.log('📊 Probando comando /notificaciones...');
    await handleNotificationsStatusCommand(telegramUserId);
    
    // Esperar un poco
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Probar desactivación
    console.log('🔕 Probando comando /alertas_off...');
    await handleAlertsOffCommand(telegramUserId);
    
    // Esperar un poco
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Probar activación
    console.log('🔔 Probando comando /alertas_on...');
    await handleAlertsOnCommand(telegramUserId);
    
    console.log('✅ Prueba de comandos completada');
  } catch (error) {
    console.error('❌ Error en prueba de comandos:', error);
  }
}

// Función principal para ejecutar desde línea de comandos
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('📋 Uso: node notification-preferences-commands.js <comando> <telegramUserId>');
    console.log('📋 Comandos disponibles:');
    console.log('   • on - Activar alertas inteligentes');
    console.log('   • off - Desactivar alertas inteligentes');
    console.log('   • status - Ver estado de notificaciones');
    console.log('   • test - Probar todos los comandos');
    console.log('📋 Ejemplo: node notification-preferences-commands.js on 5793286375');
    process.exit(1);
  }
  
  const [command, telegramUserId] = args;
  
  (async () => {
    try {
      switch (command.toLowerCase()) {
        case 'on':
          await handleAlertsOnCommand(telegramUserId);
          break;
        case 'off':
          await handleAlertsOffCommand(telegramUserId);
          break;
        case 'status':
          await handleNotificationsStatusCommand(telegramUserId);
          break;
        case 'test':
          await testNotificationCommands(telegramUserId);
          break;
        default:
          console.error(`❌ Comando desconocido: ${command}`);
          console.log('📋 Comandos válidos: on, off, status, test');
          process.exit(1);
      }
      
      console.log('✅ Comando ejecutado exitosamente');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error ejecutando comando:', error);
      process.exit(1);
    }
  })();
}