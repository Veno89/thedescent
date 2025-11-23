/**
 * Unified Design System for The Descent
 * Provides consistent colors, typography, spacing, and visual styles
 */

export const Theme: any = {
  // Color Palette
  colors: {
    // Primary colors
    primary: '#8b0000',        // Dark red (main theme)
    primaryLight: '#ff4444',   // Bright red (highlights)
    primaryDark: '#4a0000',    // Very dark red (shadows)

    // Accent colors
    gold: '#ffd700',           // Gold (valuable items, headings)
    goldDark: '#cc9900',       // Dark gold (shadows)

    // Status colors
    success: '#228b22',        // Green (healing, positive)
    successLight: '#00ff00',   // Bright green (highlights)
    danger: '#ff0000',         // Red (damage, errors)
    warning: '#ffaa00',        // Orange (warnings)
    info: '#4a9eff',           // Blue (info, special)

    // Card type colors
    attack: '#8b0000',         // Dark red
    skill: '#006400',          // Dark green
    power: '#00008b',          // Dark blue
    curse: '#4a0080',          // Purple
    status: '#808080',         // Gray

    // Room type colors
    combat: '#4a1a1a',         // Dark red
    elite: '#8b0000',          // Bright red
    boss: '#ff0000',           // Deep red
    rest: '#228b22',           // Green
    merchant: '#ffd700',       // Gold
    treasure: '#4169e1',       // Blue
    event: '#8b008b',          // Purple

    // Rarity colors
    common: '#cccccc',         // Gray
    uncommon: '#4169e1',       // Blue
    rare: '#ffd700',           // Gold
    legendary: '#ff4444',      // Red/orange
    boss_relic: '#8b008b',     // Purple

    // UI colors
    background: '#0a0a0a',     // Very dark (scene backgrounds)
    backgroundLight: '#1a1a2e', // Dark blue-gray (panels)
    backgroundDark: '#000000', // Pure black (overlays)

    border: '#333333',         // Dark gray (default borders)
    borderLight: '#666666',    // Medium gray (hover borders)
    borderHighlight: '#ffd700', // Gold (selected/active)

    text: '#ffffff',           // White (primary text)
    textSecondary: '#cccccc',  // Light gray (secondary text)
    textMuted: '#888888',      // Medium gray (disabled text)
    textDark: '#333333',       // Dark gray (on light backgrounds)

    // Interactive states
    hover: '#ffd700',          // Gold
    active: '#ffaa00',         // Orange
    disabled: '#444444',       // Dark gray

    // Overlays
    overlay: 0x000000,         // Black (for alpha overlays)
    overlayAlpha: 0.7,         // 70% opacity
  },

  // Typography
  typography: {
    fontFamily: 'monospace',

    // Font sizes (hierarchical scale)
    fontSize: {
      title: 72,       // Scene titles
      heading1: 48,    // Major headings
      heading2: 36,    // Section headings
      heading3: 28,    // Sub-section headings
      large: 24,       // Large text
      body: 20,        // Default body text
      medium: 18,      // Medium text
      small: 16,       // Small text
      tiny: 14,        // Tiny text
      micro: 12,       // Micro text (counters, labels)
    },

    // Text styles (pre-configured)
    styles: {
      title: {
        fontFamily: 'monospace',
        fontSize: '72px',
        color: '#8b0000',
        fontStyle: 'bold',
      },
      heading1: {
        fontFamily: 'monospace',
        fontSize: '48px',
        color: '#ffd700',
        fontStyle: 'bold',
      },
      heading2: {
        fontFamily: 'monospace',
        fontSize: '36px',
        color: '#ffffff',
        fontStyle: 'bold',
      },
      heading3: {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#cccccc',
      },
      body: {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#ffffff',
      },
      bodySecondary: {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#cccccc',
      },
      small: {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#ffffff',
      },
      label: {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#888888',
      },
    },
  },

  // Spacing (8px grid system)
  spacing: {
    xs: 4,       // Extra small
    sm: 8,       // Small
    md: 16,      // Medium
    lg: 24,      // Large
    xl: 32,      // Extra large
    xxl: 48,     // 2x Extra large
    xxxl: 64,    // 3x Extra large
  },

  // Component dimensions
  dimensions: {
    // Cards
    card: {
      width: 180,
      height: 250,
      cornerRadius: 8,
    },

    // UI Panels
    panel: {
      cornerRadius: 12,
      borderWidth: 2,
      padding: 20,
    },

    // Buttons
    button: {
      height: 50,
      minWidth: 200,
      cornerRadius: 8,
      borderWidth: 2,
      padding: 16,
    },

    // Progress bars
    progressBar: {
      height: 30,
      width: 200,
      borderWidth: 2,
      cornerRadius: 4,
    },

    // Icons
    icon: {
      small: 32,
      medium: 48,
      large: 64,
    },

    // Relics and potions
    relic: {
      size: 60,
      borderWidth: 2,
    },
    potion: {
      size: 50,
      borderWidth: 2,
    },
  },

  // Animation durations (milliseconds)
  animation: {
    fast: 150,
    normal: 300,
    slow: 500,
  },

  // Z-index layers
  layers: {
    background: 0,
    cards: 10,
    ui: 20,
    panels: 30,
    tooltips: 40,
    overlays: 50,
    modals: 60,
  },

  // Effects
  effects: {
    shadow: {
      offsetX: 0,
      offsetY: 4,
      blur: 8,
      color: 'rgba(0, 0, 0, 0.5)',
    },
    glow: {
      blur: 16,
      color: '#ffd700',
    },
    cardHover: {
      liftY: -30,
      scale: 1.1,
      duration: 150,
    },
    buttonHover: {
      scale: 1.05,
      duration: 150,
    },
  },

  // Helper functions
  helpers: {
    /**
     * Convert hex color to Phaser color integer
     */
    hexToColor(hex: string): number {
      return parseInt(hex.replace('#', ''), 16);
    },

    /**
     * Get text style by name
     */
    getTextStyle(styleName: keyof typeof Theme.typography.styles): any {
      return { ...Theme.typography.styles[styleName] };
    },

    /**
     * Get spacing value by multiplier
     */
    getSpacing(multiplier: number): number {
      return Theme.spacing.md * multiplier;
    },

    /**
     * Get card type color
     */
    getCardColor(type: string): number {
      const colorMap: { [key: string]: string } = {
        attack: Theme.colors.attack,
        skill: Theme.colors.skill,
        power: Theme.colors.power,
        curse: Theme.colors.curse,
        status: Theme.colors.status,
      };
      return Theme.helpers.hexToColor(colorMap[type.toLowerCase()] || Theme.colors.status);
    },

    /**
     * Get rarity color
     */
    getRarityColor(rarity: string): number {
      const colorMap: { [key: string]: string } = {
        common: Theme.colors.common,
        uncommon: Theme.colors.uncommon,
        rare: Theme.colors.rare,
        legendary: Theme.colors.legendary,
        boss: Theme.colors.boss_relic,
      };
      return Theme.helpers.hexToColor(colorMap[rarity.toLowerCase()] || Theme.colors.common);
    },

    /**
     * Create a section divider text
     */
    getSectionDivider(text: string): string {
      const padding = '═'.repeat(3);
      return `${padding} ${text} ${padding}`;
    },
  },
};

// Export individual namespaces for convenience
export const Colors = Theme.colors;
export const Typography = Theme.typography;
export const Spacing = Theme.spacing;
export const Dimensions = Theme.dimensions;
export const Animation = Theme.animation;
export const Layers = Theme.layers;
export const Effects = Theme.effects;
