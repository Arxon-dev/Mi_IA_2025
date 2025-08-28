/**
 * Servicio para implementar la taxonomía de Bloom en la generación de preguntas
 * Permite crear preguntas que evalúen diferentes niveles cognitivos
 */

export enum BloomLevel {
  RECORDAR = 'recordar',
  COMPRENDER = 'comprender',
  APLICAR = 'aplicar',
  ANALIZAR = 'analizar',
  EVALUAR = 'evaluar',
  CREAR = 'crear'
}

export interface BloomLevelConfig {
  id: BloomLevel;
  name: string;
  description: string;
  percentage: number;
  keywords: string[];
  enabled: boolean;
  instruccion?: string;
  ejemploFormato?: string;
}

// Interfaz para representar los niveles de Bloom en la UI
export interface BloomLevelUI {
  id: string;
  name: string;
  color: string;
  description: string;
  keywords: string[];
  percentage: number;
  enabled: boolean;
}

export const bloomLevels: BloomLevelConfig[] = [
  {
    id: BloomLevel.RECORDAR,
    name: 'Recordar',
    description: 'Reconocer y recordar información específica',
    percentage: 10,
    keywords: ['definir', 'identificar', 'listar', 'nombrar', 'reconocer', 'recordar', 'repetir'],
    enabled: true,
    instruccion: "Genera preguntas que evalúen la capacidad de recordar información específica del texto legal, como definiciones exactas, plazos concretos o enumeraciones de requisitos establecidos explícitamente en la normativa.",
    ejemploFormato: "Según el artículo X de la Ley Y, ¿cuál es la definición exacta de...?"
  },
  {
    id: BloomLevel.COMPRENDER,
    name: 'Comprender',
    description: 'Entender e interpretar información',
    percentage: 15,
    keywords: ['clasificar', 'describir', 'explicar', 'identificar', 'interpretar', 'parafrasear', 'resumir'],
    enabled: true,
    instruccion: "Crea preguntas que evalúen la comprensión del significado de los conceptos y disposiciones legales, requiriendo que el estudiante pueda explicar ideas o conceptos con sus propias palabras e interpretar correctamente el texto normativo.",
    ejemploFormato: "¿Cuál de las siguientes interpretaciones del artículo X es correcta respecto a...?"
  },
  {
    id: BloomLevel.APLICAR,
    name: 'Aplicar',
    description: 'Usar la información en situaciones nuevas',
    percentage: 25,
    keywords: ['aplicar', 'calcular', 'demostrar', 'implementar', 'resolver', 'usar', 'utilizar'],
    enabled: true,
    instruccion: "Desarrolla preguntas basadas en casos prácticos donde se deba aplicar correctamente la normativa a situaciones concretas, identificando la solución adecuada según lo establecido en la ley.",
    ejemploFormato: "En el siguiente caso: [descripción del caso], ¿cómo debe aplicarse correctamente el artículo X?"
  },
  {
    id: BloomLevel.ANALIZAR,
    name: 'Analizar',
    description: 'Examinar y descomponer información',
    percentage: 25,
    keywords: ['analizar', 'comparar', 'contrastar', 'diferenciar', 'distinguir', 'examinar', 'relacionar'],
    enabled: true,
    instruccion: "Elabora preguntas que requieran analizar relaciones entre diferentes disposiciones normativas, identificar principios subyacentes o examinar la estructura lógica de argumentos jurídicos complejos.",
    ejemploFormato: "¿Qué relación existe entre lo establecido en el artículo X y las disposiciones del artículo Y respecto a...?"
  },
  {
    id: BloomLevel.EVALUAR,
    name: 'Evaluar',
    description: 'Juzgar el valor de la información',
    percentage: 15,
    keywords: ['argumentar', 'concluir', 'criticar', 'decidir', 'evaluar', 'justificar', 'valorar'],
    enabled: true,
    instruccion: "Crea preguntas que requieran valorar soluciones, argumentos o interpretaciones jurídicas, determinando su corrección, coherencia o adecuación conforme a criterios normativos establecidos.",
    ejemploFormato: "¿Cuál de las siguientes interpretaciones del artículo X es jurídicamente más correcta y por qué?"
  },
  {
    id: BloomLevel.CREAR,
    name: 'Crear',
    description: 'Generar nuevas ideas o perspectivas',
    percentage: 10,
    keywords: ['construir', 'crear', 'desarrollar', 'diseñar', 'formular', 'planificar', 'proponer'],
    enabled: true,
    instruccion: "Diseña preguntas donde se deba proponer soluciones originales a problemas complejos, integrando múltiples disposiciones normativas o desarrollando estrategias procedimentales basadas en la legislación.",
    ejemploFormato: "Ante la siguiente situación [descripción de un caso complejo], ¿qué estrategia legal sería más adecuada considerando los artículos X, Y y Z?"
  }
];

