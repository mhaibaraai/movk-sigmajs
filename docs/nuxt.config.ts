import pkg from '../package.json'

export default defineNuxtConfig({
  extends: ['@movk/nuxt-docs'],
  modules: ['@movk/sigma'],

  $development: {
    site: { url: 'http://localhost:3000' }
  },

  // 示例目录扁平注册：component-example 的服务端接口按 pascalCase(name) 取源码，
  // 默认的 pathPrefix 会把组件名拼成 ContentExamplesGraphBasicExample，与 MDC 里的 name 对不上
  components: [
    { path: '~/components/content/examples', pathPrefix: false },
    '~/components'
  ],

  // 示例共用的极简样式，与 examples 目录同属一份资产，playgrounds/basic 反向引用同一个文件
  css: ['~/assets/css/examples.css'],

  // 站点名进 OG 图与 SEO，不给的话会退化成 package.json 的 movk-sigma-docs
  site: {
    name: '@movk/sigma'
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

  compatibilityDate: 'latest',

  llms: {
    title: '@movk/sigma',
    description: '基于 sigma v3 的知识图谱可视化 Nuxt 模块，为 Vue 3 / Nuxt 4 提供声明式组件与 composables。',
    notes: ['Nuxt 4', 'Vue 3', 'sigma.js v3', 'graphology', 'WebGL', '知识图谱', '网络可视化']
  },

  mcp: {
    name: '@movk/sigma'
  },

  sigma: {
    // prefix: 'Sigma'  组件名前缀，组件文件本身不带前缀
    // settings: {}     全局默认 sigma 配置，与组件级 settings 深度合并后整体透传
    // css: true        注入内置控件与覆盖层的样式表
  }
})
