import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import crypto from 'crypto';
import { prisma } from '../src/lib/prisma';

// Usar fetch nativo de Node.js (disponible desde Node 18+)
const fetch = globalThis.fetch;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8039179482:AAG6bugxwgsmWLVHGoWpE5nih_PQpD3KPBs';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '-1002352049779';

interface ParsedQuestion {
  title: string;
  question: string;
  options: string[];
  correctanswerindex: number;
  explanation: string;
}

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

// Función para mezclar opciones aleatoriamente
function shuffleOptions(parsedData: ParsedQuestion): ParsedQuestion {
  const shuffledData = { ...parsedData };
  const correctOption = shuffledData.options[shuffledData.correctanswerindex];
  
  // Crear array de índices y mezclarlo
  const indices = Array.from({ length: shuffledData.options.length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  
  // Reordenar opciones según los índices mezclados
  shuffledData.options = indices.map(i => parsedData.options[i]);
  
  // Encontrar el nuevo índice de la respuesta correcta
  shuffledData.correctanswerindex = shuffledData.options.findIndex(option => option === correctOption);
  
  if (shuffledData.correctanswerindex === -1) {
    console.log('⚠️  Error mezclando opciones, manteniendo orden original');
    return parsedData;
  }
  
  return shuffledData;
}

// Función para truncar explicación si es muy larga
function truncateExplanation(explanation: string, maxLength: number = 200): string {
  if (explanation.length <= maxLength) {
    return explanation;
  }
  
  // Buscar el último espacio antes del límite para no cortar palabras
  let cutIndex = maxLength - 3; // -3 para los puntos suspensivos
  
  // Buscar hacia atrás el último espacio
  while (cutIndex > 0 && explanation[cutIndex] !== ' ') {
    cutIndex--;
  }
  
  // Si no encontramos espacio, cortar en el límite
  if (cutIndex === 0) {
    cutIndex = maxLength - 3;
  }
  
  return explanation.substring(0, cutIndex).trim() + '...';
}

// Función para truncar opciones si son muy largas
function truncateOption(option: string, maxLength: number = 100): string {
  if (option.length <= maxLength) {
    return option;
  }
  
  // Buscar el último espacio antes del límite para no cortar palabras
  let cutIndex = maxLength - 3; // -3 para los puntos suspensivos
  
  // Buscar hacia atrás el último espacio
  while (cutIndex > 0 && option[cutIndex] !== ' ') {
    cutIndex--;
  }
  
  // Si no encontramos espacio, cortar en el límite
  if (cutIndex === 0) {
    cutIndex = maxLength - 3;
  }
  
  return option.substring(0, cutIndex).trim() + '...';
}

// Función para validar longitud de pregunta antes del envío
function validateQuestionLength(parsedData: ParsedQuestion): boolean {
  // Límites de Telegram
  const MAX_QUESTION_LENGTH = 300;
  const MAX_OPTION_LENGTH = 100;
  const MAX_EXPLANATION_LENGTH = 200;
  
  // Calcular longitud total de la pregunta (incluyendo título si existe)
  let totalQuestionLength = parsedData.question.length;
  if (parsedData.title && parsedData.title.trim() !== '') {
    totalQuestionLength += parsedData.title.length + 2; // +2 por "\n\n"
  }
  
  // Validar longitud de pregunta
  if (totalQuestionLength > MAX_QUESTION_LENGTH) {
    console.log(`   ❌ Pregunta demasiado larga: ${totalQuestionLength}/${MAX_QUESTION_LENGTH} chars`);
    return false;
  }
  
  // Validar longitud de opciones
  for (let i = 0; i < parsedData.options.length; i++) {
    if (parsedData.options[i].length > MAX_OPTION_LENGTH) {
      console.log(`   ❌ Opción ${i + 1} demasiado larga: ${parsedData.options[i].length}/${MAX_OPTION_LENGTH} chars`);
      return false;
    }
  }
  
  // Validar longitud de explicación
  if (parsedData.explanation.length > MAX_EXPLANATION_LENGTH) {
    console.log(`   ❌ Explicación demasiado larga: ${parsedData.explanation.length}/${MAX_EXPLANATION_LENGTH} chars`);
    return false;
  }
  
  return true;
}

// Función centralizada para procesar datos de pregunta
async function parseQuestionData(preguntaSeleccionada: any): Promise<ParsedQuestion | null> {
  try {
    let parsedData: ParsedQuestion;
    
    // Determinar estructura según tabla fuente
    if (preguntaSeleccionada.sourceTable === 'constitucion') {
      // Tablas con campos pre-parseados
      parsedData = {
        title: preguntaSeleccionada.title || '',
        question: preguntaSeleccionada.parsedquestion || '',
        options: typeof preguntaSeleccionada.parsedoptions === 'string' 
                 ? JSON.parse(preguntaSeleccionada.parsedoptions) 
                 : preguntaSeleccionada.parsedoptions || [],
        correctanswerindex: preguntaSeleccionada.correctanswerindex || 0,
        explanation: preguntaSeleccionada.parsedexplanation || 'Respuesta correcta'
      };
    } else {
      // Otras tablas con campos directos
      let options: string[] = [];
      if (typeof preguntaSeleccionada.options === 'string') {
        try {
          const optionsStr = preguntaSeleccionada.options.trim();
          if (optionsStr.startsWith('{') && optionsStr.endsWith('}')) {
            const content = optionsStr.slice(1, -1);
            options = content.split('","').map((opt: string) => 
               opt.replace(/^"|"$/g, '').replace(/%[-]?\d+(\.\d+)?%/g, '').replace(/^%-\d+(\.\d+)?%/g, '').trim()
             );
          } else {
            options = JSON.parse(preguntaSeleccionada.options);
          }
        } catch (error: any) {
          console.log('❌ Error parseando opciones:', error.message);
          options = [];
        }
      } else {
        options = preguntaSeleccionada.options || [];
      }
      
      parsedData = {
        title: preguntaSeleccionada.title || '',
        question: preguntaSeleccionada.question || '',
        options: options,
        correctanswerindex: preguntaSeleccionada.correctanswerindex || 0,
        explanation: preguntaSeleccionada.feedback || 'Respuesta correcta'
      };
    }
    
    // Validar datos mínimos
    if (!parsedData.question || !parsedData.options || parsedData.options.length === 0) {
      console.log('❌ Datos de pregunta incompletos');
      return null;
    }
    
    // Limpiar y procesar contenido
    parsedData.question = parsedData.question
      .replace(/\/\/[^\n]*::.*?::/g, '')  // Eliminar comentarios
      .replace(/\/\/[^\n]*/g, '')         // Eliminar otros comentarios
      .replace(/<br\s*\/?>/gi, '\n')     // Convertir <br> a saltos de línea
      .replace(/<[^>]*>/g, '')           // Remover etiquetas HTML
      .replace(/\\n/g, '\n')             // Convertir \n literales
      .trim();
    
    parsedData.options = parsedData.options.map(option => {
      const cleanOption = option.replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]*>/g, '')
            .replace(/\\n/g, '\n')
            .replace(/^%-\d+(\.\d+)?%/g, '')
            .replace(/%[-]?\d+(\.\d+)?%/g, '')
            .trim();
      // Truncar opciones largas automáticamente
      return truncateOption(cleanOption, 100);
    });
    
    parsedData.explanation = parsedData.explanation
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/\\n/g, '\n');
    
    // Truncar explicación larga automáticamente
    parsedData.explanation = truncateExplanation(parsedData.explanation, 200);
    
    return parsedData;
    
  } catch (error: any) {
    console.log('❌ Error procesando datos de pregunta:', error.message);
    return null;
  }
}

