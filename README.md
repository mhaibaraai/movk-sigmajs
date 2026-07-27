# @movk/sigma

面向 Vue 3 / Nuxt 4 的 [sigma v3](https://www.sigmajs.org/) 声明式封装，专注大规模知识图谱可视化。

> 34 个公开 API 与两套演示已实现（[架构方案](references/movk-sigma-architecture.md#十三里程碑)的 M0–M5 全部完成），文档站、MCP Server 与 llms.txt 列为后续候选，本轮不排期。

## 设计原则

**封装是加法，不是围墙。** 库没覆盖的原生能力，用户必须仍然能用：

- `useSigma()` 返回**原生** `Sigma` 与 `Graph` 实例，不包 Proxy、不做代理
- `settings` **整体透传**给 sigma，不逐字段枚举、不过滤未知键，上游新增配置立即可用
- 数据双通道：传 `data` 由库做增量 diff，传 `graph` 则库完全不碰数据，只负责渲染与生命周期
- 渲染程序、布局、控件全都可以绕过，库不劫持画布
- 不 re-export 上游，`sigma` 与 `graphology` 保持 peer 依赖，不夹带第二份实例
- 用户自带的 `settings.nodeReducer` / `edgeReducer` 位于 reducer 链首，不会被库的高亮、过滤吞掉

完整的十条保证与已知耦合点见[架构方案第三节](references/movk-sigma-architecture.md#三原生能力的出口兼容)。

## 安装

```bash
pnpm add @movk/sigma sigma graphology
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@movk/sigma'],

  sigma: {
    // 组件名前缀，组件文件本身不带前缀
    prefix: 'Sigma',
    // 全局默认 settings，与组件级 settings 深度合并后整体透传
    settings: { defaultNodeColor: '#3b82f6' },
    // 注入内置控件与覆盖层的样式表
    css: true
  }
})
```

其余能力按需装可选 peer，未安装时调用会抛出「装哪个包」的可操作报错：

| 用途 | 包 |
| --- | --- |
| 布局 | `graphology-layout`、`graphology-layout-forceatlas2`、`graphology-layout-noverlap` |
| 分析 | `graphology-metrics`、`graphology-communities-louvain`、`graphology-traversal` |
| 渲染程序 | `@sigma/node-image`、`@sigma/node-border`、`@sigma/node-square`、`@sigma/node-piechart`、`@sigma/edge-curve` |
| 图片导出 | `@sigma/export-image` |

`sigma` 与 `@sigma/*` 在模块顶层就读 `WebGL2RenderingContext`，静态 import 会让 SSR 直接报错。库内一律动态导入，**使用方也不要静态 import 它们**——渲染程序用 `defineSigmaProgram()` 声明延迟加载，见下方 `programs` 用法。

## 用法

```vue
<!-- pages/graph.vue -->
<script setup lang="ts">
import type { SerializedGraph } from 'graphology-types'

const data = ref(await $fetch<SerializedGraph>('/api/graph/overview'))
</script>

<template>
  <SigmaGraph :data="data" :settings="{ hideEdgesOnMove: true }" style="height: 70vh">
    <SigmaControls position="bottom-right">
      <SigmaZoomControl />
      <SigmaFullscreenControl />
    </SigmaControls>

    <SigmaTooltip />
    <GraphPanel />
  </SigmaGraph>
</template>
```

`useSigma()` 是 inject，所有 composable 都要在 `SigmaGraph` 子树内调用，因此消费上下文的部分是一个独立子组件——这也正是真实应用的结构：

```vue
<!-- components/GraphPanel.vue -->
<script setup lang="ts">
// 原生实例直达，sigma 与 graphology 的任何方法都能直接调
const { sigma, graph } = useSigma()

const { assign, isRunning, stop } = useSigmaLayout('forceatlas2', { worker: true })
const { selected, highlighted } = useSigmaSelection()
</script>

<template>
  <SigmaPopover :node="selected">
    <template #default="{ node, attributes, close }">
      <NodeDetail :node="node" :label="attributes.label" @close="close" />
    </template>
  </SigmaPopover>

  <div class="panel">
    <button type="button" @click="assign">重新布局</button>
    <button v-if="isRunning" type="button" @click="stop">停止迭代</button>
    <span>已高亮 {{ highlighted.size }} 个节点</span>
  </div>
</template>

<style scoped>
/* 默认插槽走正常文档流，排在占满高度的画布之后，面板需自行绝对定位 */
.panel {
  position: absolute;
  inset: 12px auto auto 12px;
}
</style>
```

自定义渲染程序经 `programs` 传入，`defineSigmaProgram()` 把动态 import 声明成延迟加载，组件会在建实例前解析完：

```vue
<script setup lang="ts">
const programs = {
  node: {
    bordered: defineSigmaProgram(() =>
      import('@sigma/node-border').then(m => m.createNodeBorderProgram({
        borders: [
          { size: { value: 0.1 }, color: { attribute: 'borderColor', defaultValue: '#3b82f6' } },
          { size: { fill: true }, color: { attribute: 'color' } }
        ]
      }))
    )
  }
}
</script>

<template>
  <SigmaGraph :data="data" :programs="programs" />
</template>
```

## API

模块的组件与 composables 都走 Nuxt 自动导入，无需手写 import；工具函数一并自动导入，也可从 `@movk/sigma` 根出口显式引入（公开类型同样从根出口取）。

**组件（11 个，全部 `Sigma` 前缀）**

| 组件 | 作用 |
| --- | --- |
| `SigmaGraph` | 根组件：实例生命周期、数据双通道、`settings` 透传、`programs`、全部 sigma 事件 |
| `SigmaOverlay` | 跟随相机的 DOM 覆盖层，锚定节点或图坐标 |
| `SigmaTooltip` | 悬浮或点击触发的提示层，支持节点与边 |
| `SigmaPopover` | 常驻浮层，`v-model:open` 控制显隐 |
| `SigmaContextMenu` | 右键菜单 |
| `SigmaControls` | 控件容器，四角停靠与横竖排布 |
| `SigmaZoomControl` | 缩放与复位 |
| `SigmaFullscreenControl` | 全屏切换 |
| `SigmaSearchControl` | 节点搜索与定位 |
| `SigmaLegend` | 分类图例，可切换显隐 |
| `SigmaMiniMap` | 缩略图与视口指示 |

控件零第三方依赖，只提供行为与无障碍结构。外观经插槽与 CSS 变量全接管，插槽作用域连行为一起暴露（如图例给出 `groups` 之外还给 `toggle` 与 `reset`），接管外观不等于丢掉功能。

**Composables（16 个）**

| 分组 | Composables |
| --- | --- |
| 基础 | `useSigma`、`useSigmaById`、`useSigmaIds`、`useSigmaGraph`、`useSigmaEvents`、`useSigmaSettings`、`useSigmaReducer` |
| 交互 | `useSigmaCamera`、`useSigmaSelection`、`useSigmaNeighborhood`、`useSigmaDrag`、`useSigmaSearch`、`useSigmaFilter` |
| 布局与分析 | `useSigmaLayout`、`useSigmaMetrics`、`useSigmaExport` |

`useSigmaById(id)` / `useSigmaIds()` 用于组件树之外访问实例，返回计算属性，目标实例挂载后引用自动填上。

**工具函数（7 个）**

| 函数 | 作用 |
| --- | --- |
| `applyGraphDiff` | 增量同步 `SerializedGraph`，保留已有节点的布局坐标 |
| `chainReducers` | 合成多个 reducer，绕开 sigma 只允许单个 reducer 的限制 |
| `curveParallelEdges` | 给平行边与自环分配曲率 |
| `defineSigmaProgram` | 声明延迟加载的渲染程序 |
| `sampleGraph` | 按度数抽样出概览子图 |
| `degreeToSize` | 度数映射到节点尺寸 |
| `communityToColor` | 社区划分映射到配色 |

## 样式

`src/runtime/index.css` 只覆盖内置控件与覆盖层，全部走 CSS 变量，暗色模式跟随 `prefers-color-scheme` 与 `.dark`：

```css
:root {
  --sigma-color-accent: #3b82f6;
  --sigma-control-size: 32px;
  --sigma-overlay-radius: 8px;
  --sigma-minimap-size: 160px;
}
```

不想要这套样式就在模块选项里设 `css: false`，控件的结构与行为不受影响。

## 演示

文档站不排期，演示职责由两个 playground 承担，同时充当「模块能否装进一个干净 Nuxt 项目」的验证信号：

| 目录 | UI 依赖 | 承载内容 |
| --- | --- | --- |
| `playgrounds/basic` | 零 | 34 个公开 API 的全量示例、内置控件的原样外观、1k / 5k / 20k 规模三档、纯原生逃生舱 |
| `playgrounds/ui` | `@movk/nuxt` | 插槽接管控件外观、服务端接口驱动的完整知识图谱场景 |

示例是自包含的单文件组件，除 `@movk/sigma`、`graphology`、`sigma` 与 Vue API 外不依赖任何东西，复制即可运行。

## 开发

```bash
pnpm install
pnpm dev:prepare     # 首次或依赖变更后必须先跑
pnpm dev             # 启动 playgrounds/basic
pnpm dev:ui          # 启动 playgrounds/ui
pnpm test
pnpm typecheck
pnpm lint
```

开发约定见 [AGENTS.md](AGENTS.md)，其中的红线（runtime 禁用自动导入、sigma 只能动态导入、模块级状态客户端隔离、出口兼容、官方类型、`@movk/core` 优先）必须遵守。

## 相关

- [架构方案](references/movk-sigma-architecture.md) —— 选型核查、技术难点与设计依据
- [sigma.js 上手指南](references/sigmajs-guide.md) —— 上游库本身怎么工作
- [sigma.js](https://www.sigmajs.org/) / [graphology](https://graphology.github.io/)
- [@movk/mapbox](https://mapbox.mhaibaraai.cn) —— 同系列的 Mapbox GL 封装

## License

[MIT](LICENSE)
