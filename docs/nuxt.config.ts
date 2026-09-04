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
    '/docs/utils': { redirect: '/docs/utils/apply-graph-diff', prerender: false }
  },

  compatibilityDate: '2026-06-30',

  vite: {
    optimizeDeps: {
      include: [
        '@unhead/schema-org/vue',
        '@movk/core',
        'sigma/types'
      ]
    }
  },

  aiChat: {
    model: 'alibaba/qwen3.7-plus',
    models: [
      'alibaba/qwen3.7-plus',
      'zai/glm-5.3',
      'deepseek/deepseek-v4-pro'
    ]
  },

  llms: {
    domain: 'https://sigma.mhaibaraai.cn',
    title: 'Movk Sigma',
    description: '基于 sigma v4 的知识图谱可视化 Nuxt 模块，为 Vue 3 / Nuxt 4 提供声明式组件与 composables。',
    full: {
      title: 'Movk Sigma — 声明式知识图谱可视化组件库',
      description: '基于 sigma v4 与 graphology 的 Nuxt 模块完整文档：11 个组件（渲染、覆盖层、控件）、16 个 composables（相机、选中、邻域、拖拽、搜索、过滤、布局、指标、导出）与 7 个工具函数（增量 diff、styles 合成、标签方位与档位、SDF 形状、渲染原语声明）的全部 API 与示例。'
    },
    notes: ['sigma', 'sigmajs', 'sigma-v4', 'graphology', 'nuxt', 'nuxt4', 'vue', 'vue3', 'webgl', 'knowledge-graph', 'network-visualization', 'force-atlas2', 'community-detection', 'composables', 'declarative', 'auto-import', 'SSR 下 sigma 各子路径必须动态 import，useSigma() 必须在 SigmaGraph 子树内调用，settings 整体透传，styles 需 composeStyles 合成']
  },

  mcp: {
    name: 'Movk Sigma',
    browserRedirect: '/docs/getting-started/ai/mcp'
  },

  sigma: {
    settings: {
      gestureTarget: 'shared',
      sharedGestureWheelMessage: '按住 Ctrl 滚动可缩放图谱',
      sharedGestureAppleWheelMessage: '按住 ⌘ 滚动可缩放图谱',
      sharedGestureTouchMessage: '双指拖动可操作图谱'
    }
  }
})
