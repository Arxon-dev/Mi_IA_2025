import { configureStore } from '@reduxjs/toolkit';

// Importa tus reducers aquí.
import questionReducer from './features/questions/questionSlice';
import viewModeReducer from './features/viewMode/viewModeSlice';

// Por ahora, dejaremos un rootReducer vacío como placeholder
// Deberás añadir tus reducers reales más adelante.
const rootReducer = {
  questions: questionReducer,
  viewMode: viewModeReducer,
  // ...otros reducers
};

export const store = configureStore({
  reducer: rootReducer,
  // Opciones adicionales del store si las necesitas (middleware, devTools, etc.)
});

// Inferir los tipos `RootState` y `AppDispatch` del propio store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Opcional: Exportar hooks tipados para usarlos en lugar de `useDispatch` y `useSelector` planos
import { TypedUseSelectorHook, useDispatch as useReduxDispatch, useSelector as useReduxSelector } from 'react-redux';
export const useDispatch: () => AppDispatch = useReduxDispatch;
export const useSelector: TypedUseSelectorHook<RootState> = useReduxSelector;

// NOTA: Necesitarás crear los slices/reducers para 'questions' y 'viewMode'
// (o los que uses realmente) y luego importarlos y añadirlos a rootReducer. 