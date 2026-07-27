export default defineAppConfig({
  seo: {
    title: '@movk/sigma',
    titleTemplate: '%s - @movk/sigma',
    description: '基于 sigma v3 的知识图谱可视化 Nuxt 模块，为 Vue 3 / Nuxt 4 提供声明式组件与 composables。'
  },
  github: {
    branch: 'main',
    rootDir: 'docs',
    commitPath: 'src/runtime/components'
  },
  footer: {
    credits: `MIT License © ${new Date().getFullYear()} YiXuan`
  }
})
