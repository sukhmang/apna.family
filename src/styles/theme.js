// Design system theme for the memorial site
export const theme = {
  colors: {
    background: '#f8fafc', // slate-50
    cardBackground: '#ffffff', // white
    text: {
      primary: '#0f172a', // slate-900
      secondary: '#475569', // slate-600
      tertiary: '#334155', // slate-700
    },
    border: '#e2e8f0', // slate-200
    accent: '#2563eb', // blue-600
    accentHover: '#1d4ed8', // blue-700
  },
  spacing: {
    xs: '0.5rem', // 8px
    sm: '1rem', // 16px
    md: '1.5rem', // 24px
    lg: '2rem', // 32px
    xl: '3rem', // 48px
  },
  typography: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
    sizes: {
      xs: '0.875rem', // 14px
      sm: '1rem', // 16px
      base: '1.125rem', // 18px
      lg: '1.25rem', // 20px
      xl: '1.5rem', // 24px
      '2xl': '2.25rem', // 36px
      '4xl': '2.5rem', // 40px
    },
    weights: {
      normal: 400,
      semibold: 600,
      bold: 700,
    },
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  },
  borderRadius: {
    sm: '0.5rem', // 8px
    md: '0.75rem', // 12px
    lg: '1rem', // 16px
    full: '9999px', // full circle
  },
  breakpoints: {
    mobile: '640px',
    tablet: '768px',
    desktop: '1024px',
  },
}

