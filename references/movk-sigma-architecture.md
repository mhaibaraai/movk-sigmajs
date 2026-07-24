# @movk/sigma 架构方案

知识图谱可视化 Nuxt 模块的设计基线。本文档是后续实现的参考依据，记录了技术选型的核查过程、架构边界与不可逾越的红线。

- 版本：v1
- 核查日期：2026-07-24

## 背景

大规模知识图谱可视化（1000+ 节点、上万条边）在 Vue / Nuxt 生态里没有可用方案：`v-network-graph` 与 `@vue-flow/core` 走 SVG / DOM 渲染，在这个量级会崩；WebGL 方案 sigma.js 只有 React 封装。

本仓库补这个位：把 sigma v3 封装成 Nuxt 模块 `@movk/sigma`，提供声明式组件与 composables，覆盖图谱渲染、交互、布局、分析与覆盖层。

### 已确定的边界

- 消费方以 **Nuxt 为主**，主包即 Nuxt 模块（`pnpm create nuxt -t module` 布局，`src/` 直接在仓库根）
- **不做 Vite 插件**：它的全部价值是 `unplugin-vue-components` 的 resolver，属于 YAGNI
- 控件 UI **零第三方依赖**：只提供行为与无障碍结构，自带可选极简 CSS，外观经插槽与 CSS 变量全接管
- 领域能力（邻域展开、检索、详情面板）抽象成通用原语进库
- 文档站、MCP Server、llms.txt、Agent Skill 不排期，由 playground 承担演示职责，其 UI 依赖策略见第十二节
- 类型一律用官方类型包，通用方法一律优先 `@movk/core`
- **封装不得成为天花板**：原生 sigma / graphology 能力必须始终可直达，见第三节

## 一、为什么 Vue 侧没有现成的 sigma 封装

这是决定「要不要自己造」的前提。

**npm 全网无 Vue 封装。** `vue-sigma`、`vue3-sigma`、`sigma-vue`、`@vue-sigma/core`、`@sigma/vue` 全部 404。以 `sigma vue` 与 `graphology vue` 搜索 npm，返回结果里没有任何 Vue 封装。

三个具体原因：

1. **官方精力全给了 React。** `@react-sigma/core` 的 npm maintainer 是 `sim51` 与 `jacomyal`，后者是 sigma.js 的作者本人。官方自己维护 React 封装（v5.0.6，2025-12 仍在更新，含 layout / minimap / graph-search 全套子包），Vue 侧从来没人接。
2. **sigma 的出身圈子是 React 圈。** Sciences Po médialab（Gephi 血统），学术与数据新闻方向，前端生态几乎清一色 React。
3. **sigma 的 API 天然不「声明式」，包一层的动机本来就弱。** 它的全部可配置面就是一个扁平的 `settings` 对象加两个 reducer 函数，数据是 graphology 的可变对象、靠 mutation 驱动。不像 Mapbox 的 source / layer 是天然的声明单元，所以「做成组件库」的收益不直观。

空位真实存在，且 sigma 周下载 29.8 万、纯 WebGL 渲染，是这个规模下的正确底座。

### 依赖版本核查

| 包 | 版本 | 说明 |
| --- | --- | --- |
| `sigma` | 3.0.3 | 周下载 298,415 |
| `graphology` | 0.26.0 | 图数据结构 |
| `graphology-types` | 0.24.8 | 官方类型声明包 |
| `@sigma/node-image` / `node-border` / `node-square` | 3.0.0 | 官方节点渲染程序 |
| `@sigma/edge-curve` | 3.1.0 | 曲线边渲染程序 |
| `@sigma/export-image` / `utils` | 3.0.0 | 导出与视口工具 |
| `graphology-layout` / `-forceatlas2` / `-noverlap` | 0.6.1 / 0.10.1 / 0.4.2 | 布局算法 |
| `graphology-metrics` / `-communities-louvain` / `-traversal` | 2.4.0 / 2.0.2 / 0.3.1 | 图分析 |
| `@react-sigma/core` | 5.0.6 | 唯一成熟先例，可对照移植组件边界 |

## 二、架构：从 sigma 的真实 API 面出发

**不套用 `@movk/mapbox` 的形状。** Mapbox 有 source / layer 这样天然的子资源树，逐个建组件是对的；sigma 没有。sigma 的全部可变面是：

