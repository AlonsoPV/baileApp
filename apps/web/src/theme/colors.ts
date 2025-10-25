// Sistema de colores moderno para BaileApp
// Paleta inspirada en energía del baile con elegancia minimalista

export const colors = {
  // Colores primarios - Energía y pasión del baile
  primary: {
    50: '#FFF5F5',
    100: '#FFE5E5',
    200: '#FFCCCC',
    300: '#FF9999',
    400: '#FF6666',
    500: '#FF3C38', // Rojo coral principal
    600: '#E63531',
    700: '#CC2E2A',
    800: '#B32723',
    900: '#99201C',
  },
  
  // Colores secundarios - Calidez y vitalidad
  secondary: {
    50: '#FFF8F0',
    100: '#FFF0E0',
    200: '#FFE0C0',
    300: '#FFC080',
    400: '#FFA040',
    500: '#FF9F1C', // Naranja cálido principal
    600: '#E68F19',
    700: '#CC7F16',
    800: '#B36F13',
    900: '#995F10',
  },
  
  // Azul profundo - Elegancia y sofisticación
  deep: {
    50: '#F0F4F7',
    100: '#E0E9F0',
    200: '#C0D3E0',
    300: '#80A7C0',
    400: '#407BA0',
    500: '#003049', // Azul profundo principal
    600: '#002A3F',
    700: '#002435',
    800: '#001F2B',
    900: '#001A21',
  },
  
  // Amarillo suave - Brillos y acentos
  accent: {
    50: '#FFFEF0',
    100: '#FFFDE0',
    200: '#FFFBC0',
    300: '#FFF780',
    400: '#FFF340',
    500: '#FFDD00', // Amarillo suave principal
    600: '#E6C700',
    700: '#CCB100',
    800: '#B39B00',
    900: '#998500',
  },
  
  // Escala de grises moderna
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  
  // Fondos oscuros elegantes
  dark: {
    50: '#1A1A1A',
    100: '#171717',
    200: '#141414',
    300: '#111111',
    400: '#0E0E0E', // Fondo base oscuro
    500: '#0B0B0B',
    600: '#080808',
    700: '#050505',
    800: '#020202',
    900: '#000000',
  },
  
  // Colores semánticos
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Transparencias para glassmorphism
  glass: {
    light: 'rgba(255, 255, 255, 0.1)',
    medium: 'rgba(255, 255, 255, 0.2)',
    strong: 'rgba(255, 255, 255, 0.3)',
    dark: 'rgba(0, 0, 0, 0.1)',
    darker: 'rgba(0, 0, 0, 0.2)',
  },
  
  // Gradientes predefinidos
  gradients: {
    primary: 'linear-gradient(135deg, #FF3C38 0%, #FF9F1C 100%)',
    secondary: 'linear-gradient(135deg, #FF9F1C 0%, #FFDD00 100%)',
    deep: 'linear-gradient(135deg, #003049 0%, #1E3A8A 100%)',
    glass: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
    dark: 'linear-gradient(135deg, #0E0E0E 0%, #1A1A1A 100%)',
    warm: 'linear-gradient(135deg, #FF3C38 0%, #FF9F1C 50%, #FFDD00 100%)',
  },
  
  // Sombras predefinidas
  shadows: {
    sm: '0 2px 4px rgba(0, 0, 0, 0.1)',
    md: '0 4px 8px rgba(0, 0, 0, 0.15)',
    lg: '0 8px 16px rgba(0, 0, 0, 0.2)',
    xl: '0 16px 32px rgba(0, 0, 0, 0.25)',
    glow: '0 0 20px rgba(255, 60, 56, 0.3)',
    glass: '0 8px 32px rgba(0, 0, 0, 0.3)',
  },
  
  // Propiedades básicas para compatibilidad
  light: '#FFFFFF',
  dark: '#0E0E0E',
  blue: '#1E88E5',
  coral: '#FF3D57',
  orange: '#FF8C42',
  yellow: '#FFD166',
};

// Tipografía moderna
export const typography = {
  fontFamily: {
    primary: '"Poppins", "Inter", system-ui, sans-serif',
    secondary: '"Inter", system-ui, sans-serif',
  },
  
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
  },
  
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
};

// Espaciado consistente
export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
};

// Bordes redondeados
export const borderRadius = {
  none: '0',
  sm: '0.25rem',   // 4px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  '2xl': '1.5rem', // 24px
  '3xl': '2rem',   // 32px
  full: '9999px',
};

// Transiciones suaves
export const transitions = {
  fast: '0.15s ease-in-out',
  normal: '0.3s ease-in-out',
  slow: '0.5s ease-in-out',
  bounce: '0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  transitions,
};

// Export theme object for backward compatibility
export const theme = {
  // Background colors
  bg: {
    app: `linear-gradient(135deg, ${colors.dark[400]} 0%, ${colors.dark[300]} 100%)`,
    card: colors.glass.light,
    surface: colors.glass.medium,
  },
  
  // Text colors
  text: {
    primary: colors.light,
    secondary: colors.gray[300],
    muted: colors.gray[500],
  },
  
  // Brand colors
  brand: {
    primary: colors.gradients.primary,
    secondary: colors.gradients.secondary,
  },
  
  // Palette colors
  palette: {
    gray3: colors.glass.medium,
    blue: colors.blue,
    coral: colors.coral,
    orange: colors.orange,
  },
  
  // Spacing
  spacing: (value: number) => spacing[value] || `${value * 0.25}rem`,
  
  // Border radius
  radius: {
    sm: borderRadius.sm,
    md: borderRadius.md,
    lg: borderRadius.lg,
    xl: borderRadius['2xl'],
  },
};

export type Theme = typeof theme;