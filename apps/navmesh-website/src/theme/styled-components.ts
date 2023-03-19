export const theme = {
  colors: {
    bg: '#333',
    fg: '#fff',
    primary: '#008DD5',
  }
} as const;

type CustomTheme = typeof theme;

declare module 'styled-components' {
  export interface DefaultTheme extends CustomTheme {}
}
