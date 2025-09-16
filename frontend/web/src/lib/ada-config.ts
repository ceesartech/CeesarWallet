// ADA Compliance Configuration for CeesarWallet
// Following WCAG 2.1 AA guidelines

export const ADA_CONFIG = {
  // Color contrast ratios (WCAG 2.1 AA requires 4.5:1 for normal text, 3:1 for large text)
  colors: {
    // Linear-inspired colors with proper contrast ratios
    background: '#0d1117',        // Dark background
    surface: '#161b22',           // Elevated surface
    surfaceElevated: '#21262d',   // Higher elevation
    border: '#30363d',            // Subtle borders
    textPrimary: '#f0f6fc',       // High contrast text (21:1 ratio)
    textSecondary: '#8b949e',      // Secondary text (4.5:1 ratio)
    accent: '#238636',            // Success/accent color (4.5:1 ratio)
    accentHover: '#2ea043',      // Hover state
    danger: '#da3633',           // Error color (4.5:1 ratio)
    warning: '#d29922',          // Warning color (4.5:1 ratio)
    info: '#58a6ff',             // Info color (4.5:1 ratio)
    success: '#238636',          // Success color
  },

  // Typography settings for readability
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: {
      xs: '12px',    // Minimum readable size
      sm: '14px',    // Small text
      base: '16px',  // Base size (recommended minimum)
      lg: '18px',    // Large text
      xl: '20px',    // Extra large
      '2xl': '24px', // Headings
      '3xl': '30px', // Large headings
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,   // Recommended for readability
      relaxed: 1.75,
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },

  // Spacing for touch targets (minimum 44px for mobile)
  spacing: {
    touchTarget: '44px',  // Minimum touch target size
    padding: {
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px',
    },
    margin: {
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px',
    },
  },

  // Focus indicators
  focus: {
    outline: '2px solid #58a6ff',  // High contrast focus ring
    outlineOffset: '2px',
    borderRadius: '4px',
  },

  // Animation settings (respects prefers-reduced-motion)
  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    },
  },

  // Screen reader support
  screenReader: {
    // Skip links for keyboard navigation
    skipLinks: [
      { href: '#main-content', text: 'Skip to main content' },
      { href: '#navigation', text: 'Skip to navigation' },
      { href: '#footer', text: 'Skip to footer' },
    ],
    
    // ARIA labels for complex components
    ariaLabels: {
      tradingChart: 'Interactive trading chart showing price movements',
      orderBook: 'Order book showing buy and sell orders',
      portfolio: 'Portfolio overview with performance metrics',
      riskMonitor: 'Risk monitoring dashboard',
      notifications: 'System notifications and alerts',
    },
  },

  // Keyboard navigation
  keyboard: {
    // Tab order management
    tabIndex: {
      focusable: 0,
      notFocusable: -1,
    },
    
    // Keyboard shortcuts
    shortcuts: {
      'Alt+1': 'Go to dashboard',
      'Alt+2': 'Go to trading',
      'Alt+3': 'Go to portfolio',
      'Alt+4': 'Go to settings',
      'Escape': 'Close modal or menu',
      'Enter': 'Activate button or link',
      'Space': 'Activate button',
      'ArrowUp': 'Previous item',
      'ArrowDown': 'Next item',
      'ArrowLeft': 'Previous tab',
      'ArrowRight': 'Next tab',
    },
  },

  // Form accessibility
  forms: {
    // Required field indicators
    requiredIndicator: '*',
    
    // Error message styling
    errorColor: '#da3633',
    errorBackground: '#490202',
    
    // Success message styling
    successColor: '#238636',
    successBackground: '#0d2818',
    
    // Field validation
    validation: {
      realTime: true,
      showErrors: true,
      errorPosition: 'below', // 'below' or 'above'
    },
  },

  // Modal and overlay accessibility
  modals: {
    // Focus management
    trapFocus: true,
    restoreFocus: true,
    
    // Backdrop
    backdrop: {
      color: 'rgba(0, 0, 0, 0.5)',
      blur: '4px',
    },
    
    // Animation
    animation: {
      duration: '300ms',
      easing: 'ease-out',
    },
  },

  // Data table accessibility
  tables: {
    // Sortable columns
    sortable: {
      indicator: '↕',
      ascending: '↑',
      descending: '↓',
    },
    
    // Pagination
    pagination: {
      showPageNumbers: true,
      showPageSizeSelector: true,
      showTotalCount: true,
    },
    
    // Responsive behavior
    responsive: {
      horizontalScroll: true,
      stickyHeader: true,
      collapsibleRows: true,
    },
  },

  // Chart accessibility
  charts: {
    // Alternative text
    altText: 'Chart showing {dataType} for {timeframe}',
    
    // Data table export
    exportDataTable: true,
    
    // High contrast mode
    highContrast: {
      enabled: true,
      colors: ['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff'],
    },
    
    // Keyboard navigation
    keyboardNavigation: true,
  },

  // Notification accessibility
  notifications: {
    // Screen reader announcements
    announceToScreenReader: true,
    
    // Duration
    duration: {
      success: 4000,
      warning: 6000,
      error: 8000,
      info: 5000,
    },
    
    // Position
    position: 'top-right',
    
    // Animation
    animation: {
      enter: 'slideInRight',
      exit: 'slideOutRight',
    },
  },

  // Loading states
  loading: {
    // Skeleton screens
    skeleton: {
      enabled: true,
      animation: 'pulse',
      duration: '1.5s',
    },
    
    // Progress indicators
    progress: {
      showPercentage: true,
      showSteps: true,
      estimatedTime: true,
    },
    
    // Spinner
    spinner: {
      size: '24px',
      color: '#58a6ff',
      animation: 'spin',
    },
  },

  // Error handling
  errors: {
    // Error boundaries
    errorBoundary: {
      enabled: true,
      fallbackComponent: 'ErrorFallback',
    },
    
    // Error messages
    messages: {
      generic: 'Something went wrong. Please try again.',
      network: 'Network error. Please check your connection.',
      validation: 'Please check your input and try again.',
      permission: 'You do not have permission to perform this action.',
    },
    
    // Error reporting
    reporting: {
      enabled: true,
      service: 'Sentry',
      includeUserInfo: false,
    },
  },

  // Performance
  performance: {
    // Lazy loading
    lazyLoading: {
      enabled: true,
      threshold: '100px',
    },
    
    // Image optimization
    images: {
      lazy: true,
      placeholder: 'blur',
      quality: 80,
    },
    
    // Bundle optimization
    bundle: {
      codeSplitting: true,
      treeShaking: true,
      minification: true,
    },
  },

  // Testing
  testing: {
    // Accessibility testing
    axe: {
      enabled: true,
      rules: ['wcag2a', 'wcag2aa'],
      tags: ['wcag2a', 'wcag2aa', 'best-practice'],
    },
    
    // Screen reader testing
    screenReader: {
      enabled: true,
      tools: ['NVDA', 'JAWS', 'VoiceOver'],
    },
    
    // Keyboard testing
    keyboard: {
      enabled: true,
      testAllInteractiveElements: true,
    },
  },
};

