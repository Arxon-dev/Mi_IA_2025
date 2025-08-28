import { PrismaClient } from '@prisma/client';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

interface SchedulerConfig {
  dailyPolls: {
    enabled: boolean;
    questionsPerSend?: number;
    time?: string;
    frequency?: string;
    customMinutes?: number;
    startHour?: number;
    startMinute?: number;
    endHour?: number;
    endMinute?: number;
  };
}

// Función para cargar configuración del scheduler
function loadSchedulerConfig(): SchedulerConfig {
  try {
    const configPath = join(process.cwd(), 'scheduler-config.json');
    if (existsSync(configPath)) {
      const configContent = readFileSync(configPath, 'utf-8');
      const config = JSON.parse(configContent);
      console.log(`📋 Configuración cargada: questionsPerSend = ${config.dailyPolls?.questionsPerSend || 'no definido'}`);
      return config;
    } else {
      console.log('⚠️  Archivo de configuración no encontrado, usando valores por defecto');
      return { dailyPolls: { enabled: true, questionsPerSend: 10 } };
    }
  } catch (error) {
    console.log('⚠️  Error cargando configuración, usando valores por defecto:', error);
    return { dailyPolls: { enabled: true, questionsPerSend: 10 } };
  }
}

// Función para analizar selección de tablas
async function analyzeTableSelection(limit: number, iterations: number = 3) {
  const tablas = [
    'constitucion', 'defensanacional', 'rio', 'minsdef', 'organizacionfas',
    'emad', 'et', 'armada', 'aire', 'carrera', 'tropa', 'rroo',
    'derechosydeberes', 'regimendisciplinario', 'iniciativasquejas',
    'igualdad', 'omi', 'pac', 'seguridadnacional', 'pdc',
    'onu', 'otan', 'osce', 'ue', 'misionesinternacionales'
  ];

  console.log(`🔍 Analizando selección de tablas para ${limit} preguntas`);
  console.log(`📊 Total de tablas disponibles: ${tablas.length}`);
  console.log(`🔄 Simulando ${iterations} iteraciones\n`);

  for (let iter = 1; iter <= iterations; iter++) {
    console.log(`\n🚀 ========== ITERACIÓN ${iter} ==========`);
    
    const todasLasPreguntas = [];
    const estadisticasPorTabla: { [key: string]: { total: number, seleccionadas: number, sendCount: number[] } } = {};
    
    // Inicializar estadísticas
    tablas.forEach(tabla => {
      estadisticasPorTabla[tabla] = { total: 0, seleccionadas: 0, sendCount: [] };
    });
    
    // Obtener preguntas de cada tabla
    for (const tabla of tablas) {
      try {
        let preguntas;
        
        if (tabla === 'constitucion') {
          preguntas = await prisma.constitucion.findMany({
            orderBy: [
              { sendcount: 'asc' },
              { lastsuccessfulsendat: 'asc' },
              { id: 'asc' }
            ],
            take: Math.ceil(limit / tablas.length) + 5
          });
        } else {
          preguntas = await (prisma as any)[tabla].findMany({
            orderBy: [
              { sendcount: 'asc' },
              { lastsuccessfulsendat: 'asc' },
              { id: 'asc' }
            ],
            take: Math.ceil(limit / tablas.length) + 5
          });
        }
        
        const preguntasConTabla = preguntas.map((pregunta: any) => ({
           ...pregunta,
           sourceTable: tabla
         }));
        
        todasLasPreguntas.push(...preguntasConTabla);
        estadisticasPorTabla[tabla].total = preguntas.length;
        estadisticasPorTabla[tabla].sendCount = preguntas.map((p: any) => p.sendcount || 0);
        
        console.log(`📋 ${tabla}: ${preguntas.length} preguntas obtenidas`);
        
      } catch (error) {
        console.log(`⚠️  Error consultando tabla ${tabla}:`, error);
      }
    }
    
    console.log(`\n📚 Total de preguntas obtenidas: ${todasLasPreguntas.length}`);
    
    // Mezclar todas las preguntas (simulando el algoritmo real)
    for (let i = todasLasPreguntas.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [todasLasPreguntas[i], todasLasPreguntas[j]] = [todasLasPreguntas[j], todasLasPreguntas[i]];
    }
    
    // Seleccionar las primeras 'limit' preguntas
    const preguntasSeleccionadas = todasLasPreguntas.slice(0, limit);
    
    console.log(`\n🎯 Preguntas seleccionadas para envío:`);
    preguntasSeleccionadas.forEach((pregunta, index) => {
      console.log(`   ${index + 1}. Tabla: ${pregunta.sourceTable} | ID: ${pregunta.id} | SendCount: ${pregunta.sendcount || 0}`);
      estadisticasPorTabla[pregunta.sourceTable].seleccionadas++;
    });
    
    console.log(`\n📊 Resumen por tabla:`);
    tablas.forEach(tabla => {
      const stats = estadisticasPorTabla[tabla];
      const avgSendCount = stats.sendCount.length > 0 
        ? (stats.sendCount.reduce((a, b) => a + b, 0) / stats.sendCount.length).toFixed(1)
        : '0';
      
      console.log(`   ${tabla}: ${stats.seleccionadas}/${stats.total} seleccionadas (${((stats.seleccionadas/limit)*100).toFixed(1)}%) | Avg SendCount: ${avgSendCount}`);
    });
    
    // Simular actualización de sendCount para la siguiente iteración
    if (iter < iterations) {
      console.log(`\n🔄 Simulando actualización de sendCount para siguiente iteración...`);
      for (const pregunta of preguntasSeleccionadas) {
        try {
          if (pregunta.sourceTable === 'constitucion') {
            await prisma.constitucion.update({
              where: { id: pregunta.id },
              data: {
                sendcount: { increment: 1 },
                lastsuccessfulsendat: new Date()
              }
            });
          } else {
            await (prisma as any)[pregunta.sourceTable].update({
              where: { id: pregunta.id },
              data: {
                sendcount: { increment: 1 },
                lastsuccessfulsendat: new Date()
              }
            });
          }
        } catch (error) {
          console.log(`⚠️  Error actualizando ${pregunta.sourceTable}:${pregunta.id}`);
        }
      }
    }
  }
}

async function main() {
  try {
    const config = loadSchedulerConfig();
    const questionsToSend = config.dailyPolls.questionsPerSend || 10;
    
    console.log('🔍 ANÁLISIS DE SELECCIÓN DE TABLAS');
    console.log('=====================================\n');
    
    await analyzeTableSelection(questionsToSend, 3);
    
  } catch (error) {
    console.error('❌ Error en análisis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { analyzeTableSelection };