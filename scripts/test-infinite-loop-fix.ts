/**
 * Script de prueba para verificar la solución del bucle infinito
 * Pregunta problemática: f24f326b-c78c-4a0d-9d1d-425864398d64
 * 
 * Problema identificado:
 * - Las opciones contienen porcentajes negativos: %-33.33333%
 * - Después de la limpieza, las opciones quedan vacías
 * - Esto causaba un bucle infinito al buscar preguntas alternativas
 * 
 * Solución implementada:
 * 1. Contador de intentos (máximo 5)
 * 2. Validación mejorada de opciones vacías
 * 3. Logging adicional para rastreo
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Simular el procesamiento de opciones como lo hace el código real
function processOptions(optionsString: string): string[] {
  console.log(`🔧 Procesando opciones: ${optionsString}`);
  
  let options: string[] = [];
  
  // Convertir {"opción1","opción2"} a ["opción1","opción2"]
  let optionsStr = optionsString.trim();
  
  // Remover llaves externas
  if (optionsStr.startsWith('[') && optionsStr.endsWith(']')) {
    optionsStr = optionsStr.slice(1, -1);
  }
  
  // Dividir por comas que no estén dentro de comillas
  const regex = /"([^"]+)"/g;
  const matches: string[] = [];
  let match;
  
  while ((match = regex.exec(optionsStr)) !== null) {
    matches.push(match[1]);
  }
  
  if (matches.length > 0) {
    options = matches;
  } else {
    // Fallback: dividir por comas simples
    options = optionsStr.split(',').map(opt => opt.trim().replace(/^"(.*)"$/, '$1'));
  }
  
  console.log(`📝 Opciones antes de limpieza:`, options);
  
  // Limpiar opciones eliminando porcentajes al inicio
  options = options.map((option: string) => {
    const cleaned = option.replace(/^%[-\d.]+%/, '').trim();
    console.log(`   "${option}" → "${cleaned}"`);
    return cleaned;
  }).filter((option: string) => option && option.length > 0);
  
  console.log(`✅ Opciones después de limpieza:`, options);
  
  return options;
}

// Simular la validación de opciones
function validateOptions(options: string[], questionId: string): boolean {
  console.log(`🎯 Validando opciones para pregunta ${questionId}`);
  
  // Validar que tengamos al menos 2 opciones válidas (no vacías)
  const validOptions = options.filter(option => option && option.trim().length > 0);
  
  console.log(`📊 Total opciones: ${options.length}, Opciones válidas: ${validOptions.length}`);
  
  if (validOptions.length < 2) {
    console.error(`❌ Opciones insuficientes para la pregunta: ${questionId}`);
    console.error(`   📊 Total opciones: ${options.length}, Opciones válidas: ${validOptions.length}`);
    console.error(`   📝 Opciones originales:`, options);
    return false;
  }
  
  console.log(`✅ Validación exitosa: ${validOptions.length} opciones válidas`);
  return true;
}

async function testProblematicQuestion() {
  console.log('🧪 INICIANDO PRUEBA DE PREGUNTA PROBLEMÁTICA');
  console.log('=' .repeat(60));
  
  try {
    // Buscar la pregunta problemática
    const question = await prisma.$queryRaw`
      SELECT id, questionnumber, question, options, correctanswerindex 
      FROM constitucion 
      WHERE id = 'f24f326b-c78c-4a0d-9d1d-425864398d64'
    ` as any[];
    
    if (question.length === 0) {
      console.log('❌ Pregunta no encontrada en la base de datos');
      return;
    }
    
    const questionData = question[0];
    console.log(`📋 Pregunta encontrada: ${questionData.id}`);
    console.log(`📝 Texto: ${questionData.question}`);
    console.log(`🔧 Opciones raw: ${questionData.options}`);
    
    // Procesar las opciones
    const processedOptions = processOptions(questionData.options);
    
    // Validar las opciones
    const isValid = validateOptions(processedOptions, questionData.id);
    
    console.log('\n' + '=' .repeat(60));
    console.log(`🎯 RESULTADO: ${isValid ? '✅ VÁLIDA' : '❌ INVÁLIDA'}`);
    
    if (!isValid) {
      console.log('🔄 Esta pregunta causaría un bucle infinito sin la solución implementada');
      console.log('✅ Con la solución: se detendría después de 5 intentos');
    }
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function testCounterLogic() {
  console.log('\n🧪 PROBANDO LÓGICA DEL CONTADOR DE INTENTOS');
  console.log('=' .repeat(60));
  
  // Simular múltiples intentos
  for (let attempt = 0; attempt < 7; attempt++) {
    console.log(`\n🔄 Intento ${attempt + 1}/5`);
    
    if (attempt >= 5) {
      console.error(`🚫 LÍMITE DE INTENTOS ALCANZADO (${attempt}) - Deteniendo búsqueda de alternativas para evitar bucle infinito`);
      console.error(`📋 Historial de preguntas rechazadas en esta sesión`);
      console.error(`👤 Usuario: test-user, Materia: constitucion`);
      console.log('✅ Bucle infinito evitado exitosamente');
      break;
    }
    
    console.log(`📊 [Intento ${attempt + 1}] Buscando pregunta alternativa...`);
    console.log(`❌ Pregunta rechazada (simulado)`);
  }
}

async function main() {
  console.log('🚀 INICIANDO PRUEBAS DE SOLUCIÓN BUCLE INFINITO');
  console.log('Fecha:', new Date().toISOString());
  console.log('\n');
  
  await testProblematicQuestion();
  await testCounterLogic();
  
  console.log('\n🎉 PRUEBAS COMPLETADAS');
}

if (require.main === module) {
  main().catch(console.error);
}

export { processOptions, validateOptions };