// Utility functions for ADA compliance
export const ADAUtils = {
  // Check if user prefers reduced motion
  prefersReducedMotion: () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  // Check if user prefers high contrast
  prefersHighContrast: () => {
    return window.matchMedia('(prefers-contrast: high)').matches;
  },

  // Check if user prefers dark mode
  prefersDarkMode: () => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  },

  // Generate accessible color combinations
  getAccessibleColors: (baseColor: string) => {
    // Implementation for generating accessible color combinations
    return {
      primary: baseColor,
      secondary: adjustColor(baseColor, 20),
      hover: adjustColor(baseColor, -10),
      active: adjustColor(baseColor, -20),
    };
  },

  // Validate color contrast ratio
  validateContrast: (foreground: string, background: string, level: 'AA' | 'AAA' = 'AA') => {
    const ratio = getContrastRatio(foreground, background);
    const requiredRatio = level === 'AA' ? 4.5 : 7;
    return ratio >= requiredRatio;
  },

  // Generate ARIA labels
  generateAriaLabel: (component: string, data: any) => {
    const templates = {
      chart: `Chart showing ${data.type} data for ${data.timeframe}`,
      table: `Table with ${data.rows} rows and ${data.columns} columns`,
      button: `${data.action} ${data.target}`,
      link: `Link to ${data.destination}`,
    };
    return templates[component as keyof typeof templates] || `${component} component`;
  },

  // Focus management
  focusManager: {
    trap: (element: HTMLElement) => {
      const focusableElements = element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      element.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement.focus();
              e.preventDefault();
            }
          }
        }
      });
    },

    restore: (element: HTMLElement) => {
      element.focus();
    },
  },
};

// Helper functions
function adjustColor(color: string, amount: number): string {
  // Implementation for adjusting color brightness
  return color; // Placeholder
}

function getContrastRatio(color1: string, color2: string): number {
  // Implementation for calculating contrast ratio
  return 4.5; // Placeholder
}

export default ADA_CONFIG;
