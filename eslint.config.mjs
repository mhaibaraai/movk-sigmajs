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
    'vue/max-attributes-per-line': ['error', { singleline: 5, multiline: 1 }]
  }
}).append({
  // 页面与布局的文件名即路由名，多词约束在这里只会逼出无意义的重命名
  files: ['playgrounds/*/app/pages/**/*.vue', 'playgrounds/*/app/layouts/**/*.vue'],
  rules: {
    'vue/multi-word-component-names': 'off'
  }
})
