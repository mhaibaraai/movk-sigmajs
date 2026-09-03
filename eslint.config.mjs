// @ts-check
import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

export default createConfigForNuxt({
  features: {
    tooling: true,
    stylistic: true
  },
  dirs: {
    src: ['./playgrounds/basic', './playgrounds/ui']
  }
}).append({
  rules: {
    '@stylistic/comma-dangle': ['error', 'never']
  }
}).append({
  files: ['**/*.vue'],
  rules: {
    'vue/multi-word-component-names': 'off',
    'vue/max-attributes-per-line': ['error', { singleline: 5, multiline: 1 }]
  }
})
