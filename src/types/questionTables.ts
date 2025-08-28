// 📋 Tipos para el Selector de Tablas de Preguntas

export type QuestionTableName = 
  | 'SectionQuestion'
  | 'Constitucion'
  | 'DefensaNacional'
  | 'Rio'
  | 'Minsdef'
  | 'OrganizacionFas'
  | 'Emad'
  | 'Et'
  | 'Armada'
  | 'Aire'
  | 'Carrera'
  | 'Tropa'
  | 'Rroo'
  | 'DerechosYDeberes'
  | 'RegimenDisciplinario'
  | 'IniciativasQuejas'
  | 'Igualdad'
  | 'Omi'
  | 'Pac'
  | 'SeguridadNacional'
  | 'Pdc'
  | 'Onu'
  | 'Otan'
  | 'Osce'
  | 'Ue'
  | 'MisionesInternacionales';

export interface QuestionTableOption {
  id: QuestionTableName;
  name: string;
  description: string;
  category: string;
  icon?: string;
  isDefault?: boolean;
}

export interface QuestionGenerationRequest {
  sectionId: string;
  targetTable: QuestionTableName;
  promptConfig?: {
    questionCount?: number;
    difficulty?: string;
    bloomLevel?: string;
  };
}

// 🎯 Configuración de tablas disponibles
export const QUESTION_TABLES: QuestionTableOption[] = [
  {
    id: 'SectionQuestion',
    name: 'Preguntas por Sección (Por defecto)',
    description: 'Tabla estándar para preguntas generadas por sección',
    category: 'General',
    icon: '📝',
    isDefault: true
  },
  // 🏛️ Institucionales y Constitucionales
  {
    id: 'Constitucion',
    name: 'Constitución Española',
    description: 'Preguntas sobre la Constitución Española',
    category: 'Institucional',
    icon: '🏛️'
  },
  {
    id: 'DefensaNacional',
    name: 'Defensa Nacional',
    description: 'Temas de Defensa Nacional',
    category: 'Institucional',
    icon: '🛡️'
  },
  {
    id: 'Minsdef',
    name: 'Ministerio de Defensa',
    description: 'Organización y competencias del Ministerio de Defensa',
    category: 'Institucional',
    icon: '🏢'
  },
  
  // 🎖️ Organización de las FAS
  {
    id: 'OrganizacionFas',
    name: 'Organización de las FAS',
    description: 'Estructura y organización de las Fuerzas Armadas',
    category: 'Organización FAS',
    icon: '🎖️'
  },
  {
    id: 'Emad',
    name: 'Estado Mayor de la Defensa',
    description: 'Estructura y funciones del EMAD',
    category: 'Organización FAS',
    icon: '⭐'
  },
  {
    id: 'Et',
    name: 'Ejército de Tierra',
    description: 'Organización del Ejército de Tierra',
    category: 'Organización FAS',
    icon: '🏕️'
  },
  {
    id: 'Armada',
    name: 'Armada Española',
    description: 'Organización de la Armada Española',
    category: 'Organización FAS',
    icon: '⚓'
  },
  {
    id: 'Aire',
    name: 'Ejército del Aire y del Espacio',
    description: 'Organización del Ejército del Aire y del Espacio',
    category: 'Organización FAS',
    icon: '✈️'
  },
  
  // 👥 Personal y Carrera Militar
  {
    id: 'Carrera',
    name: 'Carrera Militar',
    description: 'Aspectos de la carrera militar',
    category: 'Personal Militar',
    icon: '📈'
  },
  {
    id: 'Tropa',
    name: 'Personal de Tropa',
    description: 'Normativa específica del personal de tropa',
    category: 'Personal Militar',
    icon: '👥'
  },
  {
    id: 'Rroo',
    name: 'Reales Ordenanzas',
    description: 'Reales Ordenanzas para las Fuerzas Armadas',
    category: 'Personal Militar',
    icon: '📜'
  },
  
  // ⚖️ Derechos y Disciplina
  {
    id: 'DerechosYDeberes',
    name: 'Derechos y Deberes',
    description: 'Derechos y deberes del personal militar',
    category: 'Derechos y Disciplina',
    icon: '⚖️'
  },
  {
    id: 'RegimenDisciplinario',
    name: 'Régimen Disciplinario',
    description: 'Sistema disciplinario militar',
    category: 'Derechos y Disciplina',
    icon: '⚖️'
  },
  {
    id: 'IniciativasQuejas',
    name: 'Iniciativas y Quejas',
    description: 'Procedimientos de iniciativas y quejas',
    category: 'Derechos y Disciplina',
    icon: '📝'
  },
  {
    id: 'Igualdad',
    name: 'Igualdad',
    description: 'Políticas de igualdad en las FAS',
    category: 'Derechos y Disciplina',
    icon: '🤝'
  },
  
  // 🌍 Relaciones Internacionales
  {
    id: 'Rio',
    name: 'Regimen juridico del sector publico',
    description: 'Régimen disciplinario específico para las Fuerzas Armadas',
    category: 'Derechos y Disciplina',
    icon: '⚖️'
  },
  {
    id: 'Omi',
    name: 'Observatorio Militar para la Igualdad',
    description: 'Observatorio militar para la igualdad y políticas inclusivas',
    category: 'Derechos y Disciplina',
    icon: '👁️'
  },
  {
    id: 'Pac',
    name: 'Procedimiento Administrativo Comun',
    description: 'Procedimientos administrativos comunes en las FAS',
    category: 'Institucional',
    icon: '📋'
  },
  {
    id: 'SeguridadNacional',
    name: 'Seguridad Nacional',
    description: 'Estrategia de Seguridad Nacional',
    category: 'Internacional',
    icon: '🔒'
  },
  {
    id: 'Pdc',
    name: 'Doctrina para el empleo de las FAS',
    description: 'Doctrina y principios para el empleo de las Fuerzas Armadas',
    category: 'Organización FAS',
    icon: '📚'
  },
  {
    id: 'Onu',
    name: 'Organización de las Naciones Unidas',
    description: 'ONU y operaciones de mantenimiento de paz',
    category: 'Internacional',
    icon: '🕊️'
  },
  {
    id: 'Otan',
    name: 'Organización del Tratado del Atlántico Norte',
    description: 'OTAN y defensa colectiva',
    category: 'Internacional',
    icon: '🌐'
  },
  {
    id: 'Osce',
    name: 'Organización para la Seguridad y la Cooperación en Europa',
    description: 'OSCE y seguridad europea',
    category: 'Internacional',
    icon: '🇪🇺'
  },
  {
    id: 'Ue',
    name: 'Unión Europea',
    description: 'UE y política común de seguridad y defensa',
    category: 'Internacional',
    icon: '🇪🇺'
  },
  {
    id: 'MisionesInternacionales',
    name: 'Misiones Internacionales',
    description: 'Participación en misiones internacionales',
    category: 'Internacional',
    icon: '🌍'
  }
];

// 📊 Función para obtener opciones por categoría
export const getTablesByCategory = () => {
  const categories = QUESTION_TABLES.reduce((acc, table) => {
    if (!acc[table.category]) {
      acc[table.category] = [];
    }
    acc[table.category].push(table);
    return acc;
  }, {} as Record<string, QuestionTableOption[]>);
  
  return categories;
};

// 🔍 Función para obtener tabla por ID
export const getTableById = (id: QuestionTableName): QuestionTableOption | undefined => {
  return QUESTION_TABLES.find(table => table.id === id);
};

// ✅ Función para validar tabla
export const isValidTableName = (tableName: string): tableName is QuestionTableName => {
  return QUESTION_TABLES.some(table => table.id === tableName);
}; 