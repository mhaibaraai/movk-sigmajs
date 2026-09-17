// @ts-check
import { fileURLToPath } from 'node:url'
import { createConfigForNuxt } from '@nuxt/eslint-config/flat'
import betterTailwindcss from 'eslint-plugin-better-tailwindcss'

/**
 * Tailwind class checks for the apps in this repo (docs and playgrounds).
 * `src/runtime` is excluded: it ships plain `sigma-*` classes styled by `index.css`.
 * @param {string} cwd
 * @param {string[]} files
 * @param {string} entryPoint
 * @param {string[]} ignore
 * @returns {import('eslint').Linter.Config}
 */
function betterTailwindcssConfig(cwd, files, entryPoint, ignore = []) {
  const resolve = (/** @type {string} */ path) => fileURLToPath(new URL(path, import.meta.url))
  return {
    files,
    plugins: {
      'better-tailwindcss': betterTailwindcss
    },
    settings: {
      'better-tailwindcss': {
        // Absolute so editor ESLint servers running from a subfolder resolve them too;
        // cwd points at the package that actually depends on tailwindcss
        cwd: resolve(cwd),
        entryPoint: resolve(entryPoint),
        attributes: [
          '^(v-bind:|:)?class$',
          ['^(v-bind:|:)?ui$', [{ match: 'objectValues' }]]
        ]
      }
    },
    rules: {
      ...betterTailwindcss.configs['correctness-error'].rules,
      'better-tailwindcss/no-unknown-classes': ['error', { ignore }]
    }
  }
}

export default createConfigForNuxt({
  features: {
    tooling: true,
    stylistic: true
  },
  dirs: {
    src: ['./playgrounds/nuxt']
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
}).append(
  // docs/app/assets/css/main.css is not a Tailwind root; @movk/nuxt-docs generates the real one on prepare
  betterTailwindcssConfig('docs/', ['docs/app/**/*.vue'], 'docs/.nuxt/movk-nuxt-docs.css', [
    // Hook classes styled in scoped `<style>` blocks, not Tailwind utilities
    '^hero-code$'
  ])
).append(
  betterTailwindcssConfig('playgrounds/nuxt/', ['playgrounds/nuxt/app/**/*.vue'], 'playgrounds/nuxt/app/assets/css/main.css')
)
