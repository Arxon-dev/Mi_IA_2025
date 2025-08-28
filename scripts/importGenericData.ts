import { PrismaClient, Prisma } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Function to transform JSON-like arrays to PostgreSQL array literals
function fixSqlArrayLiterals(stmt: string): string {
  const optionsRegex = /'(\[.*?\])'/s;
  const match = stmt.match(optionsRegex);

  if (match && match[1]) {
    try {
      const optionsArray = JSON.parse(match[1]);
      if (Array.isArray(optionsArray)) {
        const pgArrayLiteral =
          '{' +
          optionsArray
            .map((item) => `"${String(item).replace(/"/g, '""')}"`)
            .join(',') +
          '}';
        return stmt.replace(match[0], `'${pgArrayLiteral}'`);
      }
    } catch (e) {
      // Ignore if it's not a valid JSON array string
    }
  }
  return stmt;
}

function escapeSingleQuotes(value: any): any {
    if (typeof value === 'string') {
        return value.replace(/'/g, "''");
    }
    return value;
}

function getTableNameFromInsert(sql: string): string | null {
    const match = sql.match(/INSERT INTO "([^"]+)"/i);
    return match ? match[1] : null;
}

function getColumnNames(sql: string): string[] | null {
    const match = sql.match(/INSERT INTO "[^"]+" \(([^)]+)\)/i);
    if (!match) return null;
    return match[1].split(',').map(name => name.trim().replace(/"/g, ''));
}

function parseAndFormatDate(value: string): string | null {
    if (!value || value === 'NULL') {
        return null;
    }
    // Remove quotes
    const dateString = value.replace(/'/g, '');
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        // Return original string if parsing fails, to see the problematic value
        return value;
    }
    return date.toISOString();
}

function getValues(sql: string): any[] | null {
    const valuesMatch = sql.match(/VALUES \((.+)\)/s);
    if (!valuesMatch) return null;

    const valuesString = valuesMatch[1];
    const values: any[] = [];
    let current_value = '';
    let in_string = false;
    let bracket_level = 0;
    
    for (let i = 0; i < valuesString.length; i++) {
        const char = valuesString[i];
        
        if (char === "'" && (i === 0 || valuesString[i-1] !== "'")) {
            in_string = !in_string;
        }

        if (!in_string) {
            if (char === '[') bracket_level++;
            else if (char === ']') bracket_level--;
        }

        if (char === ',' && !in_string && bracket_level === 0) {
            values.push(current_value.trim());
            current_value = '';
        } else {
            current_value += char;
        }
    }
    values.push(current_value.trim());

    return values.map(v => {
        const trimmedV = typeof v === 'string' ? v.trim() : v;

        if (typeof trimmedV === 'string' && trimmedV.startsWith("'") && trimmedV.endsWith("'")) {
             // It's a string literal
            const inner = trimmedV.slice(1, -1);
            if (inner.startsWith('[') && inner.endsWith(']')) {
                try {
                    return JSON.parse(inner); // It's a JSON array
                } catch (e) {
                    return inner.replace(/''/g, "'"); // Not valid JSON
                }
            }
             // Check if it looks like a date
            if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/.test(inner)) {
                return new Date(inner);
            }
            return inner.replace(/''/g, "'"); // Just a regular string
        }
        if (trimmedV === 'NULL') return null;
        if (trimmedV === 'TRUE') return true;
        if (trimmedV === 'FALSE') return false;
        if (!isNaN(Number(trimmedV))) return Number(trimmedV);
        return trimmedV;
    });
}

async function main() {
    const filePathArg = process.argv[2];
    if (!filePathArg) {
        console.error("Please provide a path to the SQL file.");
        process.exit(1);
    }
    const filePath = path.resolve(filePathArg);

    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
    }

    console.log(`Starting data import from ${filePath}...`);

    try {
        const sqlContent = fs.readFileSync(filePath, 'utf-8');
        const statements = sqlContent.split(/;\s*[\r\n]+/g).filter(s => s.trim().startsWith('INSERT'));

        if (statements.length === 0) {
            console.log('No INSERT statements found in the file.');
            return;
        }

        console.log(`Found ${statements.length} statements to execute.`);

        const tableData: { [key: string]: any[] } = {};

        for (const stmt of statements) {
            const tableName = getTableNameFromInsert(stmt);
            const columns = getColumnNames(stmt);
            const values = getValues(stmt);

            if (tableName && columns && values && columns.length === values.length) {
                if (!tableData[tableName]) {
                    tableData[tableName] = [];
                }
                const row = columns.reduce((acc, col, index) => {
                    let value = values[index];
                    // Specifically format date columns
                    if (['createdAt', 'updatedAt', 'lastsuccessfulsendat', 'lastUsedInTournament', 'scheduledDate', 'startTime', 'endTime', 'actualStartTime', 'actualEndTime', 'registeredAt', 'startedAt', 'completedAt', 'answeredAt', 'lastActivityAt', 'joinedAt', 'expiresAt', 'unlockedAt', 'deadline', 'claimedAt', 'generatedAt', 'timestamp', 'lastStudyAt', 'lastScheduledSendAt', 'timeoutAt'].includes(col)) {
                       if (value && value !== 'NULL') {
                           value = new Date(value);
                           if (isNaN(value.getTime())) {
                               value = null; // Set to null if date is invalid
                           }
                       } else {
                           value = null;
                       }
                    }
                    acc[col] = value;
                    return acc;
                }, {} as { [key: string]: any });
                tableData[tableName].push(row);
            }
        }
        
        const tableNames = Object.keys(tableData).filter(name => name !== '_prisma_migrations');
        console.log(`The following tables will be cleared and populated: ${tableNames.join(', ')}`);
        
        console.log('Deleting existing data from detected tables...');
        await prisma.$transaction(
             tableNames.map(tableName => prisma.$executeRawUnsafe(`DELETE FROM "${tableName}";`))
        );
        console.log('Existing data deleted.');

        for (const tableName of tableNames) {
            const data = tableData[tableName];
            const modelName = tableName.charAt(0).toLowerCase() + tableName.slice(1);

            // The type assertion is necessary here because Prisma's createMany doesn't have a generic type for all tables.
            await (prisma as any)[modelName].createMany({
                data,
                skipDuplicates: true,
            });
            console.log(`Inserted ${data.length} records into ${tableName}`);
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
main(); 