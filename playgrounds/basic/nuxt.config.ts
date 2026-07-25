export default defineNuxtConfig({
  modules: ['@movk/sigma'],
  // 示例目录扁平注册：默认的 pathPrefix 会把组件名拼成 ContentExamplesGraphBasicExample，
  // 而 docs 的 component-example 模块按 pascalName 取源码，名字必须是 GraphBasicExample。
  // global 供未来 docs 的 MDC 渲染使用，在 playground 内无副作用
  components: [
    { path: '~/components/content/examples', pathPrefix: false, global: true },
    '~/components'
  ],
  devtools: { enabled: true },
  // 示例共用的极简样式，与 examples 目录一起搬迁
  css: ['~/assets/css/examples.css'],
  compatibilityDate: 'latest',
  sigma: {
    // prefix: 'Sigma'  组件名前缀，组件文件本身不带前缀
    // settings: {}     全局默认 sigma 配置，与组件级 settings 深度合并后整体透传
    // css: true        注入内置控件与覆盖层的样式表
  }
})
