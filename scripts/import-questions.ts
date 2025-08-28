import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';

const prisma = new PrismaClient();

// Zod schema for basic validation of question structure from SQL
const RawQuestionSchema = z.object({
  id: z.string().uuid(),
  question: z.string(),
  options: z.array(z.string()),
  correctanswerindex: z.number().int(),
  feedback: z.string().optional().nullable(),
  bloomLevel: z.string().optional().nullable(),
  documentId: z.string().optional().nullable(),
  sectionId: z.string().optional().nullable(),
});

// This function is a bit naive and might not handle all SQL edge cases,
// but it's adapted to handle the specific format of the provided .c files.
function getValues(sql: string): any[] | null {
    // Adjusted regex to properly match VALUES clause
    const valuesMatch = sql.match(/VALUES \((.+)\)$/s);
    if (!valuesMatch) return null;

    let valuesString = valuesMatch[1];
    const values: any[] = [];
    let current_value = '';
    let in_string = false;
    let bracket_level = 0; // For arrays like [...]
    let paren_level = 0; // For function calls or other constructs if needed
    
    for (let i = 0; i < valuesString.length; i++) {
        const char = valuesString[i];
        
        // Handle strings, escaping single quotes ''
        if (char === "'" && (i === 0 || valuesString[i - 1] !== '\\')) {
            if (in_string && i + 1 < valuesString.length && valuesString[i + 1] === "'") {
                // Escaped single quote within string
                current_value += "'";
                i++; // Skip the next quote
            } else {
                in_string = !in_string;
                if (!in_string) {
                    // End of string
                    values.push(current_value);
                    current_value = '';
                }
            }
        } else if (in_string) {
            current_value += char;
        } else if (char === '[') {
            bracket_level++;
            current_value += char;
        } else if (char === ']') {
            bracket_level--;
            current_value += char;
            if (bracket_level === 0) {
                // End of array
                try {
                    const parsed = JSON.parse(current_value);
                    values.push(parsed);
                } catch (e) {
                    values.push(current_value);
                }
                current_value = '';
            }
        } else if (char === '(' && !in_string) {
            paren_level++;
            current_value += char;
        } else if (char === ')' && !in_string) {
            paren_level--;
            current_value += char;
        } else if (char === ',' && bracket_level === 0 && paren_level === 0 && !in_string) {
            // End of value
            const trimmed = current_value.trim();
            if (trimmed === 'NULL' || trimmed === 'null') {
                values.push(null);
            } else if (trimmed === 'TRUE' || trimmed === 'true') {
                values.push(true);
            } else if (trimmed === 'FALSE' || trimmed === 'false') {
                values.push(false);
            } else if (!isNaN(Number(trimmed)) && trimmed !== '') {
                values.push(Number(trimmed));
            } else if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
                values.push(trimmed.slice(1, -1));
            } else if (trimmed !== '') {
                values.push(trimmed);
            }
            current_value = '';
        } else if (!in_string) {
            current_value += char;
        }
    }
    
    // Handle the last value
    if (current_value.trim() !== '') {
        const trimmed = current_value.trim();
        if (trimmed === 'NULL' || trimmed === 'null') {
            values.push(null);
        } else if (trimmed === 'TRUE' || trimmed === 'true') {
            values.push(true);
        } else if (trimmed === 'FALSE' || trimmed === 'false') {
            values.push(false);
        } else if (!isNaN(Number(trimmed)) && trimmed !== '') {
            values.push(Number(trimmed));
        } else if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
            values.push(trimmed.slice(1, -1));
        } else {
            values.push(trimmed);
        }
    }
    
    return values;
}


