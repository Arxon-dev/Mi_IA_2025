import { section } from '@prisma/client';
import { PrismaService } from './prismaService';

/**
 * Resultado de la categorización
 */
export interface CategorizationResult {
  category: string;
  subcategory: string;
  confidence: number;
  moodleCode: string;
  detectedPatterns: string[];
}

/**
 * Servicio de categorización inteligente para documentos
 */
export class CategorizationService {
  
  /**
   * Categoriza una sección específica
   */
  static categorizeSection(title: string, content: string = ''): CategorizationResult {
    // Detectar si es de Reales Ordenanzas
    if (this.isRealesTordenanzas(title, content)) {
      return this.categorizeRealesTordenanzas(title, content);
    }
    
    // Aquí se pueden agregar más categorizadores específicos
    // if (this.isPDC01(title, content)) {
    //   return this.categorizePDC01(title, content);
    // }
    
    // Categorización general por defecto
    return {
      category: 'GENERAL',
      subcategory: 'Sin categoría específica',
      confidence: 30,
      moodleCode: 'GEN_001',
      detectedPatterns: []
    };
  }

  /**
   * Detecta si el contenido pertenece a Reales Ordenanzas
   */
  private static isRealesTordenanzas(title: string, content: string): boolean {
    const realesTordenanzasPatterns = [
      /reales\s+ordenanzas/i,
      /real\s+ordenanza/i,
      /r\.?\s*o\.?/i,
      /ordenanza\s+real/i,
      /ordenanzas\s+reales/i
    ];
    
    const text = `${title} ${content}`.toLowerCase();
    return realesTordenanzasPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Categoriza contenido específico de Reales Ordenanzas
   */
  private static categorizeRealesTordenanzas(title: string, content: string): CategorizationResult {
    const text = `${title} ${content}`.toLowerCase();
    
    // Patrones jerárquicos optimizados
    const hierarchicalPatterns = [
      { pattern: /^(capítulo|cap\.?)\s*([ivxlcdm]+|\d+)/i, category: 'RROO_CAPITULOS', confidence: 95 },
      { pattern: /^(artículo|art\.?)\s*(\d+)/i, category: 'RROO_ARTICULOS', confidence: 95 },
      { pattern: /^(título|tít\.?)\s*([ivxlcdm]+|\d+)/i, category: 'RROO_TITULOS', confidence: 90 },
      { pattern: /^(sección|secc\.?)\s*(\d+)/i, category: 'RROO_SECCIONES', confidence: 85 }
    ];

    // Verificar patrones jerárquicos
    for (const { pattern, category, confidence } of hierarchicalPatterns) {
      if (pattern.test(title)) {
        return {
          category: 'Reales Ordenanzas',
          subcategory: category,
          confidence,
          moodleCode: this.generateMoodleCode(category, title),
          detectedPatterns: ['reales ordenanzas', category.toLowerCase()]
        };
      }
    }

    // Patrones temáticos
    const thematicPatterns = [
      { keywords: ['disciplina', 'sanción', 'falta', 'correctivo'], category: 'RROO_DISCIPLINA', confidence: 85 },
      { keywords: ['servicio', 'guardia', 'centinela', 'puesto'], category: 'RROO_SERVICIO', confidence: 85 },
      { keywords: ['uniforme', 'distintivo', 'insignia', 'vestuario'], category: 'RROO_UNIFORMIDAD', confidence: 85 },
      { keywords: ['protocolo', 'ceremonia', 'honores', 'saludo'], category: 'RROO_PROTOCOLO', confidence: 80 },
      { keywords: ['disposición', 'transitoria', 'final', 'derogatoria'], category: 'RROO_DISPOSICIONES', confidence: 80 }
    ];

    for (const { keywords, category, confidence } of thematicPatterns) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return {
          category: 'Reales Ordenanzas',
          subcategory: category,
          confidence,
          moodleCode: this.generateMoodleCode(category, title),
          detectedPatterns: ['reales ordenanzas', ...keywords.filter(k => text.includes(k))]
        };
      }
    }

    // Categorización general de Reales Ordenanzas
    return {
      category: 'Reales Ordenanzas',
      subcategory: 'RROO_GENERAL',
      confidence: 90,
      moodleCode: 'RROO_GEN_001',
      detectedPatterns: ['reales ordenanzas']
    };
  }

  /**
   * Genera código Moodle basado en la categoría y título
   */
  private static generateMoodleCode(category: string, title: string): string {
    const prefix = category.substring(0, 4).toUpperCase();
    const hash = this.simpleHash(title);
    return `${prefix}_${hash.toString().padStart(3, '0')}`;
  }

  /**
   * Función hash simple para generar códigos únicos
   */
  private static simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir a 32bit integer
    }
    return Math.abs(hash) % 1000;
  }

  /**
   * Categoriza todas las secciones de un documento
   */
  static async categorizeDocumentSections(documentId: string): Promise<void> {
    try {
      console.log(`🔍 Iniciando categorización de secciones para documento: ${documentId}`);
      
      // Cambiar getSectionsByDocumentId por getSections
      const sections = await PrismaService.getSections(documentId);
      
      if (!sections || sections.length === 0) {
        console.log('❌ No se encontraron secciones para categorizar');
        return;
      }

      console.log(`📄 Encontradas ${sections.length} secciones para categorizar`);
      
      let categorizedCount = 0;
      let generalCount = 0;

      for (const section of sections) {
        const result = this.categorizeSection(section.title, section.content || '');
        
        // Aquí podrías guardar el resultado en la base de datos
        // Por ejemplo, agregando campos de categorización a la tabla section
        console.log(`✅ Sección "${section.title}" categorizada como: ${result.category} > ${result.subcategory} (${result.confidence}% confianza)`);
        
        if (result.category === 'GENERAL') {
          generalCount++;
        } else {
          categorizedCount++;
        }
      }

      console.log(`\n📊 RESUMEN DE CATEGORIZACIÓN:`);
      console.log(`   • Secciones categorizadas específicamente: ${categorizedCount}`);
      console.log(`   • Secciones categorizadas como GENERAL: ${generalCount}`);
      console.log(`   • Porcentaje de mejora: ${((categorizedCount / sections.length) * 100).toFixed(1)}%`);
      
    } catch (error) {
      console.error('❌ Error durante la categorización:', error);
      throw error;
    }
  }
}