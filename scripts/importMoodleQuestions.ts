import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { parseGiftQuestions, QuestionData } from '../src/utils/moodleGiftParser'; // Adjust the path if necessary

const prisma = new PrismaClient();
const LOG_FILE = path.join(__dirname, 'import-errors.log'); // Log file in the same directory as the script
const BATCH_SIZE = 50; // Number of questions to insert per batch
const PROVIDED_DOCUMENT_ID = '0be7b8b8-c512-48b7-88f6-1eb3c79570b8'; // User-provided Document ID

/**
 * Logs an error message to a file.
 * @param message The error message or description.
 * @param details Optional details related to the error (e.g., question data, error object).
 */
function logError(message: string, details?: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    let detailsString = '';
    if (details) {
        try {
            // Limit details to prevent massive log files if question content is huge
            const simplifiedDetails = {
                ...details,
                rawGiftContent: details.rawGiftContent ? details.rawGiftContent.substring(0, 500) + '...' : details.rawGiftContent,
                // Safely access error message and stack, checking if error is an Error instance
                error: details.error instanceof Error ? details.error.message : String(details.error), // Use message if Error, otherwise stringify
                stack: details.error instanceof Error ? details.error.stack : undefined // Use stack if Error
            };
            detailsString = JSON.stringify(simplifiedDetails, null, 2) + '\n';
        } catch (e: unknown) { // Explicitly type as unknown
            // Safely access error message
            const errorMessage = e instanceof Error ? e.message : String(e);
            detailsString = `Failed to stringify error details: ${errorMessage}\n` + String(details) + '\n'; // Fallback logging
        }
    }
    fs.appendFileSync(LOG_FILE, logEntry + detailsString + '---\n');
}

async function importQuestions(filePath: string) {
  // Clear previous log file
  if (fs.existsSync(LOG_FILE)) {
    fs.unlinkSync(LOG_FILE);
  }
  console.log(`Error logs will be saved to: ${LOG_FILE}`);
  console.log(`All questions will be assigned documentId: ${PROVIDED_DOCUMENT_ID}`);


  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found at ${filePath}`);
    logError(`File not found`, { filePath, error: 'File not found' }); // Log a simple error message
    process.exit(1);
  }

  console.log(`Reading file: ${filePath}`);
  let giftContent: string;
  try {
      giftContent = fs.readFileSync(filePath, 'utf-8');
  } catch (error: unknown) { // Explicitly type as unknown
      console.error(`Error reading file ${filePath}:`, error);
      logError(`Error reading file`, { filePath, error: error instanceof Error ? error : String(error) }); // Pass Error object or its string representation
      process.exit(1);
  }


  console.log('Parsing GIFT content...');
  let questions: QuestionData[] = [];
  try {
    questions = parseGiftQuestions(giftContent);
    console.log(`Successfully parsed ${questions.length} potential question blocks.`);
  } catch (error: unknown) { // Explicitly type as unknown
    console.error('Critical Error during parsing:', error);
    logError('Critical Error during parsing', { error: error instanceof Error ? error : String(error) }); // Pass Error object or its string representation
    process.exit(1); // Exit on critical parsing errors
  }

  if (questions.length === 0) {
      console.warn("No valid question blocks were successfully parsed from the file.");
      logError("No questions parsed", { filePath });
      await prisma.$disconnect();
      return;
  }


  console.log(`Starting database import into 'Question' model in batches of ${BATCH_SIZE}...`);
  let importedCount = 0;
  let batchErrors = 0;

  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    const batch = questions.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(questions.length / BATCH_SIZE)} (${batch.length} questions)...`); // Fixed ceiling calculation

    try {
      // Use Prisma.$transaction for atomic batch insertion
      await prisma.$transaction(
        batch.map(question =>
          // Create call adapted to user's schema and request:
          // Store combined rawGiftContent in the 'content' field
          // Use the provided documentId for all questions
          // Assuming 'type', 'difficulty', 'bloomLevel' might be null or require default/guessing if not in GIFT
          prisma.question.create({
            data: {
              documentId: PROVIDED_DOCUMENT_ID, // Use the fixed ID
              content: question.rawGiftContent, // Store the full combined content here
              type: 'multiplechoice', // Assuming all are multiple choice based on {} block parsing
              difficulty: 'unknown', // Default or try to infer if possible (not covered by current parser)
              bloomLevel: null, // Set to null or a default if not in GIFT
              // category, options, feedback are NOT stored in separate fields per user request
            },
          })
        )
      );
      importedCount += batch.length;
      console.log(`Batch imported successfully. Total imported: ${importedCount}`);

    } catch (error: unknown) { // Explicitly type as unknown
        batchErrors++;
        console.error(`Error importing batch starting at index ${i}:`, error);
        logError(`Error importing batch`, {
            startIndex: i,
            batchSize: batch.length,
            error: error instanceof Error ? error : String(error),
            batchPreview: batch.slice(0, 5).map(q => q.rawGiftContent.substring(0, 200) + '...') // Preview of raw content
        });
        // Decide whether to stop or continue after a batch error
        // For now, we'll log the error and *continue* with the next batch.
        // process.exit(1); // Uncomment to stop on first batch error
    }
  }

  console.log(`Import process finished.`);
  console.log(`Total question blocks parsed: ${questions.length}`);
  console.log(`Total questions successfully imported: ${importedCount}`);
  if (batchErrors > 0) {
      console.warn(`${batchErrors} batch(es) failed during import. Check ${LOG_FILE} for details.`);
  } else {
      console.log(`No batch errors occurred.`);
  }


  await prisma.$disconnect();
}

// Get file path from command line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: npx ts-node scripts/importMoodleQuestions.ts <path_to_gift_file>');
  process.exit(1);
}

const giftFilePath = path.resolve(args[0]); // Resolve the path to be absolute

importQuestions(giftFilePath);