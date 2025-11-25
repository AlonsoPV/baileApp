import { Dimensions, Platform } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const colors = {
  primary: {
    100: "#FFE4F7",
    400: "#FF7EDB",
    600: "#F72585",
    700: "#B5179E",
  },
  secondary: {
    100: "#E0FBFF",
    400: "#48CAE4",
    600: "#0096C7",
  },
  gray: {
    100: "#E5E7EB",
    200: "#D1D5DB",
    400: "#9CA3AF",
  },
  background: "#020617",
  surface: "#0B1120",
  text: "#E5E7EB",
  textSecondary: "#9CA3AF",
  overlay: "rgba(15,23,42,0.75)",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
  },
  weights: {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },
};

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  full: 9999,
};

export const layout = {
  // Un poco más alto en iOS para dejar margen cómodo con la barra de estado
  headerHeight: Platform.OS === "ios" ? 112 : 72,
  menuWidth: Math.min(SCREEN_WIDTH * 0.8, 320),
};

const baseShadow = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.2,
  shadowRadius: 6,
  elevation: 4,
};

export const shadows = {
  sm: {
    ...baseShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  md: baseShadow,
  xl: {
    ...baseShadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
};


