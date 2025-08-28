/**
 * 🚀 SCRIPT: CREAR TORNEO INSTANTÁNEO
 * 
 * Script optimizado para crear torneos rápidos con configuración flexible
 * - Programado para iniciar en 10 minutos
 * - Configuración personalizable
 * - Notificación automática a Telegram
 * - Sistema de premios dinámico
 */

interface TournamentConfig {
  name: string;
  description: string;
  totalQuestions: number;
  duration: number; // en minutos
  startDelayMinutes: number;
  questionCategory: 'mixed' | 'specific';
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  examSource: 'both' | '2018' | '2024';
}

class InstantTournamentCreator {
  private config: TournamentConfig;
  private apiUrl: string;

  constructor(config?: Partial<TournamentConfig>) {
    this.apiUrl = 'http://localhost:3000/api/admin/tournaments';
    this.config = {
      name: `🎯 TORNEO RAPIDO - ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`,
      description: '⚡ Torneo instantaneo - ¡Unete rapido y demuestra tus conocimientos!',
      totalQuestions: 15,
      duration: 12,
      startDelayMinutes: 10,
      questionCategory: 'mixed',
      difficulty: 'mixed',
      examSource: 'both',
      ...config
    };
  }

  private calculateStartTime(): Date {
    const startTime = new Date();
    startTime.setMinutes(startTime.getMinutes() + this.config.startDelayMinutes);
    return startTime;
  }

  private formatTimeRemaining(startTime: Date): string {
    const now = new Date();
    const diff = startTime.getTime() - now.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${minutes}m ${seconds}s`;
  }

  private displayConfiguration(startTime: Date): void {
    console.log('🎯 ===== CREANDO TORNEO INSTANTÁNEO =====\n');
    console.log('⚙️ CONFIGURACIÓN:');
    console.log(`   📛 Nombre: ${this.config.name}`);
    console.log(`   📄 Descripción: ${this.config.description}`);
    console.log(`   ❓ Preguntas: ${this.config.totalQuestions}`);
    console.log(`   ⏱️ Duración: ${this.config.duration} minutos`);
    console.log(`   📅 Inicio: ${startTime.toLocaleString('es-ES')}`);
    console.log(`   ⏰ Tiempo restante: ${this.formatTimeRemaining(startTime)}`);
    console.log(`   📚 Fuente: ${this.config.examSource}`);
    console.log(`   🎲 Dificultad: ${this.config.difficulty}\n`);
  }

  private async createTournament(): Promise<any> {
    const startTime = this.calculateStartTime();
    
    const tournamentData = {
      name: this.config.name,
      description: this.config.description,
      totalQuestions: this.config.totalQuestions,
      duration: this.config.duration,
      startTime: startTime.toISOString(),
      questionCategory: this.config.questionCategory,
      difficulty: this.config.difficulty,
      examSource: this.config.examSource
    };

    this.displayConfiguration(startTime);

    console.log('🚀 ENVIANDO SOLICITUD A LA API...\n');
    
    // ✅ AGREGAR DEBUG DEL JSON
    const jsonString = JSON.stringify(tournamentData);
    console.log('🔍 JSON que se envía:', jsonString);
    console.log('🔍 Longitud del JSON:', jsonString.length);
    console.log('🔍 Carácter en posición 73:', jsonString.charAt(72));
    console.log('🔍 Contexto alrededor de posición 73:', jsonString.substring(65, 80));

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: jsonString
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      return { result, startTime };
    } catch (error) {
      console.error('❌ Error creando torneo:', error);
      
      if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
        console.log('\n💡 SOLUCIÓN:');
        console.log('   1. Asegúrate de que el servidor esté ejecutándose:');
        console.log('      npm run dev');
        console.log('   2. Verifica que esté en el puerto 3000');
        console.log('   3. Vuelve a ejecutar este script\n');
      }
      
      throw error;
    }
  }

  private displaySuccess(result: any, startTime: Date): void {
    console.log('✅ ¡TORNEO CREADO EXITOSAMENTE!\n');
    console.log('📊 DETALLES DEL TORNEO:');
    console.log(`   🆔 ID: ${result.id}`);
    console.log(`   📛 Nombre: ${result.name}`);
    console.log(`   ❓ Preguntas: ${result.totalQuestions || result.totalquestions}`);
    console.log(`   👥 Participantes: ${result.participants || 0}`);
    console.log(`   📊 Estado: ${result.status}`);
    console.log(`   📅 Inicio: ${startTime.toLocaleString('es-ES')}`);
    console.log(`   ⏰ Tiempo restante: ${this.formatTimeRemaining(startTime)}\n`);

    console.log('📱 NOTIFICACIÓN ENVIADA:');
    console.log('   ✅ Anuncio automático enviado a Telegram');
    console.log('   ✅ Los usuarios pueden unirse con /torneo_unirse');
    console.log('   ✅ PrizePool dinámico activado\n');

    console.log('🎯 COMANDOS PARA LOS USUARIOS:');
    console.log('   • /torneo_unirse - Unirse al torneo');
    console.log('   • /torneos - Ver torneos disponibles');
    console.log('   • /ranking - Ver ranking general\n');

    console.log('🎊 ¡TORNEO LISTO! Los usuarios ya pueden registrarse.');
  }

  public async execute(): Promise<any> {
    try {
      const { result, startTime } = await this.createTournament();
      this.displaySuccess(result, startTime);
      return result;
    } catch (error) {
      console.error('❌ Error en la ejecución:', error);
      throw error;
    }
  }
}

// 🎯 FUNCIÓN PRINCIPAL
async function createInstantTournament(customConfig?: Partial<TournamentConfig>) {
  const creator = new InstantTournamentCreator(customConfig);
  return await creator.execute();
}

// 🚀 CONFIGURACIONES PREDEFINIDAS
const PRESET_CONFIGS = {
  quick: {
    name: 'TORNEO RAPIDO',
    description: 'Torneo express de 10 preguntas',
    totalQuestions: 10,
    duration: 8,
    startDelayMinutes: 5
  },
  standard: {
    name: 'TORNEO ESTANDAR',
    description: 'Torneo estandar de 15 preguntas',
    totalQuestions: 15,
    duration: 12,
    startDelayMinutes: 10
  },
  challenge: {
    name: 'TORNEO DESAFIO',
    description: 'Torneo desafio de 20 preguntas',
    totalQuestions: 20,
    duration: 15,
    startDelayMinutes: 15,
    difficulty: 'hard' as const
  }
};

// 🎮 EJECUTAR SCRIPT
if (require.main === module) {
  // Puedes cambiar 'standard' por 'quick' o 'challenge'
  const preset = process.argv[2] as keyof typeof PRESET_CONFIGS || 'standard';
  
  if (PRESET_CONFIGS[preset]) {
    console.log(`🎯 Usando configuración: ${preset.toUpperCase()}\n`);
    createInstantTournament(PRESET_CONFIGS[preset]);
  } else {
    console.log('🎯 Usando configuración estándar\n');
    createInstantTournament();
  }
}

export { createInstantTournament, InstantTournamentCreator, PRESET_CONFIGS };