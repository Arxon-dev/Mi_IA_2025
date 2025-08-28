import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function fixSqlStatement(stmt: string): string {
  const optionsRegex = /'(\[.*?\])'/s;
  const match = stmt.match(optionsRegex);

  if (match && match[1]) {
    const jsonArrayString = match[1];
    try {
      const optionsArray = JSON.parse(jsonArrayString);
      if (Array.isArray(optionsArray)) {
        const pgArrayLiteral =
          '{' +
          optionsArray
            .map((item) => `"${String(item).replace(/"/g, '""')}"`)
            .join(',') +
          '}';
        return stmt.replace(`'${jsonArrayString}'`, `'${pgArrayLiteral}'`);
      }
    } catch (e) {
      console.warn(`Could not parse JSON array, using original statement. Error: ${e}`);
      return stmt;
    }
  }
  return stmt;
}

async function main() {
  console.log('Starting data import for Aire table...');

  try {
    const filePath = path.join(__dirname, 'data', 'Aire.c');
    const sqlContent = fs.readFileSync(filePath, 'utf-8');

    const statements = sqlContent
      .split(/;\s*[\r\n]+/g)
      .filter((s) => s.trim().startsWith('INSERT'));

    if (statements.length === 0) {
      console.log('No INSERT statements found in the file.');
      return;
    }

    console.log(`Found ${statements.length} statements to execute.`);

    console.log('Deleting existing data from Aire table...');
    await prisma.aire.deleteMany({});
    console.log('Existing data deleted.');

    const batchSize = 100;
    for (let i = 0; i < statements.length; i += batchSize) {
      const batch = statements.slice(i, i + batchSize);

      const transactionPromises = batch
        .filter((stmt) => stmt.trim())
        .map((stmt) => {
            const fixedStmt = fixSqlStatement(stmt);
            return prisma.$executeRawUnsafe(fixedStmt + ';');
        });

      if (transactionPromises.length > 0) {
        await prisma.$transaction(transactionPromises);
      }

      console.log(
        `Executed batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(
          statements.length / batchSize
        )}`
      );
    }

    console.log('Data import completed successfully!');
  } catch (error) {
    console.error('An error occurred during data import:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 