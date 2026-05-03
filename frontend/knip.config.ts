// knip.config.ts
import type { KnipConfig } from 'knip'

const config: KnipConfig = {
  entry: [
    'next.config.js',
    'pages/**/*.{js,ts,jsx,tsx}',
    'app/**/*.{js,ts,jsx,tsx}',
    'components/**/*.{js,ts,jsx,tsx}'
  ],
  project: ['**/*.{js,ts,jsx,tsx}'],
  ignore: ['**/*.d.ts', '**/*.test.{js,ts,jsx,tsx}'],
  next: {
    entry: ['pages/**/*.{js,ts,jsx,tsx}', 'app/**/*.{js,ts,jsx,tsx}']
  }
}

export default config