/**
 * Obtiene las instrucciones para generar preguntas según los niveles cognitivos seleccionados
 * @param selectedLevels Lista de niveles cognitivos seleccionados
 * @returns Instrucciones formateadas para el prompt
 */
export function getBloomInstructions(selectedLevels: BloomLevel[] | BloomLevelUI[]): string {
  if (!selectedLevels || selectedLevels.length === 0) {
    // Si no hay niveles seleccionados, usar una distribución por defecto
    return getBloomInstructions([
      BloomLevel.RECORDAR,
      BloomLevel.COMPRENDER,
      BloomLevel.APLICAR, 
      BloomLevel.ANALIZAR
    ]);
  }

  // Determinar si estamos recibiendo BloomLevel o BloomLevelUI
  const isUsingUI = typeof selectedLevels[0] === 'object';

  let nivelesSeleccionados: BloomLevelConfig[];
  
  if (isUsingUI) {
    // Si estamos recibiendo BloomLevelUI, convertir los IDs a BloomLevel
    const uiLevels = selectedLevels as BloomLevelUI[];
    const enabledLevels = uiLevels.filter(level => level.enabled);
    
    // Mapear IDs de UI a IDs de enum BloomLevel
    const idMap: {[key: string]: BloomLevel} = {
      'recordar': BloomLevel.RECORDAR,
      'comprender': BloomLevel.COMPRENDER,
      'aplicar': BloomLevel.APLICAR,
      'analizar': BloomLevel.ANALIZAR,
      'evaluar': BloomLevel.EVALUAR,
      'crear': BloomLevel.CREAR
    };
    
    // Filtrar los niveles configurados según los habilitados en la UI
    nivelesSeleccionados = bloomLevels.filter(level => 
      enabledLevels.some(uiLevel => idMap[uiLevel.id] === level.id)
    );
    
    // Actualizar porcentajes según la configuración de UI
    nivelesSeleccionados = nivelesSeleccionados.map(level => {
      const uiLevel = enabledLevels.find(ui => idMap[ui.id] === level.id);
      return {
        ...level,
        percentage: uiLevel ? uiLevel.percentage : level.percentage
      };
    });
  } else {
    // Si estamos recibiendo directamente BloomLevel, filtrar como antes
    nivelesSeleccionados = bloomLevels.filter(level => 
      (selectedLevels as BloomLevel[]).includes(level.id)
    );
  }
  
  let instrucciones = "**DISTRIBUCIÓN POR NIVELES COGNITIVOS (TAXONOMÍA DE BLOOM)**\n\n";
  instrucciones += "Las preguntas generadas deben distribuirse entre los siguientes niveles cognitivos:\n\n";

  nivelesSeleccionados.forEach(nivel => {
    instrucciones += `**Nivel: ${nivel.name} (${nivel.percentage}%)**\n`;
    instrucciones += `${nivel.description}\n`;
    if (nivel.instruccion) {
      instrucciones += `**Instrucción**: ${nivel.instruccion}\n`;
    }
    instrucciones += `**Verbos clave**: ${nivel.keywords.join(', ')}\n`;
    if (nivel.ejemploFormato) {
      instrucciones += `**Ejemplo**: ${nivel.ejemploFormato}\n`;
    }
    instrucciones += '\n';
  });

  return instrucciones;
}

/**
 * Genera ejemplos de preguntas según los niveles cognitivos seleccionados
 * @param selectedLevels Lista de niveles cognitivos seleccionados
 * @returns Ejemplos de preguntas para cada nivel cognitivo
 */
export function getBloomExamples(selectedLevels: BloomLevel[]): string[] {
  if (!selectedLevels || selectedLevels.length === 0) {
    selectedLevels = Object.values(BloomLevel);
  }

  return bloomLevels
    .filter(level => selectedLevels.includes(level.id))
    .map(level => level.ejemploFormato || '')
    .filter(ejemplo => ejemplo !== '');
}

/**
 * Valida la distribución de porcentajes entre los niveles seleccionados
 * @param selectedLevels Lista de niveles cognitivos seleccionados
 * @returns Verdadero si la distribución es válida
 */
export function validateBloomDistribution(selectedLevels: BloomLevel[]): boolean {
  if (!selectedLevels || selectedLevels.length === 0) {
    return false;
  }

  const total = bloomLevels
    .filter(level => selectedLevels.includes(level.id))
    .reduce((sum, level) => sum + level.percentage, 0);

  // Permitir un pequeño margen de error
  return total >= 95 && total <= 105;
} 