import pkg from '../package.json'

export default defineNuxtConfig({
  extends: ['@movk/nuxt-docs'],

  modules: [
    '../src/module',
    '@vercel/analytics',
    '@vercel/speed-insights'
  ],

  $development: {
    site: { url: 'http://localhost:3000' }
  },

  $production: {
    site: {
      url: 'https://sigma.mhaibaraai.cn'
    }
  },

  css: ['~/assets/css/main.css'],

  site: {
    name: 'Movk Sigma'
  },

  runtimeConfig: {
    public: { version: pkg.version }
  },

  routeRules: {
    '/docs': { redirect: '/docs/getting-started', prerender: false },
    '/docs/components': { redirect: '/docs/components/graph', prerender: false },
    '/docs/composables': { redirect: '/docs/composables/use-sigma', prerender: false },
    '/docs/utils': { redirect: '/docs/utils/apply-graph-diff', prerender: false },
    '/docs/guides': { redirect: '/docs/guides/scale', prerender: false }
  },

  compatibilityDate: '2026-06-30',

  aiChat: {
    model: 'alibaba/glm-5.1',
    models: [
      'alibaba/qwen3.7-plus',
      'alibaba/glm-5.1',
      'alibaba/deepseek-v3.2'
    ]
  },

  llms: {
    domain: 'https://sigma.mhaibaraai.cn',
    title: 'Movk Sigma',
    description: '基于 sigma v4 的知识图谱可视化 Nuxt 模块，为 Vue 3 / Nuxt 4 提供声明式组件与 composables。',
    notes: ['Nuxt 4', 'Vue 3', 'sigma.js v4', 'graphology', 'WebGL', '知识图谱', '网络可视化']
  },

  mcp: {
    name: 'Movk Sigma',
    browserRedirect: '/docs/getting-started/ai/mcp'
  }
})
