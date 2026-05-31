import type { Config } from 'tailwindcss'

function generateSafelist(): string[] {
  const colors = ['0f1419', '1a1f2e', '0a0d12', 'e94560', '00d4ff', '0f3460', 'ff6b6b', 'ff6f6b', 'ff6b6b', 'orange-400', 'orange-500', 'red-500', 'gray-100', 'gray-300', 'gray-400', 'gray-500', 'gray-600', 'gray-700', 'gray-800', 'gray-900', 'green-400', 'red-400', 'yellow-400', 'purple-400', 'indigo-400', 'white', 'black']
  const opacities = ['', '/5', '/10', '/20', '/30', '/40', '/50']
  const prefixes = ['bg', 'text', 'border']
  const hoverPrefixes = ['hover:bg', 'hover:text', 'hover:border']

  const list: string[] = []

  for (const color of colors) {
    for (const opacity of opacities) {
      for (const prefix of prefixes) {
        list.push(`${prefix}-[#${color}${opacity}]`)
      }
      for (const hoverPrefix of hoverPrefixes) {
        list.push(`${hoverPrefix}-[#${color}]`)
      }
    }
  }

  list.push('shadow-[#e94560]/50', 'shadow-lg', 'hover:shadow-lg', 'hover:shadow-[#e94560]/50', 'hover:scale', 'hover:scale-105', 'hover:border-gray-600', 'transition-all', 'transition-colors', 'text-transparent', 'bg-clip-text')

  return list
}

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts}',
  ],
  safelist: generateSafelist(),
  theme: {
    extend: {
      colors: {
        primary: '#1a1a2e',
        secondary: '#16213e',
        accent: '#0f3460',
        highlight: '#e94560',
        success: '#00d4ff',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
export default config
