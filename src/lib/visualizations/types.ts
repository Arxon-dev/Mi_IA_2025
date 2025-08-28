// Tipos principales para el sistema de visualizaciones
export type VisualizationType = 'FLOWCHART' | 'CONCEPT_MAP' | 'HIERARCHICAL_SCHEME' | 'MIND_MAP';

export type DocumentAnalysisType = 'PROCESS' | 'CONCEPT' | 'STRUCTURE' | 'RELATIONSHIP';

export interface DocumentSegment {
  id: string;
  type: 'paragraph' | 'list' | 'heading' | 'definition';
  content: string;
  level?: number;
  keywords?: string[];
  entities?: Entity[];
  relationships?: Relationship[];
}

export interface Entity {
  text: string;
  type: 'person' | 'organization' | 'concept' | 'process' | 'action' | 'condition' | 'legal_concept' | 'function';
  confidence: number;
  position?: {
    start: number;
    end: number;
  };
  category?: string;
  context?: {
    description?: string;
    functions?: string[];
    dependencies?: string[];
    responsibilities?: string[];
    normativeFramework?: string[];
    organizationalLevel?: string;
    hierarchicalPosition?: string;
    legalBasis?: string[];
    applications?: string[];
    steps?: string[];
    requirements?: string[];
  };
}

export interface Relationship {
  source: string;
  target: string;
  type: 'causes' | 'includes' | 'follows' | 'defines' | 'relates_to' | 'part_of';
  confidence: number;
  context?: string;
}

export interface FlowchartNode {
  id: string;
  type: 'start' | 'process' | 'decision' | 'end' | 'connector';
  label: string;
  description?: string;
  position?: { x: number; y: number };
}

export interface FlowchartEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  condition?: string;
}

export interface ConceptNode {
  id: string;
  label: string;
  type: 'main' | 'secondary' | 'detail';
  description?: string;
  importance: number;
  position?: { x: number; y: number };
  color?: string;
  size?: number;
}

export interface ConceptLink {
  id: string;
  source: string;
  target: string;
  relationship: string;
  strength: number;
  label?: string;
}

export interface HierarchyNode {
  id: string;
  label: string;
  level: number;
  parent?: string;
  children?: string[];
  description?: string;
  order: number;
}

export interface VisualizationData {
  type: VisualizationType;
  nodes: (FlowchartNode | ConceptNode | HierarchyNode)[];
  edges?: (FlowchartEdge | ConceptLink)[];
  metadata: {
    title: string;
    description?: string;
    generatedAt: Date;
    documentId: string;
    complexity: number;
    confidence: number;
  };
}

export interface DocumentAnalysisResult {
  documentId: string;
  segments: DocumentSegment[];
  entities: Entity[];
  relationships: Relationship[];
  patterns: {
    hasProcesses: boolean;
    hasConcepts: boolean;
    hasHierarchy: boolean;
    hasComparisons: boolean;
  };
  recommendedVisualizations: VisualizationType[];
  confidence: number;
} 