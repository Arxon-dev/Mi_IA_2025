interface ConceptMapNode {
  id: string;
  label: string;
  level: 'central' | 'primary' | 'secondary' | 'detail';
  x: number;
  y: number;
  size: number;
  color: string;
}

interface ConceptMapEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

interface ConceptMapData {
  nodes: ConceptMapNode[];
  edges: ConceptMapEdge[];
  metadata: {
    totalNodes: number;
    totalConnections: number;
    complexity: 'simple' | 'medium' | 'complex';
    generatedWithAI: boolean;
    processingTime?: number;
  };
}

export class VisualizationAIService {
  
  private static readonly CONCEPT_MAP_PROMPT = `
Analiza el siguiente texto y genera un mapa conceptual jerárquico SIMPLIFICADO en formato JSON.

REGLAS IMPORTANTES:
1. MÁXIMO 1 concepto central
2. MÁXIMO 3-4 conceptos primarios 
3. MÁXIMO 2-3 conceptos secundarios por cada primario
4. MÁXIMO 1-2 conceptos de detalle por cada secundario
5. TOTAL: No más de 12 conceptos
6. CONEXIONES: Solo las esenciales, máximo 10-15 conexiones

JERARQUÍA ESTRICTA:
- Central: El tema/concepto PRINCIPAL del texto (solo 1)
- Primary: Conceptos DIRECTAMENTE relacionados con el central (3-4 máximo)  
- Secondary: Subconceptos que amplían los primarios (2-3 por primario)
- Detail: Ejemplos o aplicaciones específicas (1-2 por secundario)

FORMATO JSON OBLIGATORIO:
{
  "nodes": [
    {
      "id": "central-1",
      "label": "Concepto Principal",
      "level": "central"
    },
    {
      "id": "primary-1", 
      "label": "Concepto Primario 1",
      "level": "primary"
    },
    {
      "id": "secondary-1",
      "label": "Subconcepto 1", 
      "level": "secondary"
    },
    {
      "id": "detail-1",
      "label": "Detalle específico",
      "level": "detail"
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "central-1",
      "target": "primary-1", 
      "label": "incluye"
    },
    {
      "id": "e2", 
      "source": "primary-1",
      "target": "secondary-1",
      "label": "comprende"
    }
  ]
}

IMPORTANTE: 
- Los labels deben ser CONCISOS (máximo 25 caracteres)
- Solo conexiones lógicas y esenciales
- Mantener estructura jerárquica clara
- Evitar conceptos redundantes

TEXTO A ANALIZAR:
`;