```text
new Sigma(graph, container, settings)
  ├── setSettings(obj)            # 扁平配置，含 nodeProgramClasses / edgeProgramClasses
  ├── nodeReducer / edgeReducer   # 各只能有一个
  ├── getCamera()                 # animate / ratio / x / y / angle
  ├── on(event, handler)          # node / edge / stage 三组事件
  └── graphToViewport / viewportToGraph / getNodeDisplayData
```

数据全在 graphology，是可变对象，靠 mutation 加 `nodeAdded` / `nodeAttributesUpdated` 等图事件驱动重绘。

### 划线原则：只有需要渲染 DOM 的才做成组件

| 能力 | 载体 | 理由 |
| --- | --- | --- |
| 数据注入 | 根组件 `data` / `v-model:graph` prop | 一个 Sigma 实例只有一张图，独立组件是多余的间接层 |
| 渲染程序注册 | 根组件 `programs` prop | 本质是 `settings.nodeProgramClasses` 的字段 |
| 样式归约 | `useSigmaReducer()` | 是函数不是 DOM，链式合成放 composable 更轻 |
| 布局 | `useSigmaLayout()` | 布局是「跑一次运算 / 起一个 worker」，是行为不是声明 |
| 相机、分析、导出 | composables | 同上 |
| 覆盖层、控件 | 组件 | 真的要渲染插槽内容与 DOM UI |

结果：11 个组件、14 个 composables。每个组件都有存在于 DOM 树的理由。

### 分层

```text
调用方数据源
        │  SerializedGraph（graphology 官方类型）
        ▼
┌──────────────────────────────────────────────────┐
│ SigmaGraph（根组件）                              │
│   客户端创建 Sigma 实例 + graphology 图           │
│   provide SigmaContext，注册到全局注册表           │
│   props: data / graph / settings / programs / id  │
├──────────────────────────────────────────────────┤
│ 默认插槽（O(1) 数量的 DOM）                        │
│   ├── SigmaControls  控件容器                     │
│   └── SigmaOverlay   覆盖层基座                   │
└──────────────────────────────────────────────────┘
        ▲
   composables：树内 useSigma() 注入 / 树外 useSigmaById(id)
```

## 三、原生能力的出口兼容

封装库最大的失败模式是**成为天花板**：库没覆盖的原生能力，用户就用不了。本库的设计前提是「封装是加法，不是围墙」，具体由以下十条保证。

### 1. 实例直达，不做代理

`useSigma()` 返回的是原生 `Sigma` 与 `Graph` 实例本身，不是 Proxy、不是包装对象。任何 sigma / graphology 的原生方法直接可调：

注意一个容易漏掉的点：Vue 会把 props 包成响应式代理，`props.graph` 拿到的可能是 `external` 的 Proxy 而非原对象。组件必须 `toRaw()` 剥回去再交给 sigma，否则下发的就不是「原生实例」，`instanceof` 与 graphology 的内部状态都可能出问题。已有单测断言构造时传入的就是原对象本身。

```vue
<script setup lang="ts">
const { sigma, graph, whenReady } = useSigma()

await whenReady()
sigma.value.getCamera().animatedReset({ duration: 600 })
graph.value.setNodeAttribute('n1', 'color', '#f43f5e')
</script>
```

`SigmaGraph` 的默认插槽同样以作用域暴露 `{ sigma, graph }`，模板里即可拿到。

### 2. settings 全透传，不做白名单

`settings` prop 的类型是 `Partial<Settings>`，整体透传给 sigma，不逐字段枚举、不过滤未知键。这意味着 sigma 未来新增的任何配置项立即可用，不需要等本库升级。这是「不枚举 props、只透传对象」的直接收益。

### 3. 事件双通道

组件 emits 覆盖 sigma 事件全集（33 个）；`useSigmaEvents()` 接受任意事件名，未被 emits 覆盖的也能绑定。两条通道之下，`sigma.on()` 始终可用。

emits 的类型必须**逐条写出**，不能用 `{ [K in SigmaEventType]: Parameters<SigmaEvents[K]> }` 这样的映射类型派生：`@vue/compiler-sfc` 要在编译期静态提取事件名，它解析不了跨包的映射类型——`vue-tsc` 能过但打包会失败。运行期的事件名列表另在 `runtime/types` 里以 `Record<SigmaEventType, true>` 维护，上游新增事件时它会先报错。

### 4. 数据双通道，可完全接管

- 传 `data`（`SerializedGraph`）：库负责 `applyGraphDiff` 增量同步
- 传 `graph`（外部 `Graph` 实例）：库完全不碰数据，只负责渲染与生命周期

