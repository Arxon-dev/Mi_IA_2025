import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function importData(modelName: string, filePath: string) {
    try {
        console.log(`Starting data import for ${modelName} from ${filePath}...`);

        // Validate model exists
        const modelNameCamel = modelName.charAt(0).toLowerCase() + modelName.slice(1);
        if (!(modelNameCamel in prisma)) {
            console.error(`Model '${modelName}' (as '${modelNameCamel}') not found in Prisma Client.`);
            process.exit(1);
        }
        
        const prismaModel = (prisma as any)[modelNameCamel];

        // Clear existing data
        console.log(`Clearing existing data from ${modelName}...`);
        await prismaModel.deleteMany({});
        console.log(`Cleared existing data from ${modelName}.`);

        // Read the file content
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        
        // Split by semicolon to get complete statements, then filter INSERT statements
        const statements = fileContent.split(';').filter(stmt => 
            stmt.trim().toUpperCase().includes('INSERT INTO')
        );
        
        console.log(`Found ${statements.length} INSERT statements.`);
        
        const dataToInsert: any[] = [];
        let processedCount = 0;
        let skippedCount = 0;

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i].trim();
            
            try {
                // Extract VALUES content using a more robust approach
                const valuesMatch = statement.match(/VALUES\s*\((.+)\)$/);
                if (!valuesMatch) {
                    console.log(`❌ Failed to extract VALUES from statement ${i + 1}`);
                    skippedCount++;
                    continue;
                }

                const valuesContent = valuesMatch[1];
                
                // Parse the values using a simple CSV-like approach
                const values = parseValues(valuesContent);
                
                if (!values || values.length === 0) {
                    console.log(`❌ Failed to parse values from statement ${i + 1}`);
                    skippedCount++;
                    continue;
                }

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
                            console.log(`Warning: Failed to parse options: ${optionsString}`);
                        }
                    }
                    
                    return [];
                }

                // Map the values according to ExamenOficial model structure
                const dataToCreate = {
                    id: values[0],
                    questionnumber: parseInt(values[1]),
                    question: values[2],
                    options: parseOptions(values[3]),
                    correctanswerindex: parseInt(values[4]),
                    category: values[5],
                    difficulty: values[6],
                    isactive: values[7] === 'TRUE' || values[7] === true,
                    sendCount: parseInt(values[8]) || 0,
                    lastsuccessfulsendat: parseDate(values[9]),
                    createdAt: parseDate(values[10]) || new Date(),
                    lastTournamentId: values[11] === 'NULL' ? null : values[11],
                    lastUsedInTournament: parseDate(values[12]),
                    tournamentUsageCount: parseInt(values[13]) || 0
                };

                dataToInsert.push(dataToCreate);
                processedCount++;
                
                if (processedCount % 10 === 0) {
                    console.log(`✅ Processed ${processedCount} statements...`);
                }
                
            } catch (error) {
                console.log(`❌ Error processing statement ${i + 1}: ${error}`);
                skippedCount++;
            }
        }

        console.log(`📊 Processed: ${processedCount}, Skipped: ${skippedCount}`);

        if (dataToInsert.length === 0) {
            console.log('No valid data found to import.');
            return;
        }

        // Insert data in batches
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
                console.log(`📥 Inserted batch: ${insertedCount}/${dataToInsert.length}`);
            } catch (error) {
                console.error(`❌ Error inserting batch starting at ${i}:`, error);
            }
        }

        console.log(`✅ Successfully imported ${insertedCount} records to ${modelName} table.`);
        
    } catch (error) {
        console.error(`❌ Error during import:`, error);
    } finally {
        await prisma.$disconnect();
    }
}

function parseValues(valuesString: string): any[] {
    const values: any[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    let bracketLevel = 0;
    
    for (let i = 0; i < valuesString.length; i++) {
        const char = valuesString[i];
        const nextChar = i + 1 < valuesString.length ? valuesString[i + 1] : '';
        
        if (!inQuotes) {
            if (char === '"' || char === "'") {
                inQuotes = true;
                quoteChar = char;
                continue;
            } else if (char === '[') {
                bracketLevel++;
                current += char;
            } else if (char === ']') {
                bracketLevel--;
                current += char;
            } else if (char === ',' && bracketLevel === 0) {
                // End of current value
                values.push(cleanValue(current.trim()));
                current = '';
            } else {
                current += char;
            }
        } else {
            if (char === quoteChar) {
                if (nextChar === quoteChar) {
                    // Escaped quote
                    current += char;
                    i++; // Skip next char
                } else {
                    // End of quoted string
                    inQuotes = false;
                    quoteChar = '';
                }
            } else {
                current += char;
            }
        }
    }
    
    // Add the last value
    if (current.trim()) {
        values.push(cleanValue(current.trim()));
    }
    
    return values;
}

function cleanValue(value: string): any {
    if (value === 'NULL') {
        return null;
    }
    
    if (value === 'TRUE') {
        return true;
    }
    
    if (value === 'FALSE') {
        return false;
    }
    
    // Remove surrounding quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
        return value.slice(1, -1);
    }
    
    return value;
}

// Main execution
const args = process.argv.slice(2);
if (args.length !== 2) {
    console.error('Usage: node script.js <ModelName> <FilePath>');
    process.exit(1);
}

const [modelName, filePath] = args;
importData(modelName, filePath); 