import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ViewMode = 'view' | 'edit'; // O los modos que realmente uses

interface ViewModeState {
  mode: ViewMode;
}

const initialState: ViewModeState = {
  mode: 'view', // O tu modo inicial por defecto
};

export const viewModeSlice = createSlice({
  name: 'viewMode',
  initialState,
  reducers: {
    setViewMode: (state, action: PayloadAction<ViewMode>) => {
      state.mode = action.payload;
    },
  },
});

export const { setViewMode } = viewModeSlice.actions;

export default viewModeSlice.reducer; 