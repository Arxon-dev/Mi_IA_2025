export interface QuestionData {
  category?: string;
  rawGiftContent: string; // Store the full parsed content to be put into 'content' field
  // Note: Separate fields for options/feedback are NOT included here as per user's request
}

/**
 * Parses the content of a Moodle GIFT format file.
 *
 * It identifies question blocks by the presence of { and } markers.
 *
 * @param giftContent The content of the GIFT file as a string.
 * @returns An array of QuestionData objects.
 * @throws Error if a question block is malformed (e.g., { without matching } or vice versa).
 */
export function parseGiftQuestions(giftContent: string): QuestionData[] {
  const questions: QuestionData[] = [];
  const lines = giftContent.split(/\r?\n/); // Handle different line endings

  let currentQuestionLines: string[] = [];
  let currentCategory: string | undefined = undefined; // Track category across questions
  let inAnswerBlock = false; // Flag to indicate if we are inside the {} answer/feedback block

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith('//')) {
      // Ignore comment lines
      continue;
    }

     // Update category if a category line is encountered (::Category:: or ::Category\nText::{)
     const categoryMatch = trimmedLine.match(/^::(.*?)::/s); // Match ::Category:: potentially followed by text at the start
     if (categoryMatch) {
        const contentInsideCategoryBlock = categoryMatch[1].trim();
        const newlineIndex = contentInsideCategoryBlock.indexOf('\n');
        if (newlineIndex !== -1) {
            currentCategory = contentInsideCategoryBlock.substring(0, newlineIndex).trim();
        } else {
             currentCategory = contentInsideCategoryBlock;
        }
         // Note: The full line with :: is added to the question lines below.
     }

    // Detect the start of the answer/feedback block
    if (trimmedLine.includes('{') && !inAnswerBlock) {
        // If we encounter { and are NOT already in an answer block, this marks the start
        // Process any accumulated lines BEFORE the { as part of the previous question block (if any)
        if (currentQuestionLines.length > 0) {
             tryProcessBlock(questions, currentQuestionLines, currentCategory);
             currentQuestionLines = []; // Reset for the lines leading up to this {
        }
        inAnswerBlock = true;
        // Add the line containing { to the current question lines
        currentQuestionLines.push(line);
        continue; // Move to the next line
    }

    // Detect the end of the answer/feedback block
    if (trimmedLine.includes('}') && inAnswerBlock) {
        // If we encounter } and ARE in an answer block, this marks the end
        currentQuestionLines.push(line); // Add the line containing } to the current question lines
        inAnswerBlock = false;

         // Now that we have the complete question block (from text before { to the line with }), process it
        if (currentQuestionLines.length > 0) {
             tryProcessBlock(questions, currentQuestionLines, currentCategory);
             currentQuestionLines = []; // Reset for the next question
        }
        continue; // Move to the next line
    }

    // If we are inside the answer block or just accumulating lines before a potential {,
    // add the current line to the block lines.
    currentQuestionLines.push(line); // Use original line to preserve spacing
  }

  // After the loop, process any remaining lines. This might be the last question block
  // if the file doesn't end cleanly with a } followed by a separator.
  if (currentQuestionLines.length > 0) {
     tryProcessBlock(questions, currentQuestionLines, currentCategory);
  }

   // Helper function to try parsing a block and log errors
   function tryProcessBlock(questionsArray: QuestionData[], blockLines: string[], category?: string) {
       if (blockLines.length === 0 || blockLines.every(line => line.trim() === '')) return; // Skip empty blocks

       const rawGiftContent = blockLines.join('\n');

       // Check if the block contains both { and } - basic validation for a valid GIFT question block
       if (!rawGiftContent.includes('{') || !rawGiftContent.includes('}')) {
            // This block doesn't seem to be a valid GIFT question block (missing {}).
            // It might be introductory text or a malformed entry. Log it and skip.
            const blockPreview = blockLines.slice(0, 10).join('\n').substring(0, 500) + '...';
            console.warn(`Skipping potential question block missing {} markers: ${blockPreview}`);
            return; // Do not process this as a valid question
       }

       try {
            const question = parseSingleGiftQuestion(rawGiftContent, category);
            questionsArray.push(question);
       } catch (error) {
           // Log the error and the block content that failed to parse
           const blockPreview = blockLines.slice(0, 10).join('\n').substring(0, 500) + '...';
           console.error(`Error parsing question block: ${blockPreview}`, error);
       }
   }

  return questions;
}

