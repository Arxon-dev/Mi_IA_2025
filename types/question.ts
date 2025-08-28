// Contenido inicial para types/question.ts

export interface QuestionOption {
    text: string;
    isCorrect: boolean;
    feedback?: string; 
}
  
export interface GeneratedQuestion {
    id: string; // uuid
    name: string; // Título de la pregunta, puede ser generado o editable
    text: string; // El cuerpo completo de la pregunta en formato GIFT
    type: 'MC' | 'TF' | 'ShortAnswer' | 'Numerical' | 'Essay' | 'Description' | 'Matching' | string; // Tipo de pregunta GIFT, string para flexibilidad
    options?: QuestionOption[];
    answer?: string | number | { [key: string]: string }; // Para diferentes tipos de respuesta
    // Cualquier otro campo que necesites para representar la pregunta internamente
} 