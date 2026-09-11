import { createApp } from 'vue'
import SigmaPlugin from '@movk/sigma/vue-plugin'
import App from './App.vue'
import '@movk/sigma/index.css'
import './style.css'

createApp(App)
  // 对应 Nuxt 模块的 sigma.settings 选项：全局默认，与组件级 settings 深度合并
  .use(SigmaPlugin, {
    settings: {
      renderEdgeLabels: true,
      labelDensity: 0.5
    }
  })
  .mount('#app')
