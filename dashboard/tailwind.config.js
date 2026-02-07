/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // FOR THE KIDS branding colors
        'ftk': {
          primary: '#4F46E5',      // Indigo - trust & stability
          secondary: '#10B981',    // Emerald - growth & charity
          accent: '#F59E0B',       // Amber - warmth & hope
          survival: '#FF9800',     // Orange - survival mode
          transition: '#2196F3',   // Blue - transition phase
          permanent: '#4CAF50',    // Green - permanent DAO
          dark: '#1E293B',         // Slate dark
          light: '#F8FAFC',        // Slate light
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'countdown': 'countdown 1s ease-in-out infinite',
      },
      keyframes: {
        countdown: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
      },
    },
  },
  plugins: [],
};