后者意味着用户可以用 graphology 生态的任何方式（`graphology-operators`、`graphology-gexf`、自定义 mutation）操作图，库不干涉。两种模式互斥，同时传时以 `graph` 优先并在开发环境 warn。

### 5. 渲染程序完全开放

`programs` prop 接受任何符合 `NodeProgramType` / `EdgeProgramType` 的类——官方 `@sigma/*` 包、社区实现、用户手写的 WebGL 程序都一样。库不维护白名单，也不限制只能用官方程序。

### 6. reducer 链不吞掉用户的 reducer

用户在 `settings` 里直接传的 `nodeReducer` / `edgeReducer`，会被当作链的基座（`order` 最低）执行，库注册的在其后叠加，语义明确且不丢失。

需要明确写进文档的约束：运行期直接调 `sigma.setSetting('nodeReducer', fn)` 会在下一次链重算时被覆盖，这种场景应改用 `useSigmaReducer()`。

### 7. 布局可绕过

`useSigmaLayout()` 的价值只是「帮你管 worker 生命周期」。用户完全可以直接用 `graphology-layout-forceatlas2` 的原生 API 操作 `graph`，库不拦截、不冲突。

### 8. 覆盖层与控件不劫持画布

控件与覆盖层都是独立的 DOM 层，不接管 sigma 的 canvas、不改写 `sigma.getCanvases()`。用户可以一个控件都不用，自己写一套。

### 9. 不重导出、不改名

库不 re-export sigma / graphology 的任何值或类型，用户一律从原包直接 import。这样避免两个问题：版本错配（库夹带的版本与用户装的不一致），以及「这到底是库的类型还是原生类型」的认知负担。

### 10. peer 依赖，不夹带第二份实例

`sigma` 与 `graphology` 都是 peer 依赖。用户装什么版本就跑什么版本，库不锁死，也不会出现两份 `Graph` 类导致 `instanceof` 失败。

### 已知的耦合点

| 约束 | 说明 | 规避方式 |
| --- | --- | --- |
| 实例生命周期 | `SigmaGraph` 卸载时会 `sigma.kill()` | 外部持有引用者需自行判空 |
| `data` 与 `graph` 互斥 | 传了外部 `graph`，`data` 与 `diff` 不再生效 | 二选一，开发环境有 warn |
| reducer 运行期直改会被覆盖 | 见第 6 条 | 改用 `useSigmaReducer()` |

### 兼容性如何验证

- `playground/` 里放一个「纯原生逃生舱」示例：完全不使用库的任何 composable 与控件，只用 `SigmaGraph` 拿到实例后全走原生 API，证明封装可被绕过
- 单测断言 `settings` 透传未被过滤：传入一个库未知的键，从 `sigma.getSettings()` 读回来仍在
- 单测断言用户自带的 `settings.nodeReducer` 在链中被调用且位于最前

## 四、类型策略：全部用官方类型，不自造

**核查结论：这个生态没有任何 `@types/*` 包**（`@types/sigma`、`@types/graphology`、`@types/graphology-layout-forceatlas2`、`@types/graphology-metrics` 全部 404），所有包自带 `.d.ts`。**不要安装任何 `@types/*`。**

| 类型来源 | 提供的类型 | 用途 |
| --- | --- | --- |
| `graphology-types` | `SerializedGraph`、`SerializedNode`、`SerializedEdge`、`Attributes`、`NodeEntry`、`EdgeEntry` | 图数据契约。直接用 `SerializedGraph`，不自造 `GraphData` 接口 |
| `graphology` | `Graph`（`dist/graphology.d.ts` 自带） | 图实例 |
| `sigma/settings` | `Settings` | 渲染配置。sigma **未**单独导出 `NodeReducer` / `EdgeReducer`，它们是 `Settings` 上的内联字段类型，库内经 `NonNullable<Settings['nodeReducer']>` 派生 |
| `sigma/types` | `NodeDisplayData`、`EdgeDisplayData`、`CameraState`、`Coordinates`、`MouseCoords` 及各事件 payload | 事件、相机、显示数据 |
| `sigma/rendering` | `NodeProgramType`、`EdgeProgramType` | `programs` prop 的类型约束 |
| `graphology-layout*` / `-metrics` / `-communities-louvain` / `-traversal` | 各自 `index.d.ts` | 布局与分析选项 |
| `@movk/core` types | `Nullable`、`DeepPartial` 等通用工具类型 | 组件 props 辅助 |

本库只定义 sigma 与 graphology 覆盖不到的类型，且一律从官方类型派生而非重写：

