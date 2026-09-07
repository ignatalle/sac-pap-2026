import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ea: {
          verde: '#1a3a2a',
          azul: '#0d1b2a',
          dorado: '#c9a84c',
        }
      }
    },
  },
  plugins: [],
}

export default config
