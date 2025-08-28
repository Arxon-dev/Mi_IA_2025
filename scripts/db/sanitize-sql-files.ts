import fs from 'fs';
import path from 'path';

const sourceDir = path.resolve(process.cwd(), 'scripts', 'data');
const targetDir = path.resolve(process.cwd(), 'scripts', 'data_sanitized');

const filesToSanitize = [
  'Datos_BD_FINAL_01.sql',
  'Datos_BD_FINAL_02.sql',
  'Datos_BD_FINAL_03.sql',
];

function sanitizeFile(sourcePath: string, targetPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`Sanitizing and Rebuilding ${path.basename(sourcePath)}...`);

    const fileContent = fs.readFileSync(sourcePath, 'latin1');
    
    // 1. Basic cleanup of weird characters
    const basicCleaned = fileContent.replace(/[^\x20-\x7E\n\r\t]/g, '');

    // 2. Convert to single line and then split by statement terminator
    const singleLineSql = basicCleaned.replace(/[\r\n]+/g, ' ').trim();
    const potentialStatements = singleLineSql.split(';');

    // 3. Filter for valid, complete statements
    const validStatements = potentialStatements.filter(stmt => {
      const trimmed = stmt.trim();
      if (trimmed === '') return false;
      const upperTrimmed = trimmed.toUpperCase();
      return upperTrimmed.startsWith('INSERT INTO') || upperTrimmed.startsWith('BEGIN') || upperTrimmed.startsWith('COMMIT') || upperTrimmed.startsWith('SELECT PG_CATALOG.SETVAL');
    });

    // 4. Re-join the valid statements
    let reconstructedSql = validStatements.join(';\n') + ';';

    // 5. Final, robust transformation: Convert JSON-like arrays to PostgreSQL array literals
    reconstructedSql = reconstructedSql.replace(/'(\[.*?\])'/g, (match, jsonString) => {
        try {
            const arr = JSON.parse(jsonString);
            if (Array.isArray(arr)) {
                const items = arr.map((item: any) => {
                    const strItem = String(item).replace(/'/g, "''");
                    return `'${strItem}'`;
                });
                return `ARRAY[${items.join(',')}]`;
            }
        } catch (e) {
            // Not valid JSON, return original match
        }
        return match;
    });

    // 6. Write the rebuilt file
    fs.writeFile(targetPath, reconstructedSql, 'utf8', (err) => {
      if (err) {
        console.error(`Error rebuilding ${path.basename(sourcePath)}:`, err);
        return reject(err);
      }
      console.log(`Successfully rebuilt ${path.basename(sourcePath)} -> ${path.basename(targetPath)}`);
      resolve();
    });
  });
}

async function main() {
  try {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
      console.log(`Created directory: ${targetDir}`);
    }

    for (const fileName of filesToSanitize) {
      const sourcePath = path.join(sourceDir, fileName);
      const targetPath = path.join(targetDir, fileName.replace('.sql', '_sane.sql'));
      await sanitizeFile(sourcePath, targetPath);
    }

    console.log('\nAll files have been rebuilt successfully.');
  } catch (error) {
    console.error('\nAn error occurred during the rebuilding process.', error);
    process.exit(1);
  }
}

main(); 