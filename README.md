# @movk/sigma

面向 Vue 3 / Nuxt 4 的 [sigma v3](https://www.sigmajs.org/) 声明式封装，专注大规模知识图谱可视化。

> 规划阶段。当前仓库只有架构方案，实现尚未开始，路线见 [架构方案](references/movk-sigma-architecture.md#十三里程碑)。

## 为什么做这个

大规模图谱（1000+ 节点、上万条边）在 Vue 生态里没有可用方案：`v-network-graph` 与 `@vue-flow/core` 走 SVG / DOM 渲染，在这个量级会崩。WebGL 方案 sigma.js 撑得住，但它只有 React 封装——`@react-sigma/core` 由 sigma 作者本人维护，Vue 侧从来没人接。npm 上 `vue-sigma`、`vue3-sigma`、`sigma-vue`、`@sigma/vue` 全部 404。

本库补这个空位。

## 设计原则

**封装是加法，不是围墙。** 库没覆盖的原生能力，用户必须仍然能用：

- `useSigma()` 返回**原生** `Sigma` 与 `Graph` 实例，不包 Proxy、不做代理
- `settings` **整体透传**给 sigma，不逐字段枚举、不过滤未知键，上游新增配置立即可用
- 数据双通道：传 `data` 由库做增量 diff，传 `graph` 则库完全不碰数据，只负责渲染与生命周期
- 渲染程序、布局、控件全都可以绕过，库不劫持画布
- 不 re-export 上游，`sigma` 与 `graphology` 保持 peer 依赖，不夹带第二份实例

完整的十条保证与已知耦合点见[架构方案第三节](references/movk-sigma-architecture.md#三原生能力的出口兼容)。

## 能力概览

**组件（11 个，全部 `Sigma` 前缀）**

- 核心：`SigmaGraph`、`SigmaOverlay`、`SigmaTooltip`、`SigmaPopover`、`SigmaContextMenu`
- 控件：`SigmaControls`、`SigmaZoomControl`、`SigmaFullscreenControl`、`SigmaSearchControl`、`SigmaLegend`、`SigmaMiniMap`

控件零第三方依赖，只提供行为与无障碍结构，外观经插槽与 CSS 变量全接管。

**Composables（14 个）**

- 基础：`useSigma`、`useSigmaById`、`useSigmaGraph`、`useSigmaEvents`、`useSigmaSettings`、`useSigmaReducer`
- 交互：`useSigmaCamera`、`useSigmaSelection`、`useSigmaNeighborhood`、`useSigmaSearch`、`useSigmaFilter`
- 布局与分析：`useSigmaLayout`、`useSigmaMetrics`、`useSigmaExport`

## 计划中的用法

```bash
pnpm add @movk/sigma sigma graphology
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@movk/sigma'],
})
```

```vue
<script setup lang="ts">
import type { SerializedGraph } from 'graphology-types'

const data = ref<SerializedGraph>(await $fetch('/api/graph/overview'))

const { assign } = useSigmaLayout('forceatlas2', { worker: true })
const { selected } = useSigmaSelection()
</script>

<template>
  <SigmaGraph :data="data" :settings="{ hideEdgesOnMove: true }" auto-fit @ready="assign">
    <SigmaControls position="bottom-right">
      <SigmaZoomControl />
      <SigmaFullscreenControl />
    </SigmaControls>

    <SigmaPopover v-if="selected" :node="selected">
      <NodeDetailPanel :key="selected" />
    </SigmaPopover>
  </SigmaGraph>
</template>
```

## 开发

```bash
pnpm install
pnpm dev:prepare     # 首次或依赖变更后必须先跑
pnpm dev             # 启动 playground
pnpm test
pnpm typecheck
pnpm lint
```

开发约定见 [AGENTS.md](AGENTS.md)，其中的红线（runtime 禁用自动导入、出口兼容、官方类型、`@movk/core` 优先）必须遵守。

## 相关

- [架构方案](references/movk-sigma-architecture.md) —— 选型核查、技术难点与设计依据
- [sigma.js](https://www.sigmajs.org/) / [graphology](https://graphology.github.io/)
- [@movk/mapbox](https://mapbox.mhaibaraai.cn) —— 同系列的 Mapbox GL 封装

## License

[MIT](LICENSE)
