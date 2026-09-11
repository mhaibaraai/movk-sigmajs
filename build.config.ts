import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  // Vue（非 Nuxt）支持入口，与 nuxt-module-build 的 module + runtime 产物并存
  entries: [
    './src/unplugin',
    './src/vite',
    './src/vue-plugin'
  ],
  declaration: true,
  failOnWarn: false,
  externals: [
    'vite',
    'vue',
    'unplugin',
    'unplugin-auto-import',
    'unplugin-vue-components',
    'consola',
    'defu',
    '@movk/core',
    '@vueuse/core',
    'sigma',
    'sigma/settings',
    'sigma/types',
    'graphology',
    'graphology-types',
    '@sigma/export-image',
    '@sigma/node-border',
    '@sigma/node-image',
    '@sigma/node-piechart',
    '@sigma/utils',
    'graphology-communities-louvain',
    'graphology-layout',
    'graphology-layout-forceatlas2',
    'graphology-layout-noverlap',
    'graphology-metrics'
  ],
  hooks: {
    'mkdist:entry:options'(_ctx, _entry, options) {
      options.addRelativeDeclarationExtensions = false
    }
  }
})