// Función para obtener preguntas de múltiples tablas
async function getAllQuestionsFromTables(limit: number) {
  const tablas = [
    'constitucion', 'defensanacional', 'rio', 'minsdef', 'organizacionfas',
    'emad', 'et', 'armada', 'aire', 'carrera', 'tropa', 'rroo',
    'derechosydeberes', 'regimendisciplinario', 'iniciativasquejas',
    'igualdad', 'omi', 'pac', 'seguridadnacional', 'pdc',
    'onu', 'otan', 'osce', 'ue', 'misionesinternacionales'
  ];
  
  const todasLasPreguntas = [];
  
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
      
    } catch (error) {
      console.log(`⚠️  Error consultando tabla ${tabla}:`, error);
    }
  }
  
  // Mezclar todas las preguntas
  for (let i = todasLasPreguntas.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [todasLasPreguntas[i], todasLasPreguntas[j]] = [todasLasPreguntas[j], todasLasPreguntas[i]];
  }
  
  return todasLasPreguntas;
}

// Función principal para enviar polls diarios
async function sendDailyPoll() {
  try {
    console.log('🚀 Iniciando envío de polls diarios...');
    
    // Cargar configuración
    const config = loadSchedulerConfig();
    
    if (!config.dailyPolls.enabled) {
      console.log('⏸️  Envío de polls diarios deshabilitado en configuración');
      return;
    }
    
    const questionsToSend = config.dailyPolls.questionsPerSend || 1;
    console.log(`📊 Configurado para enviar ${questionsToSend} pregunta(s)`);
    
    // Obtener 10 veces más preguntas para filtrar
    const preguntasDisponibles = await getAllQuestionsFromTables(questionsToSend * 10);
    
    if (preguntasDisponibles.length === 0) {
      console.log('❌ No hay preguntas disponibles');
      return;
    }
    
    console.log(`📚 ${preguntasDisponibles.length} preguntas disponibles para filtrar`);
    
    // Filtrar preguntas que cumplan con los límites de Telegram
    const preguntasValidas = [];
    
    for (const pregunta of preguntasDisponibles) {
      if (preguntasValidas.length >= questionsToSend) break;
      
      const parsedData = await parseQuestionData(pregunta);
      if (parsedData && validateQuestionLength(parsedData)) {
        preguntasValidas.push(pregunta);
        console.log(`✅ Pregunta válida encontrada (${preguntasValidas.length}/${questionsToSend})`);
      }
    }
    
    if (preguntasValidas.length === 0) {
      console.log('❌ No se encontraron preguntas que cumplan con los límites de Telegram');
      return;
    }
    
    console.log(`🎯 ${preguntasValidas.length} pregunta(s) válida(s) seleccionada(s)`);
    
    // Enviar mensaje de contexto si hay múltiples preguntas
    if (preguntasValidas.length > 1) {
      await sendContextMessage(preguntasValidas[0], preguntasValidas.length);
    }
    
    // Procesar y enviar cada pregunta válida
    let preguntasEnviadas = 0;
    for (let i = 0; i < preguntasValidas.length; i++) {
      const pregunta = preguntasValidas[i];
      console.log(`\n📝 Procesando pregunta ${i + 1}/${preguntasValidas.length}...`);
      
      const enviado = await processSingleQuestion(pregunta, preguntasValidas.length === 1);
      if (enviado) {
        preguntasEnviadas++;
        
        if (i < preguntasValidas.length - 1) {
          console.log('⏳ Esperando 2 segundos antes de la siguiente pregunta...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    console.log(`\n🎉 Proceso completado: ${preguntasEnviadas}/${preguntasValidas.length} preguntas enviadas exitosamente`);
    
  } catch (error) {
    console.error('❌ Error en sendDailyPoll:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Función para procesar una sola pregunta
async function processSingleQuestion(preguntaSeleccionada: any, sendContextMessage: boolean = true): Promise<boolean> {
  try {
    console.log(`🔍 Procesando pregunta ID: ${preguntaSeleccionada.id} de tabla: ${preguntaSeleccionada.sourceTable}`);
    
    // Procesar datos de la pregunta
    const parsedData = await parseQuestionData(preguntaSeleccionada);
    if (!parsedData) {
      console.log('❌ Error procesando datos de la pregunta');
      return false;
    }
    
    // DEBUG: Mostrar datos procesados
    console.log('📊 Datos procesados:');
    console.log(`   Pregunta: "${parsedData.question.substring(0, 50)}..." (${parsedData.question?.length || 0} chars)`);
    console.log(`   Opciones: ${parsedData.options?.length || 0} opciones`);
    if (parsedData.options) {
      parsedData.options.forEach((opt, i) => {
        console.log(`     ${i + 1}. "${opt.substring(0, 30)}..." (${opt?.length || 0} chars)`);
      });
    }
    console.log(`   Respuesta correcta: ${parsedData.correctanswerindex + 1}`);
    
    // Mezclar opciones
    console.log('🔀 Mezclando opciones aleatoriamente...');
    const finalParsedData = shuffleOptions(parsedData);
    
    // Construir texto de la pregunta
    let questionText = finalParsedData.question;
    if (finalParsedData.title && finalParsedData.title.trim() !== '') {
      questionText = `${finalParsedData.title}\n\n${finalParsedData.question}`;
    }
    
    // Enviar poll a Telegram
    console.log('📤 Enviando poll a Telegram...');
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPoll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        question: questionText,
        options: finalParsedData.options,
        type: 'quiz',
        correct_option_id: finalParsedData.correctanswerindex,
        explanation: finalParsedData.explanation,
        explanation_parse_mode: 'HTML',
        is_anonymous: false,
      })
    });
    
    const result = await response.json() as any;
    
    if (result.ok && result.result) {
      console.log('✅ Poll enviado exitosamente');
      
      // Guardar mapeo en telegrampoll para que el webhook pueda encontrar la pregunta
      try {
        const pollId = result.result.poll.id;
        console.log(`💾 Guardando mapeo en telegrampoll: pollId=${pollId}, questionId=${preguntaSeleccionada.id}`);
        
        await prisma.telegrampoll.create({
          data: {
            id: crypto.randomUUID(),
            pollid: pollId,
            questionid: preguntaSeleccionada.id,
            sourcemodel: preguntaSeleccionada.sourceTable,
            correctanswerindex: finalParsedData.correctanswerindex,
            options: JSON.stringify(finalParsedData.options),
            chatid: CHAT_ID,
            createdat: new Date()
          }
        });
        
        console.log('✅ Mapeo guardado en telegrampoll');
      } catch (mappingError) {
        console.log('⚠️  Error guardando mapeo en telegrampoll:', mappingError);
      }
      
      // Actualizar contador de envíos
      try {
        const updateData = {
          sendcount: { increment: 1 },
          lastsuccessfulsendat: new Date()
        };
        
        if (preguntaSeleccionada.sourceTable === 'constitucion') {
          await prisma.constitucion.update({
            where: { id: preguntaSeleccionada.id },
            data: updateData
          });
        } else {
          await (prisma as any)[preguntaSeleccionada.sourceTable].update({
            where: { id: preguntaSeleccionada.id },
            data: updateData
          });
        }
        
        console.log(`📈 Contador actualizado: ${(preguntaSeleccionada.sendcount || 0) + 1} envíos`);
      } catch (updateError) {
        console.log('⚠️  Error actualizando contador:', updateError);
      }
      
      return true;
    } else {
      console.log('❌ Error enviando poll:', result);
      return false;
    }
    
  } catch (error: any) {
    console.error('❌ Error procesando pregunta:', error);
    return false;
  }
}

// Función para enviar mensaje de contexto
async function sendContextMessage(firstQuestionData: any, totalquestions: number) {
  try {
    const contextText = `📚 **PREGUNTAS DIARIAS DE OPOSICIÓN**\n\n` +
                       `🎯 Hoy tienes **${totalquestions} pregunta${totalquestions > 1 ? 's' : ''}** para practicar\n` +
                       `📖 Fuente: ${firstQuestionData.sourceTable}\n` +
                       `⏰ ${new Date().toLocaleDateString('es-ES', { 
                         weekday: 'long', 
                         year: 'numeric', 
                         month: 'long', 
                         day: 'numeric' 
                       })}\n\n` +
                       `💡 **Consejos:**\n` +
                       `• Lee cada pregunta con atención\n` +
                       `• Analiza todas las opciones antes de responder\n` +
                       `• Revisa la explicación para reforzar el aprendizaje\n\n` +
                       `¡Mucha suerte! 🍀`;

    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: contextText,
        parse_mode: 'Markdown'
      })
    });

    const result = await response.json() as any;
    if (result.ok) {
      console.log('✅ Mensaje de contexto enviado');
    } else {
      console.log('⚠️  Error enviando mensaje de contexto:', result);
    }
  } catch (error) {
    console.log('⚠️  Error enviando mensaje de contexto:', error);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  sendDailyPoll();
}

export { sendDailyPoll };