import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GeneratedQuestion } from '@/types/question'; // Asegúrate que la ruta a tus tipos es correcta

interface QuestionsState {
  generatedQuestions: GeneratedQuestion[];
  // Otros estados relacionados con preguntas si los tienes, ej: isLoading, error
}

const initialState: QuestionsState = {
  generatedQuestions: [],
};

export const questionSlice = createSlice({
  name: 'questions',
  initialState,
  reducers: {
    setQuestions: (state, action: PayloadAction<GeneratedQuestion[]>) => {
      state.generatedQuestions = action.payload;
    },
    addQuestion: (state, action: PayloadAction<GeneratedQuestion>) => {
      state.generatedQuestions.push(action.payload);
    },
    removeQuestion: (state, action: PayloadAction<string>) => { // Asume que el payload es el ID de la pregunta
      state.generatedQuestions = state.generatedQuestions.filter(q => q.id !== action.payload);
    },
    updateQuestionText: (state, action: PayloadAction<{ id: string; text: string }>) => {
      const question = state.generatedQuestions.find(q => q.id === action.payload.id);
      if (question) {
        question.text = action.payload.text;
      }
    },
    updateQuestionName: (state, action: PayloadAction<{ id: string; name: string }>) => {
      const question = state.generatedQuestions.find(q => q.id === action.payload.id);
      if (question) {
        question.name = action.payload.name;
      }
    },
    clearQuestions: (state) => {
      state.generatedQuestions = [];
    },
    // ...puedes añadir más acciones/reducers aquí según necesites
  },
});

// Exportar acciones
export const {
  setQuestions,
  addQuestion,
  removeQuestion,
  updateQuestionText,
  updateQuestionName,
  clearQuestions,
} = questionSlice.actions;

// Exportar el reducer
export default questionSlice.reducer; 