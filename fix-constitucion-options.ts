import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Parsear formato especial de opciones que usa % en lugar de :
 * Ejemplo: '{%100%El Rey,"%-33.33333%El Presidente del Gobierno"}'
 */
function parseSpecialOptionsFormat(optionsString: string): string[] {
  try {
    console.log('🔧 Parseando formato especial:', optionsString.substring(0, 100) + '...');
    
    // Remover llaves externas
    let cleaned = optionsString.replace(/^{|}$/g, '');
    
    // Dividir por comas que están fuera de comillas
    const options: string[] = [];
    let current = '';
    let inQuotes = false;
    let escapeNext = false;
    
    for (let i = 0; i < cleaned.length; i++) {
      const char = cleaned[i];
      
      if (escapeNext) {
        current += char;
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        current += char;
        continue;
      }
      
      if (char === '"') {
        inQuotes = !inQuotes;
        // No incluir las comillas en el resultado final
        continue;
      }
      
      if (char === ',' && !inQuotes) {
        if (current.trim()) {
          options.push(current.trim());
        }
        current = '';
        continue;
      }
      
      current += char;
    }
    
    if (current.trim()) {
      options.push(current.trim());
    }
    
    // Limpiar cada opción removiendo el formato de porcentaje
    const cleanedOptions = options.map(option => {
      // Remover patrón %numero% del inicio
      let cleaned = option.replace(/^%[^%]*%/, '');
      // Remover patrón %-numero% del inicio
      cleaned = cleaned.replace(/^%-[^%]*%/, '');
      return cleaned.trim();
    }).filter(option => option.length > 0);
    
    console.log(`✅ Opciones parseadas: ${cleanedOptions.length}`);
    cleanedOptions.forEach((opt, i) => {
      console.log(`   ${i + 1}. "${opt}"`);
    });
    
    return cleanedOptions;
  } catch (error) {
    console.error('❌ Error parseando opciones:', error.message);
    return [];
  }
}

