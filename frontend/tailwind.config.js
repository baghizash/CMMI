/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif']
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        },
        // CMMI design system v3 (locked 2026-10-31): one fixed job per colour.
        marine: { DEFAULT: '#1D5C8A', deep: '#17456B', tint: '#E8F1F8' },
        butter: { DEFAULT: '#F2C94C', tint: '#FBF0CE' },
        plum: { DEFAULT: '#6D3B8A', tint: '#F1E8F7' },
        tang: { DEFAULT: '#D96C27', dark: '#A34E14', tint: '#FAEEE1' },
        hadir: { DEFAULT: '#1F7A4D', tint: '#E7F3EC' },
        telat: { DEFAULT: '#8A5A0B', tint: '#FAF0DA' },
        alpa: { DEFAULT: '#B3372F', tint: '#FBEAE7' },
        piket: { dark: '#7C2D4E', tint: '#F9E4EC' },
        paper: '#FAF8F3',
        ink: { DEFAULT: '#1E2732', soft: '#5B6572' }
      },
      boxShadow: {
        tactile: '0 2px 6px rgba(30,39,50,0.20), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -2px 4px rgba(30,39,50,0.12)',
        'tactile-pressed': 'inset 0 3px 7px rgba(30,39,50,0.30), inset 0 -1px 2px rgba(255,255,255,0.20)',
        soft: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 3px 8px rgba(30,39,50,0.08)',
        tile: 'inset 0 1px 0 rgba(255,255,255,0.95), 0 2px 5px rgba(30,39,50,0.05), 0 18px 34px -22px rgba(30,39,50,0.35)'
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        'accordion-down': {
          from: {
            height: '0'
          },
          to: {
            height: 'var(--radix-accordion-content-height)'
          }
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)'
          },
          to: {
            height: '0'
          }
        }
      },
      animation: {
        'fade-in': 'fade-in 0.35s cubic-bezier(.32,.72,0,1) both',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
};