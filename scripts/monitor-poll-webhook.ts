// Script para monitorear las respuestas de polls en el webhook
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

console.log('🔍 MONITOR DE POLLS - Webhook');
console.log('==============================');
console.log('');
console.log('✅ Poll de prueba enviado exitosamente');
console.log('📱 Ve al grupo de Telegram y responde el poll');
console.log('');
console.log('🎯 Instrucciones:');
console.log('1. Abre el grupo "@Mi_IA_11_38_Telegram_Moodle"');
console.log('2. Busca el poll de "¿Cuál es la capital de España?"');
console.log('3. Selecciona cualquier respuesta');
console.log('4. Observa estos logs para ver si se procesa');
console.log('');
console.log('⚠️  IMPORTANTE:');
console.log('- El webhook debe estar ejecutándose en http://localhost:3000');
console.log('- Ngrok debe estar apuntando a localhost:3000');
console.log('- El webhook de Telegram debe estar configurado correctamente');
console.log('');
console.log('🔄 Monitoreando webhook cada 3 segundos...');
console.log('   (Presiona Ctrl+C para detener)');
console.log('');

let lastLogTime = Date.now();

async function checkWebhookLogs() {
  try {
    // Simular monitoreo (en una implementación real, esto revisaría logs del servidor)
    const now = new Date().toLocaleTimeString();
    
    // Verificar si el servidor está ejecutándose
    try {
      const response = await fetch('http://localhost:3000/api/health');
      if (response.ok) {
        console.log(`[${now}] ✅ Servidor webhook activo en puerto 3000`);
      } else {
        console.log(`[${now}] ⚠️  Servidor responde pero con error: ${response.status}`);
      }
    } catch (error) {
      console.log(`[${now}] ❌ Servidor webhook no disponible en puerto 3000`);
      console.log('   💡 Ejecuta: npm run dev');
    }
    
  } catch (error) {
    console.log(`❌ Error monitoreando: ${error}`);
  }
}

// Monitoreo inicial
checkWebhookLogs();

// Monitoreo cada 3 segundos
const interval = setInterval(checkWebhookLogs, 3000);

// Manejo de cierre
process.on('SIGINT', () => {
  console.log('\n');
  console.log('🛑 Monitor detenido');
  console.log('');
  console.log('📋 PRÓXIMOS PASOS:');
  console.log('1. Si el poll funcionó, podrás usar el comando completo:');
  console.log('   npx tsx scripts/send-poll-question.ts --list');
  console.log('   npx tsx scripts/send-poll-question.ts --id=PREGUNTA_ID --source=document');
  console.log('');
  console.log('2. Las respuestas se procesarán automáticamente con:');
  console.log('   - ✅ Puntos por respuesta correcta');
  console.log('   - 📊 Actualización de ranking');
  console.log('   - 🔥 Sistema de rachas');
  console.log('   - 🏆 Logros desbloqueados');
  console.log('');
  clearInterval(interval);
  process.exit(0);
});

console.log('💬 RESPONDE EL POLL EN TELEGRAM AHORA...'); 