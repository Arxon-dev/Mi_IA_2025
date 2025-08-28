import fetch from 'node-fetch';

async function testWebhook() {
  // Probar puerto 3000 primero (estándar), luego 3001 si es necesario
  const ports = [3000, 3001, 3002];
  
  for (const port of ports) {
    try {
      console.log(`🧪 Probando webhook endpoint en http://localhost:${port}...`);
      
      const response = await fetch(`http://localhost:${port}/api/telegram/webhook`, {
        method: 'GET'
      });
      
      console.log('✅ Status:', response.status);
      
      if (response.status === 200) {
        console.log(`✅ ¡Webhook endpoint está funcionando correctamente en puerto ${port}!`);
        
        const text = await response.text();
        if (text) {
          console.log('📄 Respuesta:', text.substring(0, 100) + '...');
        }
        return; // Éxito, salir del bucle
      } else {
        console.log('⚠️  Webhook responde pero con status:', response.status);
      }
      
    } catch (error) {
      console.log(`❌ Puerto ${port} no disponible`);
      if (port === ports[ports.length - 1]) {
        // Último puerto probado
        console.error('\n❌ Error: No se pudo conectar al webhook en ningún puerto');
        console.log('\n💡 Asegúrate de que:');
        console.log('   - Next.js está corriendo (npm run dev)');
        console.log('   - El archivo api/telegram/webhook/route.ts existe');
        console.log('   - El servidor muestra "Ready on http://localhost:XXXX"');
      }
    }
  }
}

testWebhook(); 