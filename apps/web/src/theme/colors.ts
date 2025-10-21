export const palette = {
  red: "#E53935",
  orange: "#FB8C00",
  blue: "#1E88E5",
  yellow: "#FDD835",
  ink: "#0E0E10",
  gray1: "#111318",
  gray2: "#1C1F26",
  gray3: "#2A2F3A",
  gray4: "#4A5568",
  white: "#FFFFFF",
  overlay: "#00000080"
};

export const theme = {
  palette,
  bg: {
    app: palette.gray1,
    card: palette.gray2,
    surface: palette.gray3
  },
  text: {
    primary: palette.white,
    secondary: "#D6D8DE",
    muted: "#A0AEC0"
  },
  brand: {
    primary: palette.red,
    accent1: palette.orange,
    accent2: palette.blue,
    accent3: palette.yellow
  },
  radius: { sm: 10, md: 16, lg: 20, xl: 28 },
  spacing: (n: number) => 8 * n
};

