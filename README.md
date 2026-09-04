[![Movk Sigma](https://sigma.mhaibaraai.cn/og-image.png)](https://sigma.mhaibaraai.cn/)

> 基于 sigma v4 与 graphology 的知识图谱可视化 Nuxt 模块 —— 用 `SigmaGraph` 等组件与 composables 声明式组合渲染、交互、布局与分析，面向 1000+ 节点的大规模图谱。封装是加法，不是围墙：`useSigma()` 返回原生 `Sigma` 与 `Graph` 实例，`settings` 整体透传，`sigma` 与 `graphology` 始终是 peer 依赖。

[![Install MCP in Cursor](https://sigma.mhaibaraai.cn/mcp/badge.svg)](https://sigma.mhaibaraai.cn/mcp/deeplink)
[![Install MCP in VS Code](https://sigma.mhaibaraai.cn/mcp/badge.svg?ide=vscode)](https://sigma.mhaibaraai.cn/mcp/deeplink?ide=vscode)

[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Nuxt](https://img.shields.io/badge/Nuxt-4-00DC82.svg)](https://nuxt.com/)
[![sigma.js](https://img.shields.io/badge/sigma.js-v4-e11d48.svg)](https://v4.sigmajs.org/)
[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]

- 📖 [在线文档](https://sigma.mhaibaraai.cn)

## ✨ 特性

- **声明式组合** - 用 `SigmaGraph` 与子组件搭建图谱、覆盖层与控件，状态即视图，无需手写命令式的实例管理。
- **原生实例直达** - `useSigma()` 返回原生 `Sigma` 与 `Graph`，不包 Proxy、不做代理，sigma 与 graphology 的任何方法都能直接调。
- **数据双通道** - 传 `data` 由库做增量 diff 并保留布局坐标；传 `graph` 则库完全不碰数据，只负责渲染与生命周期。
- **styles 声明式视觉层** - 与 `settings`（行为/性能）分工明确，规则支持常量、属性绑定、数值映射与状态条件，`SigmaGraph` 自动与基础规则合成。
- **交互 composables** - 悬浮/选中高亮、邻域扩散、拖拽、搜索、过滤、标签分级，开箱即用又能单独拆开。
- **布局与分析** - `useSigmaLayout` 统一五种布局算法并托管 ForceAtlas2 / Noverlap 的 worker 生命周期，`useSigmaMetrics` 提供度数、中心性与社区划分。
- **DOM 覆盖层** - Overlay / Tooltip / Popover / ContextMenu 四种覆盖层随画布定位，控件外观全部可用插槽接管。
- **AI 友好** - 内置 MCP Server 与 llms.txt，组件、composable、文档可被 AI 智能体检索。

## 🚀 快速开始

### 安装

```bash
# pnpm
pnpm add @movk/sigma sigma graphology

# yarn
yarn add @movk/sigma sigma graphology

# npm
npm install @movk/sigma sigma graphology
```

`sigma` 与 `graphology` 是必需的 peer 依赖，由你自己安装——这样整个应用里只有一份 sigma 实例，也不会因为本模块的版本区间限制你升级上游。

### Nuxt

在 `nuxt.config.ts` 中注册模块：

```ts
export default defineNuxtConfig({
  modules: ['@movk/sigma'],

  sigma: {
    prefix: 'Sigma',
    settings: { hideEdgesOnMove: true },
    css: true
  }
})
```

组件与 composables 自动导入，开箱即用。

### 基础示例

组件本身不带高度，画布用 `height: 100%` 占满容器，外层需要给出确定的高度：

```vue
<script setup lang="ts">
import type { SerializedGraph } from 'graphology-types'

const data: SerializedGraph = {
  attributes: {},
  options: { type: 'mixed', multi: false, allowSelfLoops: true },
  nodes: [
    { key: '1', attributes: { label: 'Node 1', x: 0, y: 0, size: 6, color: '#f43f5e' } },
    { key: '2', attributes: { label: 'Node 2', x: 5, y: 10, size: 6, color: '#3b82f6' } }
  ],
  edges: [{ source: '1', target: '2', attributes: { size: 2 } }]
}
</script>

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

## 📦 核心功能

### 声明式组件

组件全局加 `Sigma` 前缀（默认前缀可配），按领域分组：

| 分类 | 组件 |
| --- | --- |
| 核心 | `SigmaGraph` `SigmaOverlay` `SigmaTooltip` `SigmaPopover` `SigmaContextMenu` |
| 控件 | `SigmaControls` `SigmaZoomControl` `SigmaFullscreenControl` `SigmaSearchControl` `SigmaLegend` `SigmaMiniMap` |

### Composables

- `useSigma()` / `useSigmaById(id)` / `useSigmaIds()` — 注入或按 id 取当前图谱的上下文，返回原生 `Sigma` 与 `Graph`。
- `useSigmaGraph(source?)` — 把 graphology 的变更桥接成 Vue 的响应式信号。
- `useSigmaEvents(handlers)` — 声明式绑定 sigma 事件，作用域销毁时自动解绑。
- `useSigmaSettings(source)` — 把响应式配置同步到 sigma，整体透传不做键过滤。
- `useSigmaState()` — 读写 sigma 的交互状态（悬停、高亮、隐藏）。
- `useSigmaCamera()` — 缩放、复位、聚焦节点，以及图坐标到屏幕坐标的换算。
- `useSigmaSelection(options?)` — 悬浮与选中的状态机，焦点及其邻居写进 `isHighlighted`。
- `useSigmaNeighborhood(options?)` — 以某节点为中心逐层扩散的 BFS 邻域计算。
- `useSigmaDrag(options?)` — 把 sigma 的节点拖拽接进 Vue 响应式。
- `useSigmaSearch(options?)` — 按属性检索节点与边，可把相机聚焦到命中项。
- `useSigmaFilter(options?)` — 声明式过滤，落到 sigma 的 `isHidden` 状态上。
- `useSigmaLabelTiers(options?)` — 按相机比例分级显示标签。
- `useSigmaLayout(name, options?)` — 五种布局算法的统一入口，托管 worker 生命周期。
- `useSigmaMetrics()` — 度数、中心性与社区划分，按图版本缓存。
- `useSigmaExport()` — 把当前画面导出为 PNG。

### 工具函数

```ts
import { applyGraphDiff, composeStyles, defineSigmaPrimitives, degreeToTier, labelPlacements, sdfPolygon, sdfStar } from '@movk/sigma'
```

- `applyGraphDiff` — 把新旧两份 `SerializedGraph` 做增量 diff 并应用到实例。
- `composeStyles` — 按序拼接多份 styles 声明，`SigmaGraph` 内部默认调用。
- `labelPlacements` / `degreeToTier` — 标签方位分配与度数分档，配合 `useSigmaLabelTiers` 使用。
- `sdfPolygon` / `sdfStar` — 正多边形与星形的 SDF 节点形状声明，纯数据、可直接静态引入。
- `defineSigmaPrimitives` — 声明延迟加载的渲染原语，绕开 sigma 在 SSR 下的 WebGL 顶层读取限制。

## 🏗️ 架构分层

- **Nuxt 模块** - `src/module.ts` 注册组件与 composables，把全局 `settings` / `css` 等选项写入模块配置。
- **运行时** - `src/runtime` 内 `SigmaGraph` 经 provide/inject 下发上下文，`useSigma()` 是子组件取实例的统一入口；`styles` / `primitives` / reducer 只在构造时读取，变更触发重建。
- **SSR 安全** - sigma 各子路径在模块顶层读 `WebGL2RenderingContext`，库内一律动态导入；`defineSigmaPrimitives()` 让自定义渲染原语延迟到实例创建前解析。
- **基座** - 构建于 [sigma.js v4](https://v4.sigmajs.org/)、[graphology](https://graphology.github.io/) 与 [VueUse](https://vueuse.org/)，布局、分析与部分渲染程序以可选 peer 按需引入。

## ⚡ 技术栈

- [sigma.js v4](https://v4.sigmajs.org/) - WebGL 图渲染引擎
- [graphology](https://graphology.github.io/) - 图数据结构与算法生态
- [Nuxt 4](https://nuxt.com/) - The Intuitive Vue Framework
- [Vue 3.5](https://vuejs.org/) - The Progressive JavaScript Framework
- [TypeScript](https://www.typescriptlang.org/) - JavaScript with syntax for types
- [Vitest](https://vitest.dev/) - Next Generation Testing Framework

## 📄 许可证

[MIT](./LICENSE) License © 2024-PRESENT [YiXuan](https://github.com/mhaibaraai)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@movk/sigma?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/@movk/sigma

[npm-downloads-src]: https://img.shields.io/npm/dm/@movk/sigma?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/@movk/sigma

[license-src]: https://img.shields.io/github/license/mhaibaraai/movk-sigmajs.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/mhaibaraai/movk-sigmajs/blob/main/LICENSE
