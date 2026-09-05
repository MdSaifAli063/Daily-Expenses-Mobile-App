/**
 * Design system color tokens for Daily Expenses / Shop Ledger App
 * Matches the warm, clean expense/shop ledger notebook aesthetic.
 */

export const Colors = {
  // Screen background: light warm pale greenish cream
  background: '#F4F6F0',
  backgroundSecondary: '#FFFFFF',

  // Subtle horizontal ruled ledger line
  ledgerLine: 'rgba(40, 75, 62, 0.05)',
  ledgerLineOpaque: '#E4E9E0',

  // Typography
  primaryText: '#15211B',     // Strong dark charcoal / almost black
  secondaryText: '#66786F',   // Muted gray-green
  brandTeal: '#4A6D5E',       // Muted teal/green for category tracking
  requiredAsterisk: '#35594C', // Subtle dark green for required marker

  // Action / Accent
  accentGreen: '#234739',     // Dark muted green / teal-green for buttons and active links
  accentGreenPressed: '#1B372C',

  // Form Inputs & Paper Cards
  inputBackground: '#FFFFFF',
  inputBorder: '#D7DFD6',
  inputBorderFocused: '#8FAAA0',
  inputBorderError: '#D47A7A',
  inputText: '#15211B',
  inputPlaceholder: '#A0AEA6',

  // Cards & Ledger Elements
  cardBackground: '#FFFFFF',
  cardBorder: '#E6ECE4',
  cardShadow: 'rgba(21, 33, 27, 0.04)',
  cardDivider: '#EDF1EB',

  // Summary Metrics
  collectionGreen: '#234739',
  expenseRed: '#B83232',
  profitGreen: '#234739',

  // Navigation
  navBackground: '#FFFFFF',
  navBorder: '#E2E7DF',
  navActive: '#234739',
  navInactive: '#8A9B92',

  // Feedback / Validation
  errorText: '#B83232',

  // Icons
  iconMuted: '#74887E',

  // Warm Shop Ledger Palette
  terracotta: '#C84B31',
  parchment: '#FAF5EB',
  ledgerBrown: '#2D241E',
  warmGray: '#8C7B6E',
  emeraldGreen: '#2E7D32',
} as const;

export type ColorKeys = keyof typeof Colors;
