import GamificationService from '../src/services/gamificationService';

async function initializeAchievements() {
  try {
    console.log('🎯 Inicializando logros básicos...');
    
    await GamificationService.initializeBasicAchievements();
    
    console.log('✅ Logros básicos inicializados correctamente!');
    console.log('');
    console.log('📋 Logros disponibles:');
    console.log('🎯 Primera Respuesta - 50 pts');
    console.log('🔥 Racha de 3 días - 100 pts');
    console.log('🔥 Racha de 7 días - 250 pts');
    console.log('⚡ Velocista - 200 pts');
    console.log('🎯 Francotirador - 300 pts');
    console.log('💯 Centurión - 500 pts');
    
  } catch (error) {
    console.error('❌ Error inicializando logros:', error);
    process.exit(1);
  }
}

initializeAchievements(); 