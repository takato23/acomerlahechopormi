import tokens from '../../design-tokens.js';

export const theme = {
  colors: tokens.colors,
  spacing: tokens.spacing,
  radii: tokens.radii,
  maxWidth: tokens.maxWidth,
} as const;

export type ThemeConfig = typeof theme;

export type ColorToken = keyof ThemeConfig['colors'];
export type SpacingToken = keyof ThemeConfig['spacing'];

export const getColorToken = (token: ColorToken) => theme.colors[token];
export const getSpacingToken = (token: SpacingToken) => theme.spacing[token];

export const designTokens = theme;