/**
 * Parses a single question block in Moodle GIFT format and returns the raw content.
 * It extracts category if present in the block itself (::Category\nText:: format)
 * and removes the initial part up to the second :: marker before returning the content.
 *
 * @param questionBlock The string content of a single question block.
 * @param inheritedCategory The category inherited from a previous category line.
 * @returns A QuestionData object with the processed raw content and potentially extracted category.
 * @throws Error if the block is malformed (e.g., issues beyond missing {} or expected ::).
 */
function parseSingleGiftQuestion(questionBlock: string, inheritedCategory?: string): QuestionData {
  const trimmedBlock = questionBlock.trim();
   if (trimmedBlock.length === 0) {
       throw new Error("Empty question block");
   }

   // We expect a block to contain both { and } based on the user's format.
   // This check is already in tryProcessBlock, but keeping a basic check here is fine too.
   if (!trimmedBlock.includes('{') || !trimmedBlock.includes('}')) {
       throw new Error("Question block does not contain expected {} answer block");
   }

   // Attempt to extract category if it's part of the block (::Category\nText::)
   // Keeping this logic to potentially capture the category name, even though the ::...:: part is removed from content.
   let category: string | undefined = inheritedCategory;
   const firstCategoryMatch = trimmedBlock.match(/^::(.*?)::/s); // Non-greedy match for content inside the first :: at the start
   if(firstCategoryMatch && firstCategoryMatch[1] !== undefined) { // Check if group 1 exists and is not undefined
       const contentInsideCategoryBlock = firstCategoryMatch[1].trim();
       const newlineIndex = contentInsideCategoryBlock.indexOf('\n');
       if (newlineIndex !== -1) {
           category = contentInsideCategoryBlock.substring(0, newlineIndex).trim();
       } else {
            // Only category name inside ::
             category = contentInsideCategoryBlock;
       }
   }

   // --- Logic to remove the prefix up to the second :: ---
   let contentAfterPrefix = questionBlock; // Start with the full original block

   const firstColonColonIndex = questionBlock.indexOf('::');
   if (firstColonColonIndex !== -1) {
       const substringAfterFirst = questionBlock.substring(firstColonColonIndex + 2);
       const secondColonColonIndex = substringAfterFirst.indexOf('::');

       if (secondColonColonIndex !== -1) {
           // Found the second ::, take the content after it
           contentAfterPrefix = substringAfterFirst.substring(secondColonColonIndex + 2);
       } else if (firstColonColonIndex === 0) {
            // If the block starts with :: but there's no second ::, keep the full block.
            // This might be an unexpected format, but better than removing content incorrectly.
            console.warn(`Found :: at the start of block but no second :: to mark end of prefix. Keeping full block: ${trimmedBlock.substring(0, 100)}...`);
            // contentAfterPrefix remains the full questionBlock
       } else {
           // If :: is found but not at the start, and no second :: is found, keep the full block.
           // This means the :: might be part of the regular text, not a category/prefix marker.
            console.warn(`Found :: within the block but no second :: to mark end of prefix. Keeping full block: ${trimmedBlock.substring(0, 100)}...`);
            // contentAfterPrefix remains the full questionBlock
       }
   } else {
       // No :: found at all. This block doesn't match the expected prefix pattern. Keep the full block.
        // This might be a block without a category line, which is valid GIFT.
         contentAfterPrefix = questionBlock; // Keep the full block
   }

  // The rawGiftContent is the content after removing the identified prefix.
  // We preserve the original line breaks and spacing from the remaining part.
  const rawGiftContent = contentAfterPrefix.trim(); // Trim leading/trailing whitespace after removing prefix

  return {
    category: category, // Use the extracted or inherited category
    rawGiftContent: rawGiftContent, // Store the processed content
  };
} 