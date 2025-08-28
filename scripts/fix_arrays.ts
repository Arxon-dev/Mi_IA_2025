import * as fs from 'fs';
import * as readline from 'readline';

async function fixAndFilterData() {
  const inputFile = process.argv[2];
  const outputFile = process.argv[3];

  if (!inputFile || !outputFile) {
    console.error("Uso: npx ts-node scripts/fix_arrays.ts <inputFile> <outputFile>");
    process.exit(1);
  }

  // Force UTF-8 for both reading and writing
  const fileStream = fs.createReadStream(inputFile, { encoding: 'utf8' });
  const writer = fs.createWriteStream(outputFile, { encoding: 'utf8' });

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  // Regex para encontrar arrays con formato JSON dentro de comillas simples: '[\"item1\",\"item2\"]'
  const jsonArrayInStringRegex = /'(\\[".*?\\])'/g;

  for await (const line of rl) {
    // La lógica de filtrado ahora se hace antes de llamar a este script
    const correctedLine = line.replace(jsonArrayInStringRegex, (match, jsonArrayString) => {
      try {
        const unescapedString = jsonArrayString.replace(/\\"/g, '"');
        const array = JSON.parse(unescapedString);
        
        // Formatear para PostgreSQL: ARRAY['item1','item2']
        // Escapa comillas simples dentro de los elementos del array
        const postgresArray = `ARRAY[${array.map((item: string) => `'${item.replace(/'/g, "''")}'`).join(',')}]`;
        return postgresArray;
      } catch (error) {
        // Si hay un error de parseo, simplemente devuelve la cadena original para no romper la importación
        console.error(`Error parsing JSON from line, returning original. Line: ${line}`);
        return match;
      }
    });

    // Escribir la línea procesada en el archivo de salida
    writer.write(correctedLine + '\n');
  }

  writer.end();
  // console.log(`¡Archivo de datos de BloomLevel final y filtrado creado en: ${outputFile}`);
}

fixAndFilterData().catch(console.error); 