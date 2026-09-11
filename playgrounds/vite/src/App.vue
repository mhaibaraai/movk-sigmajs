<script setup lang="ts">
import AutoImportExample from './examples/AutoImportExample.vue'
import BarrelExample from './examples/BarrelExample.vue'
import ComposableExample from './examples/ComposableExample.vue'
import GlobalSettingsExample from './examples/GlobalSettingsExample.vue'
</script>

<template>
  <main>
    <h1>@movk/sigma · Vite Playground</h1>
    <p class="intro">
      纯 Vue 3 + Vite，无 Nuxt。验证 <code>@movk/sigma/vite</code>、
      <code>@movk/sigma/vue</code> 与 <code>@movk/sigma/vue-plugin</code> 三条消费路径。
    </p>

    <section>
      <h2>组件自动导入</h2>
      <p>
        <code>SigmaGraph</code> 与 controls 均未显式 import，由 Vite 插件的组件解析器接管；
        <code>SigmaZoomControl</code> 证明子目录不进组件名。
      </p>
      <AutoImportExample />
    </section>

    <section>
      <h2>composable 自动导入与可选 peer</h2>
      <p>
        <code>useSigmaLayout</code> 与 <code>useSigmaExport</code> 同样来自自动导入，
        分别在运行时动态加载 graphology-layout-forceatlas2 与 @sigma/export-image。
      </p>
      <ComposableExample />
    </section>

    <section>
      <h2>具名导入</h2>
      <p>
        改从 <code>@movk/sigma/vue</code> 显式导入，不依赖任何 unplugin。
      </p>
      <BarrelExample />
    </section>

    <section>
      <h2>全局默认 settings</h2>
      <p>
        <code>main.ts</code> 经 <code>SigmaPlugin</code> 注入全局默认，组件只覆盖
        <code>labelDensity</code>；<code>renderEdgeLabels</code> 仍从全局兜底。
      </p>
      <GlobalSettingsExample />
    </section>
  </main>
</template>
