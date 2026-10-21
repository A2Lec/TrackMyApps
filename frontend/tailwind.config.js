/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		fontFamily: {
  			sans: ['"Instrument Sans Variable"', '"Instrument Sans"', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
  			mono: ['"JetBrains Mono Variable"', '"JetBrains Mono"', 'ui-monospace', '"SF Mono"', 'Menlo', 'monospace']
  		},
  		boxShadow: {
  			popover: 'var(--shadow-popover)',
  			drag: 'var(--shadow-drag)'
  		},
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			success: {
  				DEFAULT: 'hsl(var(--success))',
  				foreground: 'hsl(var(--success-foreground))'
  			},
  			warning: {
  				DEFAULT: 'hsl(var(--warning))',
  				foreground: 'hsl(var(--warning-foreground))',
  				soft: 'hsl(var(--warning-soft))',
  				strong: 'hsl(var(--warning-strong))'
  			},
  			'primary-soft': 'hsl(var(--primary-soft))',
  			'surface-sunken': 'hsl(var(--surface-sunken))',
  			inverse: {
  				DEFAULT: 'hsl(var(--inverse))',
  				foreground: 'hsl(var(--inverse-foreground))'
  			},
  			status: {
  				draft: 'var(--status-draft)',
  				sent: 'var(--status-sent)',
  				viewed: 'var(--status-viewed)',
  				interview: 'var(--status-interview)',
  				waiting: 'var(--status-waiting)',
  				rejected: 'var(--status-rejected)',
  				accepted: 'var(--status-accepted)',
  				ghosted: 'var(--status-ghosted)'
  			},
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: 0
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
  					height: 0
  				}
  			},
  			'progress-grow': {
  				from: {
  					transform: 'scaleX(0)'
  				},
  				to: {
  					transform: 'scaleX(0.9)'
  				}
  			},
  			'loader-float': {
  				'0%, 100%': {
  					transform: 'translateY(0)'
  				},
  				'50%': {
  					transform: 'translateY(-6px)'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'progress-grow': 'progress-grow 8s cubic-bezier(0.1, 0.6, 0.3, 1) forwards',
  			'loader-float': 'loader-float 2s ease-in-out infinite'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
