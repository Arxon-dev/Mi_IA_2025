import { distractorsPrompt } from '../config/prompts/distractorsPrompt';

export class PromptSelectorService {
  /**
   * Selecciona el prompt de distractores adecuado según el documento
   */
  static selectDistractorsPrompt(_documentTitle: string, _documentContent: string): string {
    // Siempre devuelve el prompt de distractores general
    return distractorsPrompt;
  }
} 