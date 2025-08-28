import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function reducirPreguntasRestantes() {
  console.log('✂️ REDUCIENDO PREGUNTAS RESTANTES EN EXAMEN 2024...\n');
  
  try {
    // IDs de las preguntas que aún son largas
    const preguntasLargas = [4, 11, 27, 33, 36, 40, 41, 55, 56, 57, 63, 65, 68, 77, 81, 87];
    
    console.log(`📋 Preguntas a procesar: ${preguntasLargas.length}\n`);
    
    let preguntasActualizadas = 0;
    
    for (const questionnumber of preguntasLargas) {
      const question = await (prisma as any).examenOficial2024.findUnique({
        where: { questionnumber }
      });
      
      if (!question) continue;
      
      let questionText = question.question;
      let needsUpdate = false;
      
      // Aplicar reducciones específicas adicionales
      const reducciones = [
        {
          original: 'La Ley de la carrera militar',
          reducida: 'L.C.M.'
        },
        {
          original: 'Ley de la carrera militar',
          reducida: 'L.C.M.'
        },
        {
          original: 'L.C.M. dispone en el',
          reducida: 'L.C.M.'
        },
        {
          original: 'regula las diferentes situaciones administrativas.',
          reducida: 'regula situaciones admin.'
        },
        {
          original: 'determina la clasificación de los destinos.',
          reducida: 'clasifica destinos.'
        },
        {
          original: 'de las competencias en materia de personal militar.',
          reducida: 'competencias personal militar.'
        },
        {
          original: 'con respecto al Profesorado en la estructura docente',
          reducida: 'sobre Profesorado docente'
        },
        {
          original: 'en relación a las faltas y sanciones.',
          reducida: 'sobre faltas/sanciones.'
        },
        {
          original: 'referido a la cancelación de las notas de las sanciones',
          reducida: 'cancelación notas sanciones'
        },
        {
          original: 'determina que la autoridad competente en el caso',
          reducida: 'autoridad competente para'
        },
        {
          original: 'estructura y funcionamiento del Observatorio',
          reducida: 'estructura Observatorio'
        },
        {
          original: 'se considera interesados en el procedimiento administrativo',
          reducida: 'son interesados procedimiento admin.'
        },
        {
          original: '¿Cuál(es) de las siguientes reglas regirá el funcionamiento',
          reducida: '¿Qué reglas rigen funcionamiento'
        },
        {
          original: 'El análisis prospectivo que define los futuros escenarios',
          reducida: 'Análisis que define escenarios futuros'
        },
        {
          original: 'El área definida por el nivel estratégico militar en la que',
          reducida: 'Área del nivel estratégico donde'
        },
        {
          original: 'La prioridad de España en el Magreb es promover',
          reducida: 'España prioriza en Magreb promover'
        },
        {
          original: 'Disuelto el Congreso o expirado su mandato, si se produjere',
          reducida: 'Si el Congreso es disuelto/expira y se produce'
        },
        {
          original: 'es el departamento de la Administración General del Estado',
          reducida: 'es departamento AGE'
        }
      ];
      
      // Aplicar cada reducción
      reducciones.forEach(({ original, reducida }) => {
        if (questionText.includes(original)) {
          questionText = questionText.replace(original, reducida);
          needsUpdate = true;
        }
      });
      
      // Si se realizaron cambios, actualizar en la BD
      if (needsUpdate) {
        // Calcular longitud antes y después
        const header = `🎯 SIMULACRO EXAMEN 2024 - Pregunta ${questionnumber}/100\n⏰ Tiempo restante: 2h 52m\n`;
        const lengthBefore = header.length + question.question.length;
        const lengthAfter = header.length + questionText.length;
        const saved = lengthBefore - lengthAfter;
        
        console.log(`📝 Pregunta ${questionnumber}:`);
        console.log(`   📏 Antes: ${lengthBefore} chars`);
        console.log(`   📏 Después: ${lengthAfter} chars`);
        console.log(`   ✂️ Reducido: ${saved} chars`);
        
        await (prisma as any).examenOficial2024.update({
          where: { questionnumber },
          data: { question: questionText }
        });
        
        preguntasActualizadas++;
      } else {
        const header = `🎯 SIMULACRO EXAMEN 2024 - Pregunta ${questionnumber}/100\n⏰ Tiempo restante: 2h 52m\n`;
        const totalLength = header.length + question.question.length;
        console.log(`📝 Pregunta ${questionnumber}: ${totalLength} chars (sin cambios)`);
      }
    }
    
    console.log(`\n🎉 REDUCCIÓN COMPLETADA:`);
    console.log(`✅ Preguntas actualizadas: ${preguntasActualizadas}`);
    console.log(`📄 Preguntas sin cambios: ${preguntasLargas.length - preguntasActualizadas}`);
    
    console.log('\n🧪 VERIFICACIÓN FINAL:');
    console.log('npx tsx scripts/identificar-titulos-largos-2024.ts');
    
  } catch (error) {
    console.error('❌ Error reduciendo preguntas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

reducirPreguntasRestantes(); 