function getColumnNames(sql: string): string[] | null {
    const match = sql.match(/INSERT INTO "[^"]+" \(([^)]+)\)/i);
    if (!match) return null;
    return match[1].split(',').map(name => name.trim().replace(/"/g, ''));
}

async function main() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error('Usage: npx ts-node import-questions.ts <modelName> <filePath>');
        process.exit(1);
    }

    const modelName = args[0];
    const filePath = args[1];

    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
    }

    const modelNameCamel = modelName.charAt(0).toLowerCase() + modelName.slice(1);
    if (!(modelNameCamel in prisma)) {
        console.error(`Model '${modelName}' (as '${modelNameCamel}') not found in Prisma Client.`);
        process.exit(1);
    }
    
    const prismaModel = (prisma as any)[modelNameCamel];

    console.log(`Starting data import for ${modelName} from ${filePath}...`);

    try {
        // Clear existing data
        console.log(`Clearing existing data from ${modelName}...`);
        await prismaModel.deleteMany({});
        console.log(`Cleared existing data from ${modelName}.`);

        // Read and parse the SQL file
        const sqlContent = fs.readFileSync(filePath, 'utf-8');
        const insertStatements = sqlContent.match(/INSERT INTO[^;]+;/g) || [];
        
        console.log(`Found ${insertStatements.length} INSERT statements.`);

        const dataToInsert: any[] = [];

        for (const statement of insertStatements) {
            try {
                const values = getValues(statement);
                if (!values || values.length === 0) {
                    console.warn('Failed to parse values from statement:', statement.substring(0, 100) + '...');
                    continue;
                }

                // Map the values to the correct structure based on the model
                let dataToCreate: any = {};

                if (modelName === 'ExamenOficial2018' || modelName === 'ExamenOficial2024') {
                    // Special handling for ExamenOficial models
                    const rawData = {
                        id: values[0],
                        questionnumber: values[1],
                        question: values[2],
                        options: values[3],
                        correctanswerindex: values[4],
                        category: values[5],
                        difficulty: values[6],
                        isactive: values[7],
                        sendCount: values[8],
                        lastsuccessfulsendat: values[9] ? new Date(values[9]) : null,
                        createdAt: values[10] ? new Date(values[10]) : new Date(),
                        lastTournamentId: values[11] || null,
                        lastUsedInTournament: values[12] ? new Date(values[12]) : null,
                        tournamentUsageCount: values[13] || 0
                    };

                    dataToCreate = {
                        id: rawData.id,
                        questionnumber: rawData.questionnumber,
                        question: rawData.question,
                        options: rawData.options,
                        correctanswerindex: rawData.correctanswerindex,
                        category: rawData.category,
                        difficulty: rawData.difficulty,
                        isactive: rawData.isactive,
                        sendCount: rawData.sendCount,
                        lastsuccessfulsendat: rawData.lastsuccessfulsendat,
                        createdAt: rawData.createdAt,
                        lastTournamentId: rawData.lastTournamentId,
                        lastUsedInTournament: rawData.lastUsedInTournament,
                        tournamentUsageCount: rawData.tournamentUsageCount
                    };
                } else {
                    // Default handling for other models (like Aire, Constitucion, etc.)
                    const rawData = {
                        id: values[0],
                        questionnumber: values[1],
                        question: values[2],
                        options: values[3],
                        correctanswerindex: values[4],
                        category: values[5],
                        difficulty: values[6],
                        isactive: values[7],
                        sendCount: values[8],
                        lastsuccessfulsendat: values[9] ? new Date(values[9]) : null,
                        feedback: values[10],
                        type: values[11],
                        bloomLevel: values[12],
                        title: values[13],
                        titleQuestionNumber: values[14],
                        titleSourceDocument: values[15],
                        titleSourceReference: values[16],
                        titleRawMetadata: values[17],
                        sectionId: values[18],
                        documentId: values[19],
                        sourceSection: values[20],
                        lastUsedInTournament: values[21] ? new Date(values[21]) : null,
                        tournamentUsageCount: values[22] || 0,
                        lastTournamentId: values[23] || null
                    };

                    dataToCreate = {
                        id: rawData.id,
                        questionnumber: rawData.questionnumber,
                        question: rawData.question,
                        options: rawData.options,
                        correctanswerindex: rawData.correctanswerindex,
                        category: rawData.category,
                        difficulty: rawData.difficulty,
                        isactive: rawData.isactive,
                        sendCount: rawData.sendCount,
                        lastsuccessfulsendat: rawData.lastsuccessfulsendat,
                        feedback: rawData.feedback,
                        type: rawData.type,
                        bloomLevel: rawData.bloomLevel,
                        title: rawData.title,
                        titleQuestionNumber: rawData.titleQuestionNumber,
                        titleSourceDocument: rawData.titleSourceDocument,
                        titleSourceReference: rawData.titleSourceReference,
                        titleRawMetadata: rawData.titleRawMetadata,
                        sectionId: rawData.sectionId,
                        documentId: rawData.documentId,
                        sourceSection: rawData.sourceSection,
                        lastUsedInTournament: rawData.lastUsedInTournament,
                        tournamentUsageCount: rawData.tournamentUsageCount,
                        lastTournamentId: rawData.lastTournamentId
                    };
                }

                dataToInsert.push(dataToCreate);
            } catch (error) {
                console.warn(`Failed to parse statement: ${statement.substring(0, 100)}...`);
                console.warn(`Error: ${error}`);
            }
        }

        if (dataToInsert.length > 0) {
            console.log(`Inserting ${dataToInsert.length} records into ${modelName}...`);
            
            // Insert in batches to avoid memory issues
            const batchSize = 100;
            let insertedCount = 0;
            
            for (let i = 0; i < dataToInsert.length; i += batchSize) {
                const batch = dataToInsert.slice(i, i + batchSize);
                try {
                    await prismaModel.createMany({
                        data: batch,
                        skipDuplicates: true
                    });
                    insertedCount += batch.length;
                    console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(dataToInsert.length / batchSize)} (${insertedCount}/${dataToInsert.length} records)`);
                } catch (error) {
                    console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error);
                }
            }
            
            console.log(`✅ Successfully imported ${insertedCount} questions to ${modelName} table.`);
        } else {
            console.log('No valid data found to import.');
        }

    } catch (error) {
        console.error('Error during import:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
}); 