- `SigmaContext`（注入上下文）
- 各组件 props，`settings` 一律写成 `Partial<Settings>`，`programs` 从 `NodeProgramType` / `EdgeProgramType` 派生
- `SigmaReducerEntry`（reducer 链条目）、`SigmaLayoutName`（布局名联合类型）

`@sigma/export-image` 与 `@sigma/utils` 的 `package.json` 未声明 `types` 字段，实现时需确认其 `exports` 是否提供类型入口；若确实缺失，在 `src/runtime/types/` 内补一份最小声明并标注来源。

## 五、七个核心技术难点

每一条都是 Vue / Nuxt 封装绕不开、且没有现成答案的地方。

### 1. graphology 可变对象与 Vue 响应式的桥接

graphology 的 `Graph` 是纯可变对象，Vue 的响应式系统完全抓不到它的变更。图例、统计面板、检索结果这类依赖图状态的 UI 会全部不更新。

方案：`useSigmaGraph()` 订阅 graphology 的 `nodeAdded` / `nodeDropped` / `nodeAttributesUpdated` / `edgeAdded` / `edgeDropped` / `cleared` 事件，桥接成 `shallowRef` 与单调递增的 `version` 计数，并提供 `watch(cb)`。**这是整个库的地基，必须最先做。**

### 2. sigma 只允许单个 reducer

高亮、淡出、图例显隐、过滤是四个独立关注点，但 sigma 各只接受一个 `nodeReducer` / `edgeReducer`，后注册的会覆盖先注册的。

方案：库内维护一条按 `order` 排序的 reducer 链，`useSigmaReducer()` 负责注册与随组件卸载注销，`chainReducers()` 合成为单个函数交给 sigma。用户自带的 reducer 作为链的基座，见第三节第 6 条。

### 3. 增量更新时保留布局坐标

天真的 `graph.clear()` 加 `graph.import()` 会让所有节点坐标重置，视觉上整张图跳一次。

方案：`applyGraphDiff(graph, next, options)` 逐项 diff 增删改。节点属性按新数据整体替换，唯一例外是坐标：新数据显式给出 `x` / `y` 时以新值为准（服务端重算布局的场景），未给出则沿用图上现有坐标（避免跳动）。只有新增节点才需要布局。

端点不在图中的边会被跳过并在开发环境告警。「概览 + 按需扩展」模式下增量数据引用尚未加载的节点是正常情况，交给 graphology 只会抛出难以定位的 `NotFoundGraphError`。

### 4. DOM 覆盖层与相机的坐标同步

sigma 没有 Mapbox 那样的 Marker / Popup 概念，覆盖层要自己算位置。

**两套坐标不能混用。** `getNodeDisplayData()` 返回的是 sigma 归一化后的 framed 坐标，必须走 `framedGraphToViewport()`（sigma 自身定位标签与 hover 就是这么做的）；用户直接给的原始图坐标才用 `graphToViewport()`。搞混会让覆盖层整体错位。

方案：`SigmaOverlay` 按锚定方式选择换算函数，订阅 `afterRender` 事件同步位置——相机移动、图变更、容器缩放都会触发重绘，跟着重绘走即可覆盖全部情况。节点不存在或被隐藏时自动隐藏。Tooltip / Popover / ContextMenu 全部基于它。

覆盖层用 `v-show` 保留 DOM 以避免频繁重建，因此**隐藏时必须用 `v-if` 跳过插槽内容**：否则使用方会拿到空的作用域参数，隐藏的内容也仍可被点击。

### 5. SSR 与容器尺寸

**只推迟实例化不够，`import` 本身就会崩。** sigma 在模块顶层用 `WebGL2RenderingContext.BOOL` 一类常量建查找表，服务端没有这两个全局，`import 'sigma'` 与 `import 'sigma/settings'` 会直接 `ReferenceError`（已实测）。graphology 无此问题，可正常静态导入。

方案：`SigmaGraph` 里 sigma 一律**动态导入**，在 `onMounted` 内 `await import('sigma')` 之后再实例化，SSR 阶段只渲染空容器，调用方无需手动包 `<ClientOnly>`。类型侧用 `import type` 引入，编译期即擦除。

由此带来两个附加约束：

- `onMounted` 是异步的，实例化完成前卸载要能中断，避免残留实例
- 单测里 happy-dom 同样没有 WebGL 全局，需在 `test/setup/` 补一组桩，测试才能加载真实的 `sigma/settings` 去断言内置渲染程序

