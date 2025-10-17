/** @type {import('tailwindcss').Config} */
import defaultTheme from 'tailwindcss/defaultTheme';

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
  			sans: [
  				'Inter',
  				'Manrope',
          ...defaultTheme.fontFamily.sans
        ],
  			display: [
  				'Playfair Display',
  				'Fraunces',
  				'Inter',
  				'system-ui',
  				'sans-serif'
  			],
        serif: [
          'Playfair Display',
          'Fraunces',
          'serif'
        ],
  			mono: [
  				'JetBrains Mono',
  				'Fira Code',
  				'monospace'
  			]
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
        studio: {
          crudo: 'hsl(var(--brand-crudo-claro))',
          paprika: 'hsl(var(--brand-paprika))',
          merlot: 'hsl(var(--brand-merlot))',
          salvia: 'hsl(var(--brand-salvia))',
          trufa: 'hsl(var(--brand-trufa))',
          neblina: 'hsl(var(--brand-neblina))',
          miel: 'hsl(var(--brand-miel))'
        },
 			// Paleta Pastel Dashboard
 			surface: {
  				pearl: 'hsl(var(--surface-pearl))',
  				cream: 'hsl(var(--surface-cream))',
  				lavender: 'hsl(var(--surface-lavender))',
  				mint: 'hsl(var(--surface-mint))',
  				blush: 'hsl(var(--surface-blush))'
  			},
  			pastel: {
  				mint: {
  					primary: 'hsl(var(--mint-primary))',
  					secondary: 'hsl(var(--mint-secondary))',
  					light: 'hsl(var(--mint-light))'
  				},
  				lavender: {
  					primary: 'hsl(var(--lavender-primary))',
  					secondary: 'hsl(var(--lavender-secondary))'
  				},
  				blush: {
  					primary: 'hsl(var(--blush-primary))',
  					secondary: 'hsl(var(--blush-secondary))'
  				},
  				cream: {
  					primary: 'hsl(var(--cream-primary))',
  					secondary: 'hsl(var(--cream-secondary))'
  				}
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
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
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
