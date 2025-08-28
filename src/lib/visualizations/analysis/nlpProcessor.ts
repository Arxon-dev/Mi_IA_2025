import * as natural from 'natural';
import nlp from 'compromise';
import { Entity, Relationship, DocumentSegment } from '../types';
import { detectPatterns, extractActionVerbs, generateId } from '../utils/textUtils';

/**
 * Procesador de Lenguaje Natural para análisis de documentos
 */
export class NLPProcessor {
  private tokenizer: natural.WordTokenizer;
  private stemmer: typeof natural.PorterStemmerEs;

  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmerEs;
  }

  /**
   * Procesa un documento y extrae entidades
   */
  async extractEntities(content: string): Promise<Entity[]> {
    const entities: Entity[] = [];
    const doc = nlp(content);

    // Extraer personas
    const people = doc.people().out('array');
    people.forEach((person: string, index: number) => {
      entities.push({
        text: person,
        type: 'person',
        confidence: 0.8,
        position: { start: index * 10, end: index * 10 + person.length }
      });
    });

    // Extraer organizaciones
    const orgs = doc.organizations().out('array');
    orgs.forEach((org: string, index: number) => {
      entities.push({
        text: org,
        type: 'organization', 
        confidence: 0.7,
        position: { start: index * 15, end: index * 15 + org.length }
      });
    });

    // Extraer conceptos (sustantivos importantes)
    const nouns = doc.nouns().out('array');
    nouns.forEach((noun: string, index: number) => {
      if (noun.length > 3) {
        entities.push({
          text: noun,
          type: 'concept',
          confidence: 0.6,
          position: { start: index * 8, end: index * 8 + noun.length }
        });
      }
    });

    // Extraer acciones (verbos)
    const verbs = extractActionVerbs(content);
    verbs.forEach((verb: string, index: number) => {
      entities.push({
        text: verb,
        type: 'action',
        confidence: 0.7,
        position: { start: index * 12, end: index * 12 + verb.length }
      });
    });

    return entities;
  }

  /**
   * Identifica relaciones entre entidades
   */
  async extractRelationships(segments: DocumentSegment[]): Promise<Relationship[]> {
    const relationships: Relationship[] = [];

    for (const segment of segments) {
      const patterns = detectPatterns(segment.content);
      const entities = segment.entities || [];

      // Buscar relaciones causales
      if (patterns.hasCausalRelations && entities.length >= 2) {
        for (let i = 0; i < entities.length - 1; i++) {
          relationships.push({
            source: entities[i].text,
            target: entities[i + 1].text,
            type: 'causes',
            confidence: 0.6,
            context: segment.content
          });
        }
      }

      // Buscar relaciones jerárquicas
      if (patterns.hasHierarchy && entities.length >= 2) {
        relationships.push({
          source: entities[0].text,
          target: entities[1].text,
          type: 'includes',
          confidence: 0.7,
          context: segment.content
        });
      }

      // Buscar relaciones secuenciales
      if (patterns.hasProcesses && entities.length >= 2) {
        for (let i = 0; i < entities.length - 1; i++) {
          relationships.push({
            source: entities[i].text,
            target: entities[i + 1].text,
            type: 'follows',
            confidence: 0.8,
            context: segment.content
          });
        }
      }
    }

    return relationships;
  }

  /**
   * Analiza la complejidad y estructura del documento
   */
  async analyzeDocumentStructure(content: string) {
    const doc = nlp(content);
    const sentences = doc.sentences().out('array');
    const patterns = detectPatterns(content);

    return {
      sentenceCount: sentences.length,
      averageWordsPerSentence: this.calculateAverageWords(sentences),
      complexityScore: this.calculateComplexity(content, patterns),
      patterns,
      topics: this.extractTopics(content),
      readabilityScore: this.calculateReadability(sentences)
    };
  }

  /**
   * Extrae temas principales del documento
   */
  private extractTopics(content: string): string[] {
    const doc = nlp(content);
    const nouns = doc.nouns().out('array');
    
    // Contar frecuencia de sustantivos
    const frequency: { [key: string]: number } = {};
    nouns.forEach(noun => {
      if (noun.length > 3) {
        frequency[noun] = (frequency[noun] || 0) + 1;
      }
    });

    // Retornar los 10 más frecuentes
    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Calcula el promedio de palabras por oración
   */
  private calculateAverageWords(sentences: string[]): number {
    const totalWords = sentences.reduce((sum, sentence) => {
      return sum + this.tokenizer.tokenize(sentence).length;
    }, 0);
    
    return sentences.length > 0 ? totalWords / sentences.length : 0;
  }

  /**
   * Calcula un score de complejidad del documento
   */
  private calculateComplexity(content: string, patterns: any): number {
    let complexity = 0;

    // Factores que aumentan complejidad
    complexity += patterns.hasProcesses ? 2 : 0;
    complexity += patterns.hasCausalRelations ? 3 : 0;
    complexity += patterns.hasHierarchy ? 2 : 0;
    complexity += patterns.hasDecisions ? 3 : 0;

    // Longitud del documento
    const words = this.tokenizer.tokenize(content).length;
    complexity += Math.min(words / 100, 5); // Máximo 5 puntos por longitud

    return Math.min(complexity, 10); // Escala de 0-10
  }

  /**
   * Calcula un score de legibilidad básico
   */
  private calculateReadability(sentences: string[]): number {
    const avgWordsPerSentence = this.calculateAverageWords(sentences);
    
    // Score basado en longitud promedio de oraciones
    if (avgWordsPerSentence < 10) return 9; // Muy fácil
    if (avgWordsPerSentence < 15) return 7; // Fácil
    if (avgWordsPerSentence < 20) return 5; // Moderado
    if (avgWordsPerSentence < 25) return 3; // Difícil
    return 1; // Muy difícil
  }
} 