  /**
   * Genera un mapa conceptual jerárquico usando IA
   */
  static async generateConceptMap(content: string): Promise<ConceptMapData> {
    try {
      console.log('🧠 [VisualizationAI] Iniciando generación de mapa conceptual con IA');
      
      // Llamar al servicio de IA
      const aiResponse = await this.callAI(this.CONCEPT_MAP_PROMPT + content);
      
      // Parsear respuesta de IA
      const aiData = this.parseAIResponse(aiResponse);
      
      // Convertir a formato interno
      const mapData = this.convertToConceptMapData(aiData);
      
      console.log('✅ [VisualizationAI] Mapa conceptual generado exitosamente:', {
        nodes: mapData.nodes.length,
        edges: mapData.edges.length,
        complexity: mapData.metadata.complexity
      });
      
      return mapData;
      
    } catch (error) {
      console.error('❌ [VisualizationAI] Error generando mapa conceptual:', error);
      throw new Error(`Error en generación de mapa conceptual: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Llama al servicio de IA configurado
   */
  private static async callAI(prompt: string): Promise<string> {
    try {
      // Obtener configuración de IA del servicio existente
      const { AIService } = await import('@/services/aiService');
      
      console.log('🔄 [VisualizationAI] Llamando a servicio de IA...');
      
      // Usar el método público validateWithAI que acepta prompts
      const response = await AIService.validateWithAI(prompt);
      
      return response;
      
    } catch (error) {
      console.error('❌ [VisualizationAI] Error en llamada a IA:', error);
      throw error;
    }
  }

  /**
   * Parsea la respuesta de la IA
   */
  private static parseAIResponse(response: string): any {
    try {
      // Buscar JSON en la respuesta
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No se encontró JSON válido en la respuesta de IA');
      }

      const jsonStr = jsonMatch[0];
      const parsed = JSON.parse(jsonStr);
      
      // Validar estructura básica
      if (!parsed.nodes || !parsed.edges) {
        throw new Error('Estructura de respuesta de IA inválida');
      }
      
      return parsed;
      
    } catch (error) {
      console.error('❌ [VisualizationAI] Error parseando respuesta de IA:', error);
      throw new Error('Error al interpretar respuesta de IA');
    }
  }

  /**
   * Convierte datos de IA al formato interno
   */
  private static convertToConceptMapData(aiData: any): ConceptMapData {
    const nodes: ConceptMapNode[] = [];
    const edges: ConceptMapEdge[] = [];
    
    // Configuración de layout
    const centerX = 600;
    const centerY = 450;
    
    // Función helper para dividir texto
    const splitText = (text: string, maxCharsPerLine: number, maxLines: number = 2) => {
      if (text.length <= maxCharsPerLine) return [text];
      
      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = '';
      
      for (const word of words) {
        if (lines.length >= maxLines) break;
        
        if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
          currentLine = currentLine ? currentLine + ' ' + word : word;
        } else {
          if (currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            lines.push(word.substring(0, maxCharsPerLine - 3) + '...');
            break;
          }
        }
      }
      
      if (currentLine && lines.length < maxLines) {
        lines.push(currentLine);
      }
      
      return lines;
    };
    
    // Función para calcular tamaño dinámico (igual que en el componente)
    const calculateDynamicSize = (text: string, level: 'central' | 'primary' | 'secondary' | 'detail') => {
      const levelConfig = {
        central: { minSize: 100, fontSize: 16, padding: 20 },
        primary: { minSize: 80, fontSize: 14, padding: 16 },
        secondary: { minSize: 60, fontSize: 12, padding: 12 },
        detail: { minSize: 45, fontSize: 10, padding: 8 }
      };
      
      const config = levelConfig[level];
      const charWidth = config.fontSize * 0.6;
      const lineHeight = config.fontSize * 1.2;
      
      // Dividir texto óptimamente
      const maxCharsPerLine = level === 'central' ? 12 : level === 'primary' ? 10 : 8;
      const lines = splitText(text, maxCharsPerLine, 2);
      
      // Calcular dimensiones necesarias
      const maxLineLength = Math.max(...lines.map(line => line.length));
      const textWidth = maxLineLength * charWidth;
      const textHeight = lines.length * lineHeight;
      
      // Determinar tamaño final
      const requiredSize = Math.max(textWidth, textHeight) + config.padding;
      return Math.max(requiredSize, config.minSize);
    };

    const levelColors = {
      central: '#2563eb',
      primary: '#059669',
      secondary: '#dc2626',
      detail: '#7c3aed'
    };

    // Procesar nodos directamente del array de la IA
    if (aiData.nodes && Array.isArray(aiData.nodes)) {
      const levelCounts = { central: 0, primary: 0, secondary: 0, detail: 0 };
      
      aiData.nodes.forEach((nodeData: any) => {
        const level = nodeData.level as 'central' | 'primary' | 'secondary' | 'detail';
        const index = levelCounts[level]++;
        
        // Calcular tamaño dinámico basado en el contenido del texto
        const dynamicSize = calculateDynamicSize(nodeData.label, level);
        
        let x, y;
        
        if (level === 'central') {
          x = centerX;
          y = centerY;
        } else {
          // Distribuir en círculo con espaciado basado en tamaño dinámico
          const totalInLevel = aiData.nodes.filter((n: any) => n.level === level).length;
          const angle = (index * 2 * Math.PI) / Math.max(totalInLevel, 3);
          
          // Radio base ajustado según el nivel y tamaño promedio
          const baseRadii = {
            primary: 180,
            secondary: 320,
            detail: 460
          };
          
          const radiusVariation = baseRadii[level as keyof typeof baseRadii] + (Math.random() - 0.5) * 40;
          
          x = centerX + radiusVariation * Math.cos(angle);
          y = centerY + radiusVariation * Math.sin(angle);
        }
        
        // Truncar label solo si es muy largo, manteniendo el texto original
        const displayLabel = nodeData.label.length > 25 ? 
          nodeData.label.substring(0, 22) + '...' : 
          nodeData.label;
        
        nodes.push({
          id: nodeData.id,
          label: displayLabel,
          level,
          x,
          y,
          color: levelColors[level],
          size: dynamicSize // ✅ Usar tamaño dinámico calculado
        });
      });
    }

    // Procesar edges directamente del array de la IA
    if (aiData.edges && Array.isArray(aiData.edges)) {
      aiData.edges.forEach((edgeData: any) => {
        const sourceExists = nodes.find(n => n.id === edgeData.source);
        const targetExists = nodes.find(n => n.id === edgeData.target);
        
        if (sourceExists && targetExists) {
          edges.push({
            id: edgeData.id,
            source: edgeData.source,
            target: edgeData.target,
            label: edgeData.label || 'relaciona'
          });
        }
      });
    }

    // Calcular estadísticas
    const complexity = nodes.length <= 8 ? 'simple' : nodes.length <= 15 ? 'medium' : 'complex';
    
    return {
      nodes,
      edges,
      metadata: {
        totalNodes: nodes.length,
        totalConnections: edges.length,
        complexity,
        generatedWithAI: true
      }
    };
  }

  /**
   * Extrae conceptos clave usando análisis simple como fallback
   */
  static generateSimpleConceptMap(content: string): ConceptMapData {
    console.log('🔄 [VisualizationAI] Generando mapa conceptual simple (fallback)');
    
    // Análisis básico del texto
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const words = content.toLowerCase().match(/\b[a-záéíóúñ]{4,}\b/g) || [];
    
    // Frecuencia de palabras
    const wordFreq: Record<string, number> = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    // Filtrar y obtener conceptos principales (máximo 10)
    const concepts = Object.entries(wordFreq)
      .filter(([word, freq]) => freq >= 2 && word.length >= 4)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
    
    if (concepts.length === 0) {
      concepts.push('Documento', 'Contenido', 'Información');
    }

    const nodes: ConceptMapNode[] = [];
    const edges: ConceptMapEdge[] = [];
    
    // Configuración
    const centerX = 600;
    const centerY = 450;
    const levelConfig = {
      central: { radius: 0, size: 110, color: '#2563eb' },
      primary: { radius: 200, size: 85, color: '#059669' },
      secondary: { radius: 320, size: 65, color: '#dc2626' },
      detail: { radius: 440, size: 50, color: '#7c3aed' }
    };
    
    // Crear nodos con distribución jerárquica
    concepts.forEach((concept, index) => {
      let level: 'central' | 'primary' | 'secondary' | 'detail';
      let config;
      
      if (index === 0) {
        level = 'central';
        config = levelConfig.central;
      } else if (index <= 3) {
        level = 'primary';
        config = levelConfig.primary;
      } else if (index <= 6) {
        level = 'secondary';
        config = levelConfig.secondary;
      } else {
        level = 'detail';
        config = levelConfig.detail;
      }
      
      let x, y;
      if (level === 'central') {
        x = centerX;
        y = centerY;
      } else {
        // Calcular posición en círculo
        const levelNodes = concepts.slice(
          level === 'primary' ? 1 : level === 'secondary' ? 4 : 7,
          level === 'primary' ? 4 : level === 'secondary' ? 7 : concepts.length
        );
        const levelIndex = levelNodes.indexOf(concept);
        const angle = (levelIndex * 2 * Math.PI) / Math.max(levelNodes.length, 3);
        const radiusVariation = config.radius + (Math.random() - 0.5) * 20;
        
        x = centerX + radiusVariation * Math.cos(angle);
        y = centerY + radiusVariation * Math.sin(angle);
      }
      
      // Truncar texto si es muy largo
      const label = concept.length > 20 ? concept.substring(0, 17) + '...' : concept;
      
      nodes.push({
        id: `${level}-${index}`,
        label: label,
        level,
        x,
        y,
        color: config.color,
        size: config.size
      });
    });
    
    // Crear relaciones jerárquicas simples
    nodes.forEach(node => {
      if (node.level !== 'central') {
        const parentLevel = node.level === 'primary' ? 'central' : 
                         node.level === 'secondary' ? 'primary' : 'secondary';
        const parentNodes = nodes.filter(n => n.level === parentLevel);
        
        if (parentNodes.length > 0) {
          const parent = parentNodes[Math.floor(Math.random() * parentNodes.length)];
          edges.push({
            id: `edge-${node.id}`,
            source: parent.id,
            target: node.id,
            label: ['incluye', 'comprende', 'define', 'mediante'][Math.floor(Math.random() * 4)]
          });
        }
      }
    });
    
    return {
      nodes,
      edges,
      metadata: {
        totalNodes: nodes.length,
        totalConnections: edges.length,
        complexity: nodes.length <= 6 ? 'simple' : 'medium',
        generatedWithAI: false
      }
    };
  }
} 