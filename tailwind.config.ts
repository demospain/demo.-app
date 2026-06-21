import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'demo-black':   '#111318',
        'demo-dark':    '#1E2028',
        'demo-surface': '#252830',
        'demo-purple':  '#7C6FFF',
        'demo-purple-dk': '#4A3FCC',
        'demo-gray':    '#9BA0AD',
        'demo-dim':     '#555966',
        'demo-white':   '#F8F7F4',
        'demo-green':   '#1D9E75',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
        mono: ['var(--font-dm-mono)', 'DM Mono', 'monospace'],
      },
      borderColor: {
        DEFAULT: 'rgba(255,255,255,0.06)',
      },
    },
  },
  plugins: [],
}

export default config
