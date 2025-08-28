import 'dotenv/config';
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

// This script will connect directly to the database and run the import.
// It bypasses psql and shell command issues.

async function executeSqlFile(client: Client, filePath: string) {
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`Executing ${path.basename(filePath)}...`);
    await client.query(sql);
    console.log(`${path.basename(filePath)} executed successfully.`);
}

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('Connected to the database.');

        // 1. Truncate tables first
        const truncateScriptPath = path.resolve(process.cwd(), 'scripts', 'db', 'truncate_tables.sql');
        await executeSqlFile(client, truncateScriptPath);

        // 2. Process data files
        const dataDir = path.resolve(process.cwd(), 'scripts', 'data');
        const filesToImport = [
            'Datos_BD_FINAL_01.sql',
            'Datos_BD_FINAL_02.sql',
            'Datos_BD_FINAL_03.sql',
        ];

        for (const fileName of filesToImport) {
            console.log(`\nProcessing ${fileName}...`);
            const filePath = path.join(dataDir, fileName);
            let content = fs.readFileSync(filePath, 'latin1');
            
            // Clean non-printable characters
            content = content.replace(/[^\x20-\x7E\n\r\t]/g, '');
            
            // Use regex to find all INSERT statements, handling multi-line values
            const insertRegex = /INSERT INTO ([\s\S]*?) VALUES ([\s\S]*?);/g;
            
            let match;
            let successCount = 0;
            let errorCount = 0;
            const MAX_ERRORS_TO_LOG = 5;

            while ((match = insertRegex.exec(content)) !== null) {
                if (errorCount >= MAX_ERRORS_TO_LOG) {
                    console.log(`\nReached maximum error limit (${MAX_ERRORS_TO_LOG}). Stopping processing of this file.`);
                    break;
                }

                const tableInfo = match[1].trim();
                let values = match[2].trim();
                let query = ''; // define query here to be accessible in catch block

                try {
                    // Fix array format: '["a","b"]' -> ARRAY['a','b']
                    values = values.replace(/'(\[.*?\])'/g, (_m, jsonString) => {
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
                            // Not valid JSON, return original
                        }
                        return _m;
                    });

                    query = `INSERT INTO ${tableInfo} VALUES ${values};`;
                    await client.query(query);
                    successCount++;
                } catch (error: any) {
                    if (errorCount < MAX_ERRORS_TO_LOG) {
                        console.error(`\n--- ERROR ${errorCount + 1} ---`);
                        console.error(`DATABASE ERROR:`, error.message);
                        console.error('FAILED QUERY:', query);
                        console.error('------------------');
                    }
                    errorCount++;
                }
            }
            console.log(`Finished processing ${fileName}. Success: ${successCount}, Errors: ${errorCount}`);
        }

        console.log('\nImport process completed.');

    } catch (error: any) {
        console.error('A critical error occurred:', error.message);
    } finally {
        await client.end();
        console.log('Database connection closed.');
    }
}

main(); 