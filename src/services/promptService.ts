import { promises as fs } from 'fs';
import path from 'path';

// Importar los prompts estáticamente
import { expertPrompt } from '../config/prompts/expertPrompt';
import { formatPrompt } from '../config/prompts/formatPrompt';
import { difficultyPrompt } from '../config/prompts/difficultyPrompt';
import { distractorsPrompt } from '../config/prompts/distractorsPrompt';
import { documentationPrompt } from '../config/prompts/documentationPrompt';
import { qualityPrompt } from '../config/prompts/qualityPrompt';

export interface Prompt {
  id?: string;
  name: string;
  content: string;
  file: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const DEFAULT_PROMPTS = [
  {
    name: 'Prompt de Experto',
    content: expertPrompt,
    file: 'expertPrompt'
  },
  {
    name: 'Prompt de Formato',
    content: formatPrompt,
    file: 'formatPrompt'
  },
  {
    name: 'Prompt de Dificultad',
    content: difficultyPrompt,
    file: 'difficultyPrompt'
  },
  {
    name: 'Prompt de Distractores',
    content: distractorsPrompt,
    file: 'distractorsPrompt'
  },
  {
    name: 'Prompt de Documentación',
    content: documentationPrompt,
    file: 'documentationPrompt'
  },
  {
    name: 'Prompt de Calidad',
    content: qualityPrompt,
    file: 'qualityPrompt'
  }
];

export class PromptService {
  private static readonly API_BASE_URL = '/api/prompts';

  static async getPrompt(file: string): Promise<Prompt> {
    try {
      console.log(`🔍 Buscando prompt: ${file}`);
      
      // Intentar obtener el prompt de la API
      const response = await fetch(`${this.API_BASE_URL}/${file}`);
      
      if (response.ok) {
        const prompt = await response.json();
        console.log(`✅ Prompt encontrado: ${prompt.name}`);
        return prompt;
      }

      // Si la API falla, buscar en los prompts por defecto
      const defaultPrompt = DEFAULT_PROMPTS.find(p => p.file === file);
      if (defaultPrompt) {
        console.log(`✅ Usando prompt por defecto: ${defaultPrompt.name}`);
        return defaultPrompt;
      }

      throw new Error(`No se encontró el prompt: ${file}`);
    } catch (error) {
      console.error(`❌ Error al obtener el prompt ${file}:`, error);
      
      // Último intento: buscar en los prompts por defecto
      const defaultPrompt = DEFAULT_PROMPTS.find(p => p.file === file);
      if (defaultPrompt) {
        console.log(`✅ Fallback a prompt por defecto: ${defaultPrompt.name}`);
        return defaultPrompt;
      }

      throw error;
    }
  }

  static async getAllPrompts(): Promise<Prompt[]> {
    try {
      console.log('🔍 Obteniendo todos los prompts');
      const response = await fetch(this.API_BASE_URL);
      
      if (response.ok) {
        const prompts = await response.json();
        console.log(`✅ ${prompts.length} prompts encontrados`);
        return prompts;
      }

      console.log('⚠️ Usando prompts por defecto');
      return DEFAULT_PROMPTS;
    } catch (error) {
      console.error('❌ Error al obtener los prompts:', error);
      console.log('⚠️ Fallback a prompts por defecto');
      return DEFAULT_PROMPTS;
    }
  }

  static async initializePrompts(): Promise<void> {
    try {
      console.log('🔄 Inicializando prompts...');
      const response = await fetch(`${this.API_BASE_URL}/init`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Error al inicializar los prompts');
      }

      console.log('✅ Prompts inicializados correctamente');
    } catch (error) {
      console.error('❌ Error al inicializar los prompts:', error);
      throw error;
    }
  }

  static async updatePrompt(file: string, data: Partial<Prompt>): Promise<Prompt> {
    try {
      console.log(`📝 Actualizando prompt: ${file}`);
      const response = await fetch(`${this.API_BASE_URL}/${file}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al actualizar el prompt');
      }

      const prompt = await response.json();
      console.log(`✅ Prompt actualizado: ${prompt.name}`);
      return prompt;
    } catch (error) {
      console.error(`❌ Error al actualizar el prompt ${file}:`, error);
      throw error;
    }
  }
} 