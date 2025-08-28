import { createTheme, Theme } from '@mui/material/styles';
import { Roboto } from 'next/font/google';

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
});

// Paleta de colores minimalista
const colors = {
  light: {
    primary: '#6366f1',      // indigo-500
    secondary: '#8b5cf6',    // violet-500
    background: '#ffffff',
    surface: '#ffffff',
    surfaceVariant: '#f8fafc', // gray-50
    outline: '#e2e8f0',      // gray-200
    outlineVariant: '#f1f5f9', // gray-100
    onSurface: '#0f172a',    // gray-900
    onSurfaceVariant: '#475569', // gray-600
    onBackground: '#0f172a',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  },
  dark: {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    background: '#0f172a',   // gray-900
    surface: '#1e293b',      // gray-800
    surfaceVariant: '#334155', // gray-700
    outline: '#475569',      // gray-600
    outlineVariant: '#334155', // gray-700
    onSurface: '#f8fafc',    // gray-50
    onSurfaceVariant: '#94a3b8', // gray-400
    onBackground: '#f8fafc',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  },
};

// Función para crear el tema base
const createCustomTheme = (mode: 'light' | 'dark'): Theme => {
  const palette = colors[mode];

  return createTheme({
    palette: {
      mode,
      primary: {
        main: palette.primary,
        contrastText: '#ffffff',
      },
      secondary: {
        main: palette.secondary,
        contrastText: '#ffffff',
      },
      background: {
        default: palette.background,
        paper: palette.surface,
      },
      surface: {
        main: palette.surface,
      },
      text: {
        primary: palette.onSurface,
        secondary: palette.onSurfaceVariant,
      },
      divider: palette.outline,
      error: {
        main: palette.error,
        contrastText: '#ffffff',
      },
      warning: {
        main: palette.warning,
        contrastText: '#ffffff',
      },
      success: {
        main: palette.success,
        contrastText: '#ffffff',
      },
      grey: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a',
      },
    },
    typography: {
      fontFamily: roboto.style.fontFamily,
      h1: {
        fontSize: '2.25rem',
        fontWeight: 700,
        lineHeight: 1.2,
        color: palette.onSurface,
      },
      h2: {
        fontSize: '1.875rem',
        fontWeight: 600,
        lineHeight: 1.3,
        color: palette.onSurface,
      },
      h3: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.4,
        color: palette.onSurface,
      },
      h4: {
        fontSize: '1.25rem',
        fontWeight: 600,
        lineHeight: 1.4,
        color: palette.onSurface,
      },
      h5: {
        fontSize: '1.125rem',
        fontWeight: 500,
        lineHeight: 1.5,
        color: palette.onSurface,
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 500,
        lineHeight: 1.5,
        color: palette.onSurface,
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.5,
        color: palette.onSurface,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.4,
        color: palette.onSurfaceVariant,
      },
      button: {
        fontSize: '0.875rem',
        fontWeight: 500,
        textTransform: 'none',
      },
      caption: {
        fontSize: '0.75rem',
        lineHeight: 1.3,
        color: palette.onSurfaceVariant,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarWidth: 'thin',
            '&::-webkit-scrollbar': {
              width: '6px',
              height: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: palette.outline,
              borderRadius: '10px',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: '0.75rem',
            fontWeight: 500,
            fontSize: '0.875rem',
            padding: '0.625rem 1rem',
            textTransform: 'none',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
          contained: {
            backgroundColor: palette.primary,
            color: '#ffffff',
            '&:hover': {
              backgroundColor: palette.primary,
              opacity: 0.9,
            },
          },
          outlined: {
            borderColor: palette.outline,
            color: palette.onSurface,
            '&:hover': {
              backgroundColor: palette.surfaceVariant,
              borderColor: palette.outline,
            },
          },
          text: {
            color: palette.onSurface,
            '&:hover': {
              backgroundColor: palette.surfaceVariant,
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '1rem',
            border: `1px solid ${palette.outline}`,
            boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
            backgroundColor: palette.surface,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: palette.surface,
            backgroundImage: 'none',
          },
          elevation1: {
            boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
          },
          elevation2: {
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
          },
          elevation3: {
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: '0.75rem',
              backgroundColor: palette.background,
              '& fieldset': {
                borderColor: palette.outline,
              },
              '&:hover fieldset': {
                borderColor: palette.outline,
              },
              '&.Mui-focused fieldset': {
                borderColor: palette.primary,
                borderWidth: '2px',
              },
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: {
            borderRadius: '0.75rem',
            backgroundColor: palette.background,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: '1.5rem',
            fontSize: '0.75rem',
            fontWeight: 500,
          },
          filled: {
            backgroundColor: palette.surfaceVariant,
            color: palette.onSurface,
          },
          outlined: {
            borderColor: palette.outline,
            color: palette.onSurface,
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: palette.surface,
            color: palette.onSurface,
            border: `1px solid ${palette.outline}`,
            borderRadius: '0.5rem',
            fontSize: '0.75rem',
            fontWeight: 500,
            padding: '0.5rem 0.75rem',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          },
          arrow: {
            color: palette.surface,
            '&::before': {
              border: `1px solid ${palette.outline}`,
            },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: '1rem',
            border: `1px solid ${palette.outline}`,
          },
        },
      },
      MuiPopover: {
        styleOverrides: {
          paper: {
            borderRadius: '0.75rem',
            border: `1px solid ${palette.outline}`,
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: '0.75rem',
            border: `1px solid ${palette.outline}`,
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            borderRadius: '0.5rem',
            margin: '0.125rem 0.5rem',
            fontSize: '0.875rem',
            '&:hover': {
              backgroundColor: palette.surfaceVariant,
            },
            '&.Mui-selected': {
              backgroundColor: palette.surfaceVariant,
              '&:hover': {
                backgroundColor: palette.surfaceVariant,
              },
            },
          },
        },
      },
      MuiList: {
        styleOverrides: {
          root: {
            padding: '0.5rem',
          },
        },
      },
      MuiListItem: {
        styleOverrides: {
          root: {
            borderRadius: '0.5rem',
            margin: '0.125rem 0',
            '&:hover': {
              backgroundColor: palette.surfaceVariant,
            },
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          root: {
            width: 42,
            height: 26,
            padding: 0,
            '& .MuiSwitch-switchBase': {
              padding: 0,
              margin: 2,
              transitionDuration: '300ms',
              '&.Mui-checked': {
                transform: 'translateX(16px)',
                color: '#fff',
                '& + .MuiSwitch-track': {
                  backgroundColor: palette.primary,
                  opacity: 1,
                  border: 0,
                },
              },
            },
            '& .MuiSwitch-thumb': {
              boxSizing: 'border-box',
              width: 22,
              height: 22,
            },
            '& .MuiSwitch-track': {
              borderRadius: 26 / 2,
              backgroundColor: palette.outline,
              opacity: 1,
            },
          },
        },
      },
      MuiCircularProgress: {
        styleOverrides: {
          root: {
            color: palette.primary,
          },
        },
      },
    },
  });
};

// Temas light y dark
export const lightTheme = createCustomTheme('light');
export const darkTheme = createCustomTheme('dark');

// Hook para tipos customizados de MUI
declare module '@mui/material/styles' {
  interface Palette {
    surface: Palette['primary'];
  }

  interface PaletteOptions {
    surface?: PaletteOptions['primary'];
  }
} 