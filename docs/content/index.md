---
seo:
  title: '@movk/sigma'
  description: A declarative sigma v3 wrapper for Vue 3 and Nuxt 4 — components and composables for large-scale knowledge graph visualization.
---

::u-page-hero{class="dark:bg-gradient-to-b from-neutral-900 to-neutral-950"}
---
orientation: horizontal
ui:
  container: lg:py-20
---
#title
:::motion
把知识图谱写成[组件]{.text-primary}
:::

#description
:::motion
---
transition: { duration: 0.6, delay: 0.3 }
---
基于 sigma v3 的 Nuxt 模块，11 个组件、16 个 composables、7 个工具函数，覆盖渲染、交互、布局、分析与 DOM 覆盖层，面向 1000+ 节点的大规模图谱。封装是加法，不是围墙——原生 `Sigma` 与 `Graph` 实例始终直达。
:::

#links
:::motion{class="flex flex-wrap gap-x-6 gap-y-3"}
---
transition: { duration: 0.6, delay: 0.5 }
---
  ::::u-button
  ---
  to: /docs/getting-started
  size: xl
  trailing-icon: i-lucide-arrow-right
  ---
  快速入门
  ::::

  ::::u-button
  ---
  icon: i-simple-icons-github
  color: neutral
  variant: outline
  size: xl
  to: https://github.com/mhaibaraai/movk-sigmajs
  target: _blank
  ---
  GitHub
  ::::
:::

#default
:::motion{class="mx-auto"}
---
transition: { duration: 0.6, delay: 0.1 }
---
```vue [pages/graph.vue]
<template>
  <SigmaGraph :data="data" :settings="{ hideEdgesOnMove: true }" style="height: 70vh">
    <SigmaControls position="bottom-right">
      <SigmaZoomControl />
      <SigmaFullscreenControl />
    </SigmaControls>

    <SigmaTooltip />
  </SigmaGraph>
</template>
```
:::
::

::u-page-section{class="dark:bg-neutral-950"}
#title
出口兼容

#description
库没覆盖的原生能力，用户必须仍然能用。

#features
  :::u-page-feature
  ---
  icon: i-lucide-unplug
  ---
  #title
  原生实例直达

  #description
  `useSigma()` 返回原生 `Sigma` 与 `Graph`，不包 Proxy、不做代理，sigma 与 graphology 的任何方法都能直接调。
  :::

  :::u-page-feature
  ---
  icon: i-lucide-arrow-right-left
  ---
  #title
  settings 整体透传

  #description
  不逐字段枚举、不过滤未知键，上游新增配置无需本模块升级即可使用。
  :::

  :::u-page-feature
  ---
  icon: i-lucide-split
  ---
  #title
  数据双通道

  #description
  传 `data` 由库做增量 diff 并保留布局坐标；传 `graph` 则库完全不碰数据，只负责渲染与生命周期。
  :::

  :::u-page-feature
  ---
  icon: i-lucide-layers
  ---
  #title
  reducer 链

  #description
  自带的 `nodeReducer` / `edgeReducer` 位于链首，不会被库的高亮、过滤吞掉。
  :::

  :::u-page-feature
  ---
  icon: i-lucide-package-open
  ---
  #title
  不 re-export 上游

  #description
  `sigma` 与 `graphology` 保持 peer 依赖，不夹带第二份实例，类型从原包直接 import。
  :::

  :::u-page-feature
  ---
  icon: i-lucide-paintbrush
  ---
  #title
  控件外观全接管

  #description
  零第三方依赖，插槽作用域连行为一起暴露，接管外观不等于丢掉功能。
  :::
::
