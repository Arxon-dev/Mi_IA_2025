import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

function getValues(sql: string): any[] | null {
    // Remove line breaks and normalize the SQL for easier parsing
    const normalizedSql = sql.replace(/\s+/g, ' ').trim();
    const valuesMatch = normalizedSql.match(/VALUES \((.+)\)$/);
    if (!valuesMatch) return null;

    let valuesString = valuesMatch[1];
    const values: any[] = [];
    let current_value = '';
    let in_string = false;
    let bracket_level = 0;
    
    for (let i = 0; i < valuesString.length; i++) {
        const char = valuesString[i];
        
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
        } else if (char === ',' && bracket_level === 0 && !in_string) {
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

async function main() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error('Usage: npx ts-node import-examen-oficial.ts <modelName> <filePath>');
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

        // Read the file content and split by lines
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const lines = fileContent.split('\n').filter(line => line.trim() !== '');
        
        console.log(`📄 Total lines in file: ${lines.length}`);
        
        let processedCount = 0;
        let skippedCount = 0;
        let lineNumber = 0;
        
        const dataToInsert: any[] = [];
        
        for (const line of lines) {
            lineNumber++;
            const trimmedLine = line.trim();
            
            // Skip empty lines and comments
            if (!trimmedLine || trimmedLine.startsWith('--') || trimmedLine.startsWith('/*')) {
                console.log(`⏭️  Skipping line ${lineNumber}: Comment or empty`);
                continue;
            }
            
            // Process INSERT statements
            if (trimmedLine.toUpperCase().includes('INSERT INTO')) {
                console.log(`🔍 Processing INSERT statement at line ${lineNumber}`);
                const values = getValues(trimmedLine);
                
                if (!values) {
                    console.log(`❌ Failed to parse INSERT statement at line ${lineNumber}: ${trimmedLine.substring(0, 100)}...`);
                    skippedCount++;
                    continue;
                }
                
                console.log(`✅ Successfully parsed ${values.length} values from line ${lineNumber}`);

                // Helper function to safely parse dates
                function parseDate(dateString: any): Date | null {
                    if (!dateString || dateString === 'NULL' || dateString === null) {
                        return null;
                    }
                    
                    try {
                        const date = new Date(dateString);
                        if (isNaN(date.getTime())) {
                            return null;
                        }
                        return date;
                    } catch (error) {
                        return null;
                    }
                }

                // Helper function to safely parse options
                function parseOptions(optionsString: any): string[] {
                    if (!optionsString || optionsString === 'NULL') {
                        return [];
                    }
                    
                    if (Array.isArray(optionsString)) {
                        return optionsString;
                    }
                    
                    if (typeof optionsString === 'string') {
                        try {
                            // Remove leading/trailing spaces and quotes
                            let cleanString = optionsString.trim();
                            if (cleanString.startsWith('"') && cleanString.endsWith('"')) {
                                cleanString = cleanString.slice(1, -1);
                            }
                            
                            // Parse as JSON array
                            const parsed = JSON.parse(cleanString);
                            if (Array.isArray(parsed)) {
                                return parsed;
                            }
                        } catch (error) {
                            console.warn(`Failed to parse options: ${optionsString}`);
                        }
                    }
                    
                    return [];
                }

                // Map the values according to ExamenOficial model structure
                const dataToCreate = {
                    id: values[0],
                    questionnumber: values[1],
                    question: values[2],
                    options: parseOptions(values[3]),
                    correctanswerindex: values[4],
                    category: values[5],
                    difficulty: values[6],
                    isactive: values[7],
                    sendCount: values[8],
                    lastsuccessfulsendat: parseDate(values[9]),
                    createdAt: parseDate(values[10]) || new Date(),
                    lastTournamentId: values[11] === 'NULL' ? null : values[11],
                    lastUsedInTournament: parseDate(values[12]),
                    tournamentUsageCount: values[13] || 0
                };

                dataToInsert.push(dataToCreate);
                processedCount++;
            }
        }

        if (dataToInsert.length > 0) {
            console.log(`Inserting ${dataToInsert.length} records into ${modelName}...`);
            
            // Insert in batches to avoid memory issues
            const batchSize = 50;
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
            console.log(`📊 Processed: ${processedCount}, Skipped: ${skippedCount}`);
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