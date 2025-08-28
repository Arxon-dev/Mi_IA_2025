import fs from 'fs';
import path from 'path';

async function testArticulosRegex() {
  console.log('🧪 PRUEBA SIMPLE DE REGEX PARA ARTÍCULOS - CONSTITUCIÓN ESPAÑOLA');
  console.log('=' .repeat(80));
  
  try {
    // 1. CARGAR EL DOCUMENTO DE LA CONSTITUCIÓN
    const documentPath = 'f:/Permanencia/Perma2024/OPOMELILLA/TEMARIO TXT/B1/ORG_TEMA1_LA CONTITUCIÓN ESPAÑOLA 1978 (Títulos III, IV, V, VI Y VIII)_Copy.txt';
    
    if (!fs.existsSync(documentPath)) {
      console.log('❌ No se encontró el archivo del documento');
      console.log(`   Ruta buscada: ${documentPath}`);
      return;
    }
    
    const content = fs.readFileSync(documentPath, 'utf-8');
    console.log(`✅ Documento cargado: ${content.length} caracteres`);
    
    // 2. MOSTRAR MUESTRA DEL CONTENIDO
    console.log('\n📄 MUESTRA DEL CONTENIDO (primeros 1000 chars):');
    console.log('-' .repeat(50));
    console.log(content.substring(0, 1000));
    console.log('-' .repeat(50));
    
    // 3. PROBAR DIFERENTES PATRONES REGEX
    console.log('\n🔍 PROBANDO DIFERENTES PATRONES REGEX:');
    
    const patterns = [
      {
        name: 'Patrón actual del sistema',
        regex: /(?:Artículo|ART[IÍ]CULO)\s*\d+[.:]?/gmi,
        description: 'Detecta "Artículo" o "ARTÍCULO" seguido de número'
      },
      {
        name: 'Patrón más flexible',
        regex: /Artículo\s*\d+/gi,
        description: 'Solo "Artículo" seguido de número (case insensitive)'
      },
      {
        name: 'Patrón con punto opcional',
        regex: /Artículo\s*\d+\.?/gi,
        description: 'Artículo + número + punto opcional'
      },
      {
        name: 'Patrón muy flexible',
        regex: /Art[íi]culo\s*\d+/gi,
        description: 'Artículo con í o i + número'
      }
    ];
    
    patterns.forEach((pattern, index) => {
      console.log(`\n${index + 1}. ${pattern.name}:`);
      console.log(`   Regex: ${pattern.regex}`);
      console.log(`   Descripción: ${pattern.description}`);
      
      const matches = content.match(pattern.regex);
      console.log(`   Coincidencias encontradas: ${matches?.length || 0}`);
      
      if (matches && matches.length > 0) {
        console.log('   Primeras 10 coincidencias:');
        matches.slice(0, 10).forEach((match, idx) => {
          console.log(`     ${idx + 1}. "${match}"`);
        });
      }
    });
    
    // 4. ANÁLISIS DETALLADO DEL MEJOR PATRÓN
    const bestPattern = /Artículo\s*\d+/gi;
    console.log('\n🎯 ANÁLISIS DETALLADO CON EL MEJOR PATRÓN:');
    console.log(`   Patrón seleccionado: ${bestPattern}`);
    
    const allMatches = [];
    let match;
    bestPattern.lastIndex = 0; // Reset regex
    
    while ((match = bestPattern.exec(content)) !== null) {
      allMatches.push({
        text: match[0],
        index: match.index,
        context: content.substring(Math.max(0, match.index - 50), match.index + match[0].length + 100)
      });
    }
    
    console.log(`   Total de artículos encontrados: ${allMatches.length}`);
    
    if (allMatches.length > 0) {
      console.log('\n📋 PRIMEROS 5 ARTÍCULOS CON CONTEXTO:');
      allMatches.slice(0, 5).forEach((match, idx) => {
        console.log(`\n   ${idx + 1}. "${match.text}" (posición: ${match.index})`);
        console.log(`      Contexto: ...${match.context.replace(/\n/g, ' ')}...`);
      });
      
      // Verificar secuencia numérica
      console.log('\n🔢 VERIFICACIÓN DE SECUENCIA NUMÉRICA:');
      const numbers = allMatches.map(m => {
        const numMatch = m.text.match(/\d+/);
        return numMatch ? parseInt(numMatch[0]) : 0;
      }).sort((a, b) => a - b);
      
      console.log(`   Números de artículos: ${numbers.slice(0, 20).join(', ')}${numbers.length > 20 ? '...' : ''}`);
      console.log(`   Rango: ${Math.min(...numbers)} - ${Math.max(...numbers)}`);
      console.log(`   ¿Secuencia continua?: ${isSequential(numbers) ? '✅ SÍ' : '❌ NO (puede tener saltos)'}`);
    }
    
    // 5. SIMULACIÓN DE PROCESAMIENTO POR SECCIONES
    if (allMatches.length > 0) {
      console.log('\n📚 SIMULACIÓN DE PROCESAMIENTO POR SECCIONES:');
      
      const sections = [];
      for (let i = 0; i < allMatches.length; i++) {
        const currentMatch = allMatches[i];
        const nextMatch = allMatches[i + 1];
        
        const startIndex = currentMatch.index;
        const endIndex = nextMatch ? nextMatch.index : content.length;
        const sectionContent = content.substring(startIndex, endIndex);
        
        sections.push({
          title: currentMatch.text.trim(),
          content: sectionContent,
          length: sectionContent.length,
          startIndex,
          endIndex
        });
      }
      
      console.log(`   Secciones creadas: ${sections.length}`);
      console.log('   Estadísticas de longitud:');
      const lengths = sections.map(s => s.length);
      console.log(`     Promedio: ${Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length)} chars`);
      console.log(`     Mínima: ${Math.min(...lengths)} chars`);
      console.log(`     Máxima: ${Math.max(...lengths)} chars`);
      
      console.log('\n   Primeras 3 secciones:');
      sections.slice(0, 3).forEach((section, idx) => {
        console.log(`     ${idx + 1}. "${section.title}" (${section.length} chars)`);
        console.log(`        Inicio: "${section.content.substring(0, 100).replace(/\n/g, ' ')}..."`);
      });
    }
    
  } catch (error) {
    console.error('\n❌ ERROR DURANTE LA PRUEBA:', error);
  }
}

function isSequential(numbers: number[]): boolean {
  for (let i = 1; i < numbers.length; i++) {
    if (numbers[i] !== numbers[i-1] + 1) {
      return false;
    }
  }
  return true;
}

// Ejecutar la prueba
testArticulosRegex().catch(console.error); 