import cron from 'node-cron';
import { sendDailyPoll } from './auto-send-daily-poll';

console.log('⏰ SCHEDULER DE POLLS AUTOMÁTICOS');
console.log('=================================');
console.log('');

// Configuración de horarios (puedes ajustar según tus necesidades)
const SCHEDULE_CONFIG = {
  // Envío diario a las 9:00 AM (hora local)
  dailyAt9AM: '0 9 * * *',
  
  // Envío cada 5 minutos (para pruebas)
  every5Minutes: '*/5 * * * *',
  
  // Envío cada 30 minutos
  every30Minutes: '*/30 * * * *',
  
  // Envío cada 1 hora
  everyHour: '0 * * * *',
  
  // Envío cada 2 horas entre 8 AM y 8 PM
  everyTwoHours: '0 8-20/2 * * *',
  
  // Solo lunes a viernes a las 10 AM
  weekdaysAt10AM: '0 10 * * 1-5',
  
  // Fines de semana a las 11 AM
  weekendsAt11AM: '0 11 * * 6,0'
};

// Función principal del scheduler
function startScheduler() {
  console.log('🚀 Iniciando scheduler...');
  console.log('📅 Configuración actual: Envío cada 1 hora');
  console.log('');
  
  // Programar envío cada 1 hora
  cron.schedule(SCHEDULE_CONFIG.everyHour, async () => {
    console.log('⏰ Hora de envío automático:', new Date().toLocaleString());
    try {
      await sendDailyPoll();
      console.log('✅ Envío automático completado');
    } catch (error) {
      console.error('❌ Error en envío automático:', error);
    }
  }, {
    timezone: "Europe/Madrid" // Ajusta según tu zona horaria
  });
  
  console.log('✅ Scheduler activo');
  console.log('📋 Próximo envío programado: Cada hora en punto');
  console.log('');
  console.log('💡 Para cambiar horarios, edita SCHEDULE_CONFIG en scheduler.ts');
  console.log('🛑 Para detener: Ctrl+C');
  console.log('');
  
  // Mostrar status cada hora
  cron.schedule('0 * * * *', () => {
    const now = new Date();
    console.log(`⏰ Status: ${now.toLocaleString()} - Scheduler funcionando correctamente`);
  });
}

// Función para envío manual inmediato
async function sendNow() {
  console.log('📤 ENVÍO MANUAL INMEDIATO');
  console.log('========================');
  try {
    await sendDailyPoll();
    console.log('✅ Envío manual completado');
  } catch (error) {
    console.error('❌ Error en envío manual:', error);
  }
}

// Detectar argumentos de línea de comandos
const args = process.argv.slice(2);

if (args.includes('--now')) {
  // Envío inmediato
  sendNow();
} else if (args.includes('--help')) {
  // Mostrar ayuda
  console.log('📋 USO DEL SCHEDULER:');
  console.log('');
  console.log('  🕘 Iniciar scheduler automático:');
  console.log('     npx tsx scripts/scheduler.ts');
  console.log('');
  console.log('  📤 Envío manual inmediato:');
  console.log('     npx tsx scripts/scheduler.ts --now');
  console.log('');
  console.log('  📋 Mostrar esta ayuda:');
  console.log('     npx tsx scripts/scheduler.ts --help');
  console.log('');
  console.log('⚙️  CONFIGURACIÓN ACTUAL:');
  console.log('   • Envío cada: 30 minutos');
  console.log('   • Zona horaria: Europe/Madrid');
  console.log('   • Repetición: Continua (24/7)');
} else {
  // Iniciar scheduler por defecto
  startScheduler();
}