async function fixConstitucionOptions() {
  console.log('🔧 CORRIGIENDO FORMATO DE OPCIONES EN TABLA CONSTITUCION');
  console.log('=' .repeat(70));
  
  try {
    // Obtener todas las preguntas con opciones en formato string
    const questionsWithStringOptions = await prisma.constitucion.findMany({
      where: {
        AND: [
          { options: { not: null } },
          // Buscar preguntas donde options es un string que empieza con {
          {
            OR: [
              { options: { startsWith: '{' } },
              { options: { contains: '%' } }
            ]
          }
        ]
      },
      orderBy: {
        questionnumber: 'asc'
      }
    });
    
    console.log(`\n📊 Preguntas encontradas con formato problemático: ${questionsWithStringOptions.length}`);
    
    if (questionsWithStringOptions.length === 0) {
      console.log('✅ No se encontraron preguntas con formato problemático');
      return;
    }
    
    let corrected = 0;
    let errors = 0;
    
    for (const question of questionsWithStringOptions) {
      console.log(`\n🔍 Procesando pregunta ${question.questionnumber} (ID: ${question.id})`);
      console.log(`   Opciones actuales: ${typeof question.options} - ${question.options}`);
      
      if (typeof question.options === 'string') {
        const parsedOptions = parseSpecialOptionsFormat(question.options);
        
        if (parsedOptions.length >= 2) {
          try {
            // Convertir el array parseado a JSON string válido
            const optionsJsonString = JSON.stringify(parsedOptions);
            
            // Actualizar la pregunta con las opciones parseadas
            await prisma.constitucion.update({
              where: { id: question.id },
              data: {
                options: optionsJsonString
              }
            });
            
            console.log(`✅ Pregunta ${question.questionnumber} corregida: ${parsedOptions.length} opciones`);
            corrected++;
          } catch (updateError) {
            console.log(`❌ Error actualizando pregunta ${question.questionnumber}: ${updateError.message}`);
            errors++;
          }
        } else {
          console.log(`⚠️ Pregunta ${question.questionnumber} tiene menos de 2 opciones válidas, saltando`);
          errors++;
        }
      } else {
        console.log(`⚠️ Pregunta ${question.questionnumber} ya tiene opciones en formato correcto`);
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('📊 RESUMEN DE CORRECCIÓN:');
    console.log(`   ✅ Preguntas corregidas: ${corrected}`);
    console.log(`   ❌ Errores: ${errors}`);
    console.log(`   📋 Total procesadas: ${questionsWithStringOptions.length}`);
    
    // Verificar algunas preguntas corregidas
    if (corrected > 0) {
      console.log('\n🔍 Verificando preguntas corregidas...');
      const verificationSample = await prisma.constitucion.findMany({
        where: {
          id: {
            in: questionsWithStringOptions.slice(0, 3).map(q => q.id)
          }
        }
      });
      
      verificationSample.forEach(q => {
        console.log(`\n   Pregunta ${q.questionnumber}:`);
        console.log(`     Tipo opciones: ${typeof q.options}`);
        console.log(`     Es array: ${Array.isArray(q.options)}`);
        if (Array.isArray(q.options)) {
          console.log(`     Número de opciones: ${q.options.length}`);
          q.options.forEach((opt, i) => {
            console.log(`       ${i + 1}. "${opt}"`);
          });
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ CORRECCIÓN COMPLETADA');
  console.log('=' .repeat(70));
}

// Función para hacer un análisis previo sin modificar datos
async function analyzeConstitucionOptions() {
  console.log('🔍 ANÁLISIS DE OPCIONES EN TABLA CONSTITUCION');
  console.log('=' .repeat(60));
  
  try {
    // Contar preguntas por tipo de opciones
    const totalQuestions = await prisma.constitucion.count();
    
    // Preguntas con opciones null
    const nullOptions = await prisma.constitucion.count({
      where: { options: null }
    });
    
    // Preguntas con opciones que parecen ser strings problemáticos
    const stringOptions = await prisma.constitucion.count({
      where: {
        AND: [
          { options: { not: null } },
          {
            OR: [
              { options: { startsWith: '{' } },
              { options: { contains: '%' } }
            ]
          }
        ]
      }
    });
    
    console.log(`\n📊 ESTADÍSTICAS:`);
    console.log(`   Total preguntas: ${totalQuestions}`);
    console.log(`   Opciones null: ${nullOptions}`);
    console.log(`   Opciones con formato problemático: ${stringOptions}`);
    console.log(`   Opciones aparentemente correctas: ${totalQuestions - nullOptions - stringOptions}`);
    
    // Mostrar ejemplos de formatos problemáticos
    const examples = await prisma.constitucion.findMany({
      where: {
        AND: [
          { options: { not: null } },
          {
            OR: [
              { options: { startsWith: '{' } },
              { options: { contains: '%' } }
            ]
          }
        ]
      },
      take: 5
    });
    
    console.log(`\n📋 EJEMPLOS DE FORMATOS PROBLEMÁTICOS:`);
    examples.forEach((q, i) => {
      console.log(`\n   ${i + 1}. Pregunta ${q.questionnumber}:`);
      console.log(`      Opciones: ${q.options}`);
      
      // Intentar parsear para mostrar resultado
      if (typeof q.options === 'string') {
        const parsed = parseSpecialOptionsFormat(q.options);
        console.log(`      Resultado parseado: ${parsed.length} opciones`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error en análisis:', error.message);
  }
}

// Ejecutar análisis y corrección
async function main() {
  console.log('🚀 INICIANDO DIAGNÓSTICO Y CORRECCIÓN DE OPCIONES');
  console.log('=' .repeat(70));
  
  // Primero hacer análisis
  await analyzeConstitucionOptions();
  
  console.log('\n' + '='.repeat(70));
  console.log('¿Proceder con la corrección? (Esto modificará la base de datos)');
  console.log('Ejecutando corrección automáticamente...');
  console.log('=' .repeat(70));
  
  // Luego hacer corrección
  await fixConstitucionOptions();
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());