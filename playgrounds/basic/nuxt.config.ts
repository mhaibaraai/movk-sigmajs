import { fileURLToPath } from 'node:url'

// 示例的唯一数据源在 docs，这里反向引用同一份文件。
// 走绝对路径而非相对字符串：components / imports / css 三处的解析基准并不一致
const examplesDir = fileURLToPath(new URL('../../docs/app/components/content/examples', import.meta.url))
const corpusDir = fileURLToPath(new URL('../../docs/app/utils', import.meta.url))
const examplesCss = fileURLToPath(new URL('../../docs/app/assets/css/examples.css', import.meta.url))

export default defineNuxtConfig({
  modules: ['@movk/sigma'],
  // 示例目录扁平注册：默认的 pathPrefix 会把组件名拼成 ContentExamplesGraphBasicExample，
  // 而页面与 docs 的 MDC 都按 GraphBasicExample 引用
  components: [
    { path: examplesDir, pathPrefix: false, global: true },
    '~/components'
  ],
  // corpus 的 demoGraph / createScaleGraph 在示例里裸调用，靠自动导入解析
  imports: { dirs: [corpusDir] },
  devtools: { enabled: true },
  css: [examplesCss],
  // ExampleCard 的源码折叠用这个别名做 import.meta.glob 的基准
  alias: { '#examples': examplesDir },
  compatibilityDate: 'latest',
  sigma: {
    // prefix: 'Sigma'  组件名前缀，组件文件本身不带前缀
    // settings: {}     全局默认 sigma 配置，与组件级 settings 深度合并后整体透传
    // css: true        注入内置控件与覆盖层的样式表
  }
})
