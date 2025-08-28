import { spawn } from 'child_process';

console.log('🔍 MONITOREANDO WEBHOOK EN TIEMPO REAL');
console.log('=====================================');
console.log('🎯 Este script monitoreará los logs del webhook para detectar respuestas de Carlos_esp');
console.log('📊 Buscando patrones específicos en los logs...');
console.log('');

// Ejecutar curl para obtener logs del webhook
function monitorWebhook() {
  console.log('🚀 Iniciando monitoreo...');
  console.log('⏰ Timestamp:', new Date().toLocaleString());
  console.log('');
  
  // Hacer una petición GET al webhook para verificar que está funcionando
  fetch('http://localhost:3000/api/telegram/webhook')
    .then(response => response.json())
    .then(data => {
      console.log('✅ Webhook respondiendo:', data);
      console.log('');
      console.log('🎯 AHORA RESPONDE LA PREGUNTA EN TELEGRAM:');
      console.log('   📱 Ve al grupo "OpoMelilla"');
      console.log('   🔍 Busca: "🎉 PRUEBA FINAL - ¿Cuántas provincias tiene Andalucía?"');
      console.log('   👆 Haz click en "8"');
      console.log('   ⏱️  Los logs aparecerán aquí automáticamente');
      console.log('');
      
      // Monitorear logs cada 2 segundos
      setInterval(() => {
        const now = new Date();
        console.log(`🔄 [${now.toLocaleTimeString()}] Monitoreando... (Responde ahora en Telegram)`);
      }, 5000);
      
    })
    .catch(error => {
      console.error('❌ Error conectando al webhook:', error);
      console.log('');
      console.log('🚨 PROBLEMA: El webhook no está respondiendo');
      console.log('   Asegúrate de que npm run dev esté corriendo');
    });
}

monitorWebhook();

// Mantener el script corriendo
process.on('SIGINT', () => {
  console.log('');
  console.log('🛑 Monitoreo detenido');
  process.exit(0);
}); 