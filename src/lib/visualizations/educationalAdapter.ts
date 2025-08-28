/**
 * 📚 Adaptador Educativo - OpositIA
 * Transforma datos de visualización estándar a formato educativo optimizado
 */

import { VisualizationData } from './types';

export interface EducationalNode {
  id: string;
  label: string;
  fullText: string;
  category: string;
  importance: number; // 1-5 (5 = crítico para examen)
  studyLevel: 'basic' | 'intermediate' | 'advanced';
  keyPoints: string[];
  examples?: string[];
  mnemonics?: string;
  context?: any;
}

export interface EducationalEdge {
  from: string;
  to: string;
  relationshipType: 'includes' | 'regulates' | 'depends_on' | 'implements' | 'part_of' | 'example_of';
  explanation: string;
  strength: number; // 1-3 (importancia de la relación)
}

export interface EducationalVisualizationData {
  nodes: EducationalNode[];
  edges: EducationalEdge[];
  categories: string[];
  studyStats: {
    totalConcepts: number;
    criticalConcepts: number;
    basicConcepts: number;
    intermediateConcepts: number;
    advancedConcepts: number;
  };
}

/**
 * Transforma datos de visualización estándar a formato educativo
 */
export function transformToEducationalFormat(data: VisualizationData): EducationalVisualizationData {
  // Transformar nodos con información educativa enriquecida
  const educationalNodes: EducationalNode[] = data.nodes.map((node, index) => {
    const context = (node as any).context || {};
    
    // Determinar importancia basada en contexto y posición
    const importance = calculateImportance(node, context, index);
    
    // Determinar nivel de estudio
    const studyLevel = determineStudyLevel(node, context);
    
    // Extraer puntos clave del contexto
    const keyPoints = extractKeyPoints(node, context);
    
    // Extraer ejemplos si existen
    const examples = extractExamples(context);
    
    // Generar regla mnemotécnica si es posible
    const mnemonics = generateMnemonic(node.label);

    return {
      id: node.id,
      label: node.label,
      fullText: context.description || node.label,
      category: (node as any).category || determineCategoryFromContext(context) || 'General',
      importance,
      studyLevel,
      keyPoints,
      examples,
      mnemonics,
      context
    };
  });

  // Transformar conexiones con información educativa
  const educationalEdges: EducationalEdge[] = data.edges.map(edge => {
    const relationshipType = mapToEducationalRelationship(edge.type || 'relates_to');
    const explanation = generateRelationshipExplanation(edge, educationalNodes);
    const strength = calculateRelationshipStrength(edge, educationalNodes);

    return {
      from: edge.from || edge.source || '',
      to: edge.to || edge.target || '',
      relationshipType,
      explanation,
      strength
    };
  }).filter(edge => edge.from && edge.to);

  // Extraer categorías únicas
  const categories = Array.from(new Set(educationalNodes.map(node => node.category)));

  // Calcular estadísticas de estudio
  const studyStats = {
    totalConcepts: educationalNodes.length,
    criticalConcepts: educationalNodes.filter(n => n.importance >= 4).length,
    basicConcepts: educationalNodes.filter(n => n.studyLevel === 'basic').length,
    intermediateConcepts: educationalNodes.filter(n => n.studyLevel === 'intermediate').length,
    advancedConcepts: educationalNodes.filter(n => n.studyLevel === 'advanced').length,
  };

  return {
    nodes: educationalNodes,
    edges: educationalEdges,
    categories,
    studyStats
  };
}

/**
 * Calcula la importancia de un concepto (1-5)
 */
function calculateImportance(node: any, context: any, index: number): number {
  let importance = 3; // Base media

  // Factor de posición (primeros conceptos son más importantes)
  if (index < 3) importance += 1;
  if (index === 0) importance += 1;

  // Factor de contexto
  if (context.functions && context.functions.length > 3) importance += 1;
  if (context.responsibilities && context.responsibilities.length > 2) importance += 1;
  if (context.normativeFramework && context.normativeFramework.length > 0) importance += 1;

  // Factor de categoría
  const category = (node as any).category || '';
  if (category.includes('Ministerio') || category.includes('Dirección')) importance += 1;
  if (category.includes('Marco Jurídico') || category.includes('legal')) importance += 1;

  // Factor de tipo
  if (node.type === 'main' || node.type === 'organization') importance += 1;

  return Math.min(5, Math.max(1, importance));
}

/**
 * Determina el nivel de estudio basado en complejidad
 */
function determineStudyLevel(node: any, context: any): 'basic' | 'intermediate' | 'advanced' {
  let complexity = 0;

  // Contar elementos de complejidad
  if (context.functions) complexity += context.functions.length;
  if (context.responsibilities) complexity += context.responsibilities.length;
  if (context.dependencies) complexity += context.dependencies.length;
  if (context.normativeFramework) complexity += context.normativeFramework.length * 2; // Marco legal es más complejo

  // Clasificar por complejidad
  if (complexity <= 3) return 'basic';
  if (complexity <= 8) return 'intermediate';
  return 'advanced';
}

/**
 * Extrae puntos clave para memorización
 */
function extractKeyPoints(node: any, context: any): string[] {
  const keyPoints: string[] = [];

  // Agregar definición principal si existe
  if (context.description) {
    keyPoints.push(`Definición: ${context.description.substring(0, 100)}...`);
  }

  // Agregar funciones principales (máximo 3)
  if (context.functions && context.functions.length > 0) {
    context.functions.slice(0, 3).forEach((func: string) => {
      keyPoints.push(`Función: ${func}`);
    });
  }

  // Agregar responsabilidades clave (máximo 2)
  if (context.responsibilities && context.responsibilities.length > 0) {
    context.responsibilities.slice(0, 2).forEach((resp: string) => {
      keyPoints.push(`Responsabilidad: ${resp}`);
    });
  }

  // Agregar marco legal si existe
  if (context.legalBasis && context.legalBasis.length > 0) {
    keyPoints.push(`Base legal: ${context.legalBasis[0]}`);
  }

  return keyPoints.length > 0 ? keyPoints : [`Concepto clave: ${node.label}`];
}

/**
 * Extrae ejemplos del contexto
 */
function extractExamples(context: any): string[] | undefined {
  const examples: string[] = [];

  if (context.applications && context.applications.length > 0) {
    context.applications.slice(0, 2).forEach((app: string) => {
      examples.push(app);
    });
  }

  if (context.steps && context.steps.length > 0) {
    examples.push(`Proceso: ${context.steps.slice(0, 2).join(' → ')}`);
  }

  return examples.length > 0 ? examples : undefined;
}

/**
 * Genera una regla mnemotécnica simple
 */
function generateMnemonic(label: string): string | undefined {
  const words = label.split(' ').filter(word => word.length > 3);
  
  if (words.length >= 2) {
    const acronym = words.map(word => word[0].toUpperCase()).join('');
    return `Recuerda: ${acronym} (${words.map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(' ')})`;
  }

  return undefined;
}

/**
 * Determina la categoría desde el contexto
 */
function determineCategoryFromContext(context: any): string | null {
  if (context.organizationalLevel) {
    if (context.organizationalLevel.includes('Ministerial')) return 'Estructura Ministerial';
    if (context.organizationalLevel.includes('Dirección')) return 'Estructura Direccional';
    if (context.organizationalLevel.includes('Subdirección')) return 'Estructura Subdireccional';
  }

  if (context.legalBasis && context.legalBasis.length > 0) return 'Marco Jurídico';
  if (context.functions && context.functions.length > 0) return 'Funciones y Competencias';
  if (context.steps && context.steps.length > 0) return 'Procesos y Procedimientos';

  return null;
}

/**
 * Mapea tipos de relación a formato educativo
 */
function mapToEducationalRelationship(type: string): EducationalEdge['relationshipType'] {
  switch (type.toLowerCase()) {
    case 'hierarchical':
    case 'includes':
      return 'includes';
    case 'regulates':
    case 'controls':
      return 'regulates';
    case 'depends_on':
    case 'dependency':
      return 'depends_on';
    case 'implements':
    case 'executes':
      return 'implements';
    case 'part_of':
    case 'belongs_to':
      return 'part_of';
    case 'example_of':
    case 'instance':
      return 'example_of';
    default:
      return 'part_of';
  }
}

/**
 * Genera explicación de la relación
 */
function generateRelationshipExplanation(edge: any, nodes: EducationalNode[]): string {
  const fromNode = nodes.find(n => n.id === (edge.from || edge.source));
  const toNode = nodes.find(n => n.id === (edge.to || edge.target));

  if (!fromNode || !toNode) return 'Relación conceptual';

  const relationship = mapToEducationalRelationship(edge.type || 'relates_to');

  switch (relationship) {
    case 'includes':
      return `${fromNode.label} incluye o abarca ${toNode.label}`;
    case 'regulates':
      return `${fromNode.label} regula o controla ${toNode.label}`;
    case 'depends_on':
      return `${fromNode.label} depende de ${toNode.label}`;
    case 'implements':
      return `${fromNode.label} implementa o ejecuta ${toNode.label}`;
    case 'part_of':
      return `${fromNode.label} es parte de ${toNode.label}`;
    case 'example_of':
      return `${fromNode.label} es un ejemplo de ${toNode.label}`;
    default:
      return `${fromNode.label} se relaciona con ${toNode.label}`;
  }
}

/**
 * Calcula la fuerza de la relación (1-3)
 */
function calculateRelationshipStrength(edge: any, nodes: EducationalNode[]): number {
  const fromNode = nodes.find(n => n.id === (edge.from || edge.source));
  const toNode = nodes.find(n => n.id === (edge.to || edge.target));

  if (!fromNode || !toNode) return 1;

  // Relaciones entre conceptos de alta importancia son más fuertes
  const avgImportance = (fromNode.importance + toNode.importance) / 2;
  
  if (avgImportance >= 4) return 3;
  if (avgImportance >= 3) return 2;
  return 1;
} 