容器尺寸为 0 的情况用 `allowInvalidContainer` 兜底（作为库的默认值，用户可覆盖），并由 `useResizeObserver` 在尺寸变化时补 `sigma.resize()`。

### 6. 布局 worker 的生命周期

ForceAtlas2 与 Noverlap 的 worker 版本会持续占用线程，组件卸载或 HMR 时不 kill 就泄漏。

方案：`useSigmaLayout()` 统一在 `onScopeDispose` 中 `kill()`，并暴露 `isRunning` 供 UI 反馈。

### 7. runtime 目录禁用自动导入

Nuxt 官方明确：已发布模块的 `src/runtime/` 内不能依赖自动导入（`node_modules` 内出于性能不启用）。所有 Vue API、`@movk/core`、`@vueuse/core`、库内 composables 与工具函数在 runtime 代码里必须显式 import。这是最容易在本地 playground 通过、发布后炸掉的坑。

副作用是好的：runtime 代码本来就全是显式 import，日后若要补一个纯 Vue 3 插件入口（`src/vue-plugin.ts`），只需加一个 `install()` 注册组件，几乎零成本。

## 六、组件清单

命名一律 `Sigma` 前缀，遵循 Nuxt 模块最佳实践的防冲突约定。

### core

| 组件 | 职责 | 关键 props / emits / slots |
| --- | --- | --- |
| `SigmaGraph` | 根组件。客户端创建 Sigma 实例与 graphology 图，下发 `SigmaContext`，注册到全局注册表 | props: `data`（`SerializedGraph`）、`graph`（`v-model`，外部 `Graph` 实例）、`settings`（`Partial<Settings>`）、`programs`、`id`、`autoFit`、`diff`；emits: sigma 事件全集与 `ready`；slot: default，作用域暴露 `{ sigma, graph }` |
| `SigmaOverlay` | 通用锚定层，锚到 `node`（key）或 `position`（`Coordinates`），随相机同步 | props: `node`、`position`、`offset` |
| `SigmaTooltip` | 悬浮 / 点击触发，插槽以 `{ type, id, attributes }` 暴露命中项。键名用 `id` 而非 `key`，后者是 Vue 的保留属性 | props: `trigger`、`target`、`offset` |
| `SigmaPopover` | 锚定到指定节点的常驻浮层，插槽自定义内容。「点击节点展示详情」的落点 | props: `node`、`open`（`v-model`）、`placement` |
| `SigmaContextMenu` | 右键菜单，插槽暴露命中项 | props: `target` |

### controls

零第三方依赖，行为与无障碍结构由库提供，外观可全接管。

| 组件 | 职责 |
| --- | --- |
| `SigmaControls` | 控件容器，`position` 控制四角停靠 |
| `SigmaZoomControl` | 放大 / 缩小 / 复位 |
| `SigmaFullscreenControl` | 全屏切换 |
| `SigmaSearchControl` | 节点检索输入与结果列表，选中后相机聚焦 |
| `SigmaLegend` | 按分类字段聚合图例，点击切换显隐（落到 reducer 的 `hidden`） |
| `SigmaMiniMap` | 缩略图与视口框 |

导出不做成组件——`useSigmaExport()` 加一个调用方自己的按钮即可，包一层没有增量价值。

## 七、Composables

### 基础

| Composable | 返回 / 职责 |
| --- | --- |
| `useSigma()` | `{ sigma, graph, isReady, whenReady() }`，树内注入，返回原生实例 |
| `useSigmaById(id)` | 按 id 从全局注册表取，树外或跨路由访问 |
| `useSigmaGraph()` | 响应式桥接，`{ graph, version, order, size, onGraphUpdate() }`。回调不叫 `watch` 是为了避免与 Vue 自动导入的 `watch` 撞名。见难点 1 |
| `useSigmaEvents(handlers)` | 声明式绑定 sigma 事件，接受任意事件名，卸载自动解绑 |
| `useSigmaSettings(source)` | 响应式 `setSettings` |
| `useSigmaReducer(node?, edge?, order?)` | reducer 链注册。见难点 2 |

### 交互

| Composable | 返回 / 职责 |
| --- | --- |
| `useSigmaCamera()` | `{ zoomIn, zoomOut, reset, goto, gotoNode, fitTo, getState, toViewport }`，基于原生 `camera` 的 `animatedZoom` / `animatedUnzoom` / `animatedReset` / `animate`。`fitTo` 依赖可选 peer `@sigma/utils`，用到时才动态导入，未安装则给出可操作的报错 |
| `useSigmaSelection()` | hover / selected / focused 状态机，内建高亮与淡出 reducer。核心交互原语 |
| `useSigmaNeighborhood()` | N 度邻域 BFS，并提供 `expand(key, loader)` 拉取远端邻域后增量合并。BFS 走核心的 `graph.neighbors()`（有向图上同时返回出入两侧，正是图谱浏览要的可达性语义），不引入 `graphology-traversal` 这个可选 peer。「点击展开」的落点 |
| `useSigmaSearch(options)` | 按 label 与属性模糊检索节点与边 |
| `useSigmaFilter()` | 声明式过滤（按类型、属性、度数），落到 reducer 的 `hidden` |

### 布局与分析

| Composable | 返回 / 职责 |
| --- | --- |
| `useSigmaLayout(name, options)` | 统一布局入口，`name` 取 `forceatlas2` / `noverlap` / `circular` / `circlepack` / `random`；返回 `{ assign, start, stop, isRunning }`，迭代型才有 `start` / `stop`。worker 生命周期托管，见难点 6 |
| `useSigmaMetrics()` | 度数、中心性、Louvain 社区，惰性计算并按 `version` 缓存 |
| `useSigmaExport()` | `toPNG` / `download`，基于 `@sigma/export-image` |

## 八、工具函数与 @movk/core 复用

### 优先复用 @movk/core

| 用途 | core 函数 |
| --- | --- |
| 检索输入防抖、相机事件节流 | `debounce`、`throttle` |
| 检索结果关键字高亮 | `splitHighlight` |
| 导出图片下载、SVG 转 PNG | `triggerDownload`、`convertSvgToPng` |
| settings 深度合并 | `deepMerge` |
| 实例默认 id | `getRandomUUID` |
| 无 key 边的稳定 id | `simpleHash` |
| 节点属性裁剪 | `pick`、`omit` |
| 邻域 key 去重 | `unique` |
| 覆盖层 offset 支持 CSS 长度 | `lengthToPx` |
| 输入校验 | `isEmpty`、`isString`、`isNumber`、`isPlainObject` |
| 图例 / 过滤状态持久化（可选） | `useAppStorage` |
| 通用工具类型 | `Nullable`、`DeepPartial` |

### 本库自有

图与 sigma 领域的逻辑，不属于 core 范畴，放在 `src/runtime/utils/`：

- `applyGraphDiff(graph, next, options)` —— 增量 diff，`preservePositions` 保留已有 `x` / `y`，`prune` 控制是否剪除新数据外的节点与边。见难点 3
- `mergeGraphData(a, b)` —— 合并邻域展开返回的 `SerializedGraph`
- `sampleGraph(graph, n)` —— 大图概览抽样（按度数取 Top-N 及其邻边）
- `degreeToSize(graph, range)` / `communityToColor(graph, palette)` —— 视觉映射
- `chainReducers(...fns)` —— reducer 链合成。见难点 2

### core 缺口：先写在本仓库，后续移入 core

这几个是通用能力但 core 目前没有。统一放在 `src/runtime/utils/core-candidates.ts`，文件头与每个函数的 JSDoc 标注 `@todo 待移入 @movk/core`，便于后续整体搬迁：

| 函数 | 说明 | 本库用处 |
| --- | --- | --- |
| `clamp(value, min, max)` | 数值区间钳制。core 没有任何数值类工具 | 相机 ratio 约束、尺寸映射 |
| `mapRange(value, inRange, outRange)` | 线性区间映射 | `degreeToSize` 的内核 |
| `createRegistry<T>()` | 按 id 注册 / 获取 / 注销实例的通用注册表 | `useSigmaById`。`@movk/mapbox` 的 `useMapbox` 是同款需求，最该进 core 的一个 |
| `pipe(...fns)` | 同签名函数链式合成的泛型形式 | `chainReducers` 的底层 |

## 九、规模与性能策略

面向 1000+ 节点的场景：

- 默认开启 `hideEdgesOnMove`，并给出 `labelRenderedSizeThreshold` / `labelDensity` 的推荐值
- ForceAtlas2 与 Noverlap 一律走 worker，主线程不阻塞
- 推荐「概览 + 按需扩展」而非一次性全量渲染：首屏走概览数据或 `sampleGraph`，点击节点再 `expand` 增量合并
- 节点属性只带渲染必需字段，详情正文经 `SigmaPopover` 懒加载
- 最稳的路径：服务端预计算并持久化 `x` / `y` 到节点属性，前端跳过布局直接渲染

## 十、数据接口契约

库只消费 `SerializedGraph`，与任何后端实现解耦。推荐服务端提供四类接口：

| 接口 | 返回 | 对应的库能力 |
| --- | --- | --- |
| `GET /api/graph/overview?limit=` | `SerializedGraph` | `SigmaGraph` 的 `data` |
| `GET /api/graph/nodes/{id}/neighbors?depth=1` | `SerializedGraph` | `useSigmaNeighborhood().expand()` |
| `GET /api/graph/search?q=` | `Array<{ key, label, type }>` | `SigmaSearchControl` |
| `GET /api/nodes/{id}/detail` | 详情载荷 | `SigmaPopover` 懒加载 |

## 十一、典型场景验证

用一个具体场景校验能力覆盖是否完整——文档制度类知识图谱：制度是节点、关联关系是边、条款是节点的详情载荷。

| 场景需求 | 承接的能力 |
| --- | --- |
| 展示全部实体间的关联关系 | `SigmaGraph` + `useSigmaLayout('forceatlas2')`（worker）+ 概览数据 |
| 点击节点展示对应详情条目 | `useSigmaSelection` 记录 selected → `SigmaPopover` 锚定该节点 → 懒加载详情接口 |
| 图谱质量与精度的人工核查 | `useSigmaMetrics` 的度数与社区着色；`SigmaLegend` 按类别分层查看 |
| 增量更新 | `applyGraphDiff` 保留坐标；`useSigmaNeighborhood().expand()` 按需合并 |
| 1000+ 规模 | 概览加展开、worker 布局、标签密度控制、服务端预布局 |

领域模型不进库，只在 `playground/` 里作为示例出现。

## 十二、工程形态

采用 Nuxt 官方模块脚手架布局（`pnpm create nuxt -t module`），`src/` 直接在仓库根：

```text
movk-sigmajs/
├── src/
│   ├── module.ts             # defineNuxtModule：meta / defaults / setup
│   └── runtime/
│       ├── components/       # core / controls 两组
│       ├── composables/
│       ├── utils/
│       │   └── core-candidates.ts   # 待移入 @movk/core 的通用函数
│       ├── types/
│       └── index.css         # 可选样式表
├── playground/               # Nuxt 演示应用，M4 起拆为 playgrounds/basic 与 playgrounds/ui
├── test/                     # vitest + happy-dom + @vue/test-utils
├── references/               # 本架构方案与背景资料
├── .mcp.json
├── AGENTS.md
├── README.md
├── package.json
├── build.config.ts
├── eslint.config.mjs
├── vitest.config.ts
└── tsconfig.json
```

### module.ts 的 setup 要点

- `createResolver` 取绝对路径
- `addComponentsDir` 注册 `runtime/components`，组件文件名不带前缀，由 `prefix` 选项（默认 `'Sigma'`）统一加上，并用 `pathPrefix: false` 让目录层级不参与命名
- `addImportsDir` 注册 `runtime/composables` 与 `runtime/utils`
- `meta.configKey` 用 `sigma`，`meta.compatibility` 声明 Nuxt 版本约束
- `defaults` 承载全局默认 `settings`，与组件级 `settings` 用 `@movk/core` 的 `deepMerge` 合并
- 样式经 `nuxt.options.css` 按开关注入，默认可关闭
- setup 内不做耗时超过 1s 的同步逻辑，重活挂到 Nuxt hooks

### 演示应用的 UI 依赖策略

文档站不排期，演示职责全部由 playground 承担。它同时是「模块能否装进一个干净 Nuxt 项目」的验证信号，两个职责有冲突，因此分区处理。

playground 不在 `files: ["dist"]` 内，不进用户依赖树，「控件零依赖」约束的是 `src/runtime/` 而非 playground。所以这是取舍问题，不是红线问题。

**M4 之前不引入任何 UI 库。** M1 到 M3 展示的是渲染与交互原语，一个按钮加一段 `<pre>` 就够，引入 UI 库只有负担没有信息量。

**M4 起拆成两个：**

| 目录 | UI 依赖 | 承载内容 |
| --- | --- | --- |
| `playgrounds/basic` | 零，永远不引入 | 核心渲染、内置控件的原样外观、纯原生逃生舱示例 |
| `playgrounds/ui` | `@movk/nuxt` | 插槽接管控件外观、完整知识图谱场景 |

必须分区的三条理由：

- 第三节的逃生舱示例，说服力全部来自「不用库的任何东西也能跑」，混进 UI 库就废了
- 内置控件自带极简 CSS 与 CSS 变量，若外观全被 UI 库接管，这套样式无人可见也就无人验证
- 混入大型 UI 模块后，样式冲突、自动导入冲突、构建失败都难以归因，验证信号被污染

选 `@movk/nuxt` 而非直接用 `@nuxt/ui`：前者本身就建在后者之上，直接用 `@nuxt/ui` 少了一层；且演示两个 movk 库如何配合更贴近实际项目。

一个硬约束：`@movk/nuxt` 的安装文档建议 pnpm 下设 `shamefully-hoist=true`。**本仓库不接受**——它把所有依赖提升到根 `node_modules`，会让 `src/runtime/` 里漏写的 import 也能解析成功，正好掩盖难点 7 要防的那类 bug。改为把 `tailwindcss` 显式装进 `playgrounds/ui` 这个 workspace。

### 构建与发布

- 构建：`nuxt-module-build build`（`@nuxt/module-builder`）
- 脚本：`dev:prepare` / `dev` / `dev:build` / `lint` / `test` / `typecheck` / `prepack` / `release`
- 发布：`release-it` + conventional-changelog

### 依赖策略

- dependencies：`@movk/core`、`@vueuse/core`、`consola`
- peer：`vue@>=3.5`、`sigma@>=3`、`graphology@>=0.26`
- optional peer（`peerDependenciesMeta.optional`）：`@sigma/node-image`、`@sigma/node-border`、`@sigma/edge-curve`、`@sigma/export-image`、`@sigma/utils`、`graphology-layout`、`graphology-layout-forceatlas2`、`graphology-layout-noverlap`、`graphology-metrics`、`graphology-communities-louvain`、`graphology-traversal`
- devDependencies 里加 `graphology-types`（纯类型声明包）
- 不安装任何 `@types/*`，该生态全部包自带类型

### 测试

- 单测（vitest + happy-dom）覆盖工具函数与 composables：`applyGraphDiff` 的坐标保留、`chainReducers` 的合成顺序、`useSigmaGraph` 的 version 递增、`useSigmaNeighborhood` 的 BFS 深度
- 出口兼容专项断言：`settings` 未知键透传、传入的 graph 是原对象而非代理、用户自带 reducer 位于链首
- 组件测试用 `@vue/test-utils`，mock 掉 Sigma 构造；`test/setup/` 里补 WebGL 全局桩，否则 `sigma/settings` 无法加载
- 组件的 `onMounted` 是异步的（动态导入 sigma），断言前必须轮询到实例真正创建，只 `flushPromises()` 会读到别的用例迟到解析出的调用
- 需要真实 Nuxt 环境的场景用 `@nuxt/test-utils` 加 `test/fixtures/*`

根 `tsconfig.json` 必须 `extends: "./.nuxt/tsconfig.json"`。若改成指向 `.nuxt/tsconfig.*.json` 的 project references 写法，`vue-tsc --noEmit` 会**完全跳过 `src/`**，typecheck 变成空转却仍然退出码 0。

## 十三、里程碑

| 阶段 | 内容 |
| --- | --- |
| M0 脚手架 | `pnpm create nuxt -t module` 初始化；补齐 `.mcp.json` / `AGENTS.md` / `README.md`；`playground/` 与 `test/` 骨架跑通 |
| M1 地基 | `useSigmaGraph` 响应式桥接、`SigmaGraph` 根组件（含 SSR、容器尺寸、出口兼容三条通道）、`useSigma` / `useSigmaById` / `useSigmaEvents` / `useSigmaSettings` / `useSigmaCamera`、`applyGraphDiff`、`core-candidates.ts`；playground 的「纯原生逃生舱」示例 |
| M2 交互原语 | `useSigmaReducer` 与 `chainReducers`、`useSigmaSelection`、`useSigmaNeighborhood`、`SigmaOverlay` / `Tooltip` / `Popover` / `ContextMenu` |
| M3 布局与分析 | `useSigmaLayout`（worker 生命周期）、`useSigmaMetrics`、`useSigmaSearch`、`useSigmaFilter`、`programs` prop 与官方渲染程序接入 |
| M4 控件与样式 | `SigmaControls` 全家、`runtime/index.css` 与 CSS 变量体系、`useSigmaExport`；playground 拆为 `playgrounds/basic` 与 `playgrounds/ui`，后者接入 `@movk/nuxt` 演示插槽接管外观 |

文档站、MCP Server、llms.txt、Agent Skill 列为后续候选，本轮不排期。
