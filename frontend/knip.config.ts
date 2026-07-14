// Knip detects unused files, exports, and dependencies
import type { KnipConfig } from 'knip'

const config: KnipConfig = {
  entry: [
    'next.config.js',
    'src/app/**/*.{js,ts,jsx,tsx}',
    'src/pages/**/*.{js,ts,jsx,tsx}'
  ],
  project: ['src/**/*.{js,ts,jsx,tsx}'],
  ignore: [
    '**/*.d.ts',
    '**/*.test.{js,ts,jsx,tsx}',
    'src/components/ui/shadui/**' // shadcn/ui generates components Knip cannot trace
  ],
  next: {
    entry: ['src/pages/**/*.{js,ts,jsx,tsx}', 'src/app/**/*.{js,ts,jsx,tsx}']
  }
}

export default config
