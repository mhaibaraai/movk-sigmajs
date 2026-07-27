# sigma.js 上手指南

面向没用过 sigma.js 的读者，讲清楚**上游库本身**怎么工作。读完这份再看 `@movk/sigma` 的封装，每个设计决策的由来都会变得显然。

- 核查版本：`sigma@3.0.3`、`graphology@0.26.0`、`graphology-types@0.24.8`
- 核查日期：2026-07-27
- 与 [movk-sigma-architecture.md](movk-sigma-architecture.md) 的分工：那份讲「本库为什么这样封装」，这份讲「sigma 原本是什么样」

文中所有默认值、报错文案、函数签名均摘自本仓库 `node_modules/` 内的实际源码，不是凭记忆写的。凡是与官方文档表述有出入的地方，以本文为准，因为本文对着装在这台机器上的那份代码核过。

## 一、心智模型：三层，各管一件事

绝大多数上手困惑都来自把这三层混为一谈。

```text
graphology Graph            数据层：谁和谁有关系，每个节点挂什么属性
        │  实例引用（不复制、不快照）
        ▼
Sigma                       渲染层：把数据画到 canvas，管相机、事件、命中检测
        │  每帧对每个可见项调用一次
        ▼
nodeReducer / edgeReducer   显示层：这一帧这个节点长什么样（不回写数据）
```

三条关键认知：

1. **sigma 不存数据。** `new Sigma(graph, container)` 只是持有 graph 的引用。图有多少节点、节点上有什么属性，全部是 graphology 的事。
2. **graphology 是可变对象，mutation 就是唯一的更新手段。** 没有 `setState`、没有 diff、没有虚拟 DOM。`graph.setNodeAttribute('n1', 'color', 'red')` 之后 sigma 自动重绘，因为它订阅了图事件。这与 Vue 的响应式是两套完全独立的机制，二者不互通——这正是 `useSigmaGraph()` 存在的全部理由。
3. **reducer 是「显示期的临时覆盖」，不落库。** 高亮、淡出、按图例隐藏、按条件过滤，全部走这一层，图数据一个字节都不动。想清楚「这个改动该落到数据还是落到 reducer」，是用好 sigma 的分水岭。

一个常见的错误直觉：想让某个节点变红，于是去改数据。如果这个红是**业务事实**（这个节点被标记为高危），改数据是对的；如果这个红是**交互状态**（鼠标悬停到了它），必须走 reducer，否则鼠标移开后你还得记得改回去，且这个临时状态会被 `graph.export()` 一起导出。

## 二、graphology 速成

sigma 只认 graphology，没有第二种数据源。所以先把这一层弄明白。

### 2.1 建图

```ts
import Graph, { DirectedGraph, MultiGraph, UndirectedGraph } from 'graphology'

const graph = new Graph() // 默认 mixed，非多重图
const directed = new DirectedGraph()
const multi = new MultiGraph() // 允许同一对端点之间有多条边
```

构造选项在类型上是 `GraphOptions`：

| 选项 | 取值 | 默认 | 含义 |
| --- | --- | --- | --- |
| `type` | `'mixed'` / `'directed'` / `'undirected'` | `'mixed'` | 边的方向性。`mixed` 允许两种边共存 |
| `multi` | `boolean` | `false` | 是否允许平行边 |
| `allowSelfLoops` | `boolean` | `true` | 是否允许自环 |

选错的代价是隐性的：非多重图上重复 `addEdge('a', 'b')` 会抛 `UsageGraphError`，而 `mergeEdge('a', 'b')` 会静默复用已有的那条边。知识图谱里「同一对实体之间有多种关系」很常见，那就得 `multi: true`。

### 2.2 增、删、改：三组语义要分清

| 前缀 | 已存在时的行为 | 用在哪 |
| --- | --- | --- |
| `add*` | 抛 `UsageGraphError` | 你确信是新增，希望重复时立刻炸出来 |
| `merge*` | 合并属性，不抛错（幂等） | 增量同步、批量导入，绝大多数场景用它 |
| `update*` | 传更新函数 `(attr) => newAttr` | 需要基于旧值算新值 |

```ts
graph.addNode('n1', { label: '节点 1', x: 0, y: 0, size: 10 })
graph.mergeNode('n1', { color: '#0ea5e9' }) // 幂等，已存在则合并属性
graph.updateNode('n1', attr => ({ ...attr, size: attr.size * 2 }))

graph.addEdge('n1', 'n2') // 自动生成边 key，形如 "geid_xx_x"
graph.addEdgeWithKey('e1', 'n1', 'n2', { label: '引用' }) // 自己给 key

graph.dropNode('n1') // 连带删掉它的所有边
graph.dropEdge('e1')
graph.clear() // 清空节点与边
graph.clearEdges() // 只清边
```

**边的 key 值得单独说。** 不显式给 key 时 graphology 自动生成，这个 key 在重新导入时不稳定。凡是需要「按 id 定位某条边」或者做增量 diff 的场景，一律显式给 key——本仓库 `applyGraphDiff` 的那条「无 key 的边在多重图上一律新增」约束就是这么来的。

### 2.3 属性读写

```ts
graph.getNodeAttribute('n1', 'label')
graph.getNodeAttributes('n1') // 整个属性对象
graph.setNodeAttribute('n1', 'color', '#f43f5e')
graph.mergeNodeAttributes('n1', { color: '#f43f5e', size: 20 })

// 批量：只触发一次 eachNodeAttributesUpdated，比循环 setNodeAttribute 高效得多
graph.updateEachNodeAttributes((key, attr) => ({ ...attr, size: 10 }))
```

边侧有完全对称的一套 `getEdgeAttribute` / `setEdgeAttributes` / `updateEachEdgeAttributes`，另外还有按端点定位的重载 `getEdgeAttributes(source, target)`。

### 2.4 遍历与查询

```ts
graph.order // 节点数
graph.size // 边数
graph.nodes() // string[]
graph.edges() // string[]
graph.forEachNode((key, attr) => { /* ... */ })

graph.neighbors('n1') // 邻居节点 key 数组
graph.degree('n1') // 度数
graph.hasNode('n1')
graph.hasEdge('n1', 'n2')
graph.source('e1') // 边的起点
graph.target('e1')
graph.opposite('n1', 'e1') // 边的另一端
```

一个对图谱浏览很重要的细节：**在有向图上 `neighbors()` 同时返回出边和入边两侧的邻居**。这正是「点开一个节点看它关联了什么」想要的可达性语义，所以本库的 `useSigmaNeighborhood` 用它做 BFS，而不引入 `graphology-traversal`。若确实要区分方向，用 `outNeighbors()` / `inNeighbors()`。

### 2.5 序列化：`SerializedGraph`

这是前后端之间传图数据的标准形状，也是 `SigmaGraph` 的 `data` prop 的类型。**不要自己造 `GraphData` 之类的同义接口**，官方类型已经有了。

```ts
import type { SerializedGraph } from 'graphology-types'

const data: SerializedGraph = {
  attributes: { name: '制度图谱' }, // 图级属性，可省略
  options: { type: 'directed', multi: true, allowSelfLoops: true }, // 可省略
  nodes: [
    { key: 'n1', attributes: { label: '节点 1', x: 0, y: 0, size: 10 } }
  ],
  edges: [
    { key: 'e1', source: 'n1', target: 'n2', attributes: { label: '引用' } }
  ]
}

graph.import(data) // 导入
const exported = graph.export() // 导出，形状同上
```

`import()` 会读 `options` 里的图类型。所以一份 `multi: true` 的数据导进一个 `new Graph()` 会丢掉平行边——这是本仓库 `SigmaGraph` 必须按 `data.options` 创建内部图的原因。

### 2.6 图事件：sigma 靠它重绘

graphology 是 EventEmitter，`graph.on(...)` 可订阅。sigma 内部订阅的就是这些事件，它也是 Vue 响应式桥接的唯一入口。

| 事件 | payload | 触发时机 |
| --- | --- | --- |
| `nodeAdded` | `{ key, attributes }` | 新增节点 |
| `nodeDropped` | `{ key, attributes }` | 删除节点 |
| `edgeAdded` | `{ key, source, target, attributes, undirected }` | 新增边 |
| `edgeDropped` | 同上 | 删除边 |
| `nodeAttributesUpdated` | `{ key, type, attributes, ... }` | 单个节点属性变更 |
| `edgeAttributesUpdated` | 同上 | 单个边属性变更 |
| `eachNodeAttributesUpdated` | `{ hints }` | `updateEachNodeAttributes` 批量变更 |
| `eachEdgeAttributesUpdated` | `{ hints }` | 批量变更边属性 |
| `attributesUpdated` | `{ type, attributes, ... }` | 图级属性变更 |
| `cleared` | 无 | `clear()` |
| `edgesCleared` | 无 | `clearEdges()` |

注意 `eachNodeAttributesUpdated` 不带具体是哪些节点变了，只给 `hints`（改了哪些属性名）。批量更新后想做精确的增量处理是做不到的，只能整体重算——`useSigmaGraph` 的 `version` 计数器就是因此设计成单调递增的粗粒度信号。

## 三、Sigma 实例

### 3.1 构造与销毁

```ts
import Sigma from 'sigma'

const renderer = new Sigma(graph, container, settings)
// ...
renderer.kill() // 释放 WebGL 上下文、解绑事件、移除 canvas
```

对 `container` 有硬要求，不满足直接抛：

- 必须是 `HTMLElement`，否则 `Sigma: container should be an html element.`
- 宽高不能为 0，否则 `Sigma: Container has no width.`（高度同理）

第二条在 Vue 里极易踩到：容器可能在 `onMounted` 时还没完成布局。兜底办法是打开 `allowInvalidContainer: true`（sigma 会退化成 1×1 先撑住），再配 `ResizeObserver` 在尺寸稳定后调 `renderer.resize()`。本库把 `allowInvalidContainer` 设成了默认值，用户可覆盖。

`kill()` 之后实例不可复用。SPA 里忘记 kill 的直接后果是 WebGL 上下文泄漏，见第十二节。

### 3.2 渲染契约：sigma 只认这几个属性

图上可以挂任意属性，但 sigma 画图时只读下面这些。其余属性 sigma 完全不看，你可以自由挂业务数据。

节点：

| 属性 | 类型 | 缺省行为 |
| --- | --- | --- |
| `x` / `y` | `number` | **必填**，缺失直接抛错 |
| `size` | `number` | 缺失或为 0 时取 `2` |
| `color` | `string` | 缺失时取 `settings.defaultNodeColor`（`'#999'`） |
| `label` | `string \| null` | 缺失时为 `null`（不显示标签） |
| `type` | `string` | 缺失时取 `settings.defaultNodeType`（`'circle'`） |
| `hidden` | `boolean` | `false` |
| `highlighted` | `boolean` | `false`，为 `true` 时按 hover 样式画 |
| `forceLabel` | `boolean` | `false`，为 `true` 时无视密度控制强制显示标签 |
| `zIndex` | `number` | `0`，仅在 `settings.zIndex` 为 `true` 时生效 |

边：

| 属性 | 类型 | 缺省行为 |
| --- | --- | --- |
| `size` | `number` | 缺失或为 0 时取 `0.5`（实际最细受 `minEdgeThickness` 限制，默认 `1.7`） |
| `color` | `string` | 缺失时取 `settings.defaultEdgeColor`（`'#ccc'`） |
| `label` | `string` | 缺失时为 `''` |
| `type` | `string` | 缺失时取 `settings.defaultEdgeType`（`'line'`） |
| `hidden` / `forceLabel` / `zIndex` | 同节点 | 同节点 |

**`x` / `y` 不是像素，是抽象坐标。** 单位、原点、量级你随便定，sigma 在 `autoRescale: true`（默认）下会把整张图归一化后再画。所以布局算法输出的坐标可以直接用，不需要换算成屏幕尺寸。

**没有布局就没有坐标。** 新建的节点若不给 `x` / `y`，第一次渲染就抛：

```text
Sigma: could not find a valid position (x, y) for node "n1".
```

处理方式二选一：跑一次布局（第九节），或者随便给个初值（`random` 布局本质就是这个）再跑力导。

### 3.3 什么时候需要手动刷新

正常情况下不需要——图数据变了 sigma 自己会重绘。需要手动介入的只有「改了 sigma 读不到的东西」，比如直接替换了 reducer 函数。

| 方法 | 做什么 | 用在哪 |
| --- | --- | --- |
| `refresh(opts?)` | 重算缓存并重绘 | 数据或 reducer 变更后 |
| `scheduleRefresh(opts?)` | 同上，但合并到下一帧 | 高频调用时用它，避免同一帧刷多次 |
| `scheduleRender()` | 只重绘，不重算缓存 | 只有视觉变了，数据没变 |

`refresh` 的选项里有两个性能开关：`partialGraph: { nodes, edges }` 限定只重算这些项，`skipIndexation: true` 跳过标签索引重建（只在确定布局没变时用）。大图上全量 `refresh()` 是有成本的，能局部就局部。

## 四、settings：sigma 唯一的配置面

sigma 的全部可配置项就是一个扁平对象。没有嵌套的配置树，没有插件式配置，就这一层。

```ts
const renderer = new Sigma(graph, container, { renderLabels: false })
renderer.setSetting('renderLabels', true) // 改单项
renderer.setSettings({ labelSize: 12, labelDensity: 0.5 }) // 改多项
renderer.getSettings() // 读回完整配置（含未被覆盖的默认值）
```

以下是全量默认值，逐条核对自 `node_modules/sigma/settings/dist/*.esm.js`。

### 性能

| 键 | 默认 | 说明 |
| --- | --- | --- |
| `hideEdgesOnMove` | `false` | 拖动 / 缩放时不画边。大图上开它是最立竿见影的优化 |
| `hideLabelsOnMove` | `false` | 移动时不画标签 |
| `renderLabels` | `true` | 是否画节点标签 |
| `renderEdgeLabels` | `false` | 是否画边标签 |
| `enableEdgeEvents` | `false` | **边的鼠标事件默认是关的**，要用 `clickEdge` 必须打开 |

### 外观

| 键 | 默认 | 说明 |
| --- | --- | --- |
| `defaultNodeColor` | `'#999'` | 节点无 `color` 时的兜底 |
| `defaultNodeType` | `'circle'` | 节点无 `type` 时用哪个渲染程序 |
| `defaultEdgeColor` | `'#ccc'` | |
| `defaultEdgeType` | `'line'` | |
| `labelFont` | `'Arial'` | |
| `labelSize` | `14` | |
| `labelWeight` | `'normal'` | |
| `labelColor` | `{ color: '#000' }` | 也可写 `{ attribute: 'labelColor' }` 从节点属性取 |
| `edgeLabelFont` | `'Arial'` | |
| `edgeLabelSize` | `14` | |
| `edgeLabelWeight` | `'normal'` | |
| `edgeLabelColor` | `{ attribute: 'color' }` | 默认跟随边自身的颜色 |
| `stagePadding` | `30` | 画布四周留白，单位像素 |
| `minEdgeThickness` | `1.7` | 边的最小视觉粗细，防止缩小后边消失 |
| `antiAliasingFeather` | `1` | 抗锯齿羽化宽度 |
| `defaultDrawNodeLabel` / `defaultDrawEdgeLabel` / `defaultDrawNodeHover` | 内置 2D 绘制函数 | 想自定义标签或 hover 外观就换掉它们 |

### 鼠标与相机

| 键 | 默认 | 说明 |
| --- | --- | --- |
| `dragTimeout` | `100` | 判定为拖拽的时间阈值，毫秒 |
| `draggedEventsTolerance` | `3` | 判定为拖拽的位移阈值，像素 |
| `inertiaDuration` | `200` | 惯性滑动时长 |
| `inertiaRatio` | `3` | 惯性强度 |
| `zoomDuration` | `250` | 滚轮缩放动画时长 |
| `zoomingRatio` | `1.7` | 每次滚轮缩放的倍率 |
| `doubleClickTimeout` | `300` | 双击判定窗口 |
| `doubleClickZoomingRatio` | `2.2` | 双击缩放倍率 |
| `doubleClickZoomingDuration` | `200` | |
| `tapMoveTolerance` | `10` | 触屏点击的位移容差 |
| `enableCameraZooming` / `enableCameraPanning` / `enableCameraRotation` | 均 `true` | 分别关掉可做只读视图 |
| `minCameraRatio` / `maxCameraRatio` | `null` | 缩放上下限，`null` 为不限 |
| `cameraPanBoundaries` | `null` | 平移边界，可传 `true` 或 `{ tolerance, boundaries }` |

### 尺寸与缩放

| 键 | 默认 | 说明 |
| --- | --- | --- |
| `autoRescale` | `true` | 自动把图缩放到容器内。关掉则 `x` / `y` 按原值参与投影 |
| `autoCenter` | `true` | 自动居中 |
| `itemSizesReference` | `'screen'` | `'screen'` 时节点大小不随缩放变；`'positions'` 时跟着变 |
| `zoomToSizeRatioFunction` | `Math.sqrt` | 缩放比到尺寸比的映射曲线 |

`itemSizesReference` 是个容易被忽略但影响很大的开关。默认的 `'screen'` 意味着放大后节点不会跟着变大——适合「节点大小编码度数」这类语义；若你希望缩放像看地图一样等比，改成 `'positions'`。

### 标签

| 键 | 默认 | 说明 |
| --- | --- | --- |
| `labelDensity` | `1` | 每个网格单元最多显示几个标签，越小越稀疏 |
| `labelGridCellSize` | `100` | 网格单元边长，像素 |
| `labelRenderedSizeThreshold` | `6` | 节点渲染尺寸小于此值不显示标签 |

大图上标签是主要的视觉噪声源与性能开销。降 `labelDensity`、升 `labelRenderedSizeThreshold` 是标准手段，效果比关标签更好——重要的节点（尺寸大）仍然有标签。

### 功能开关

| 键 | 默认 | 说明 |
| --- | --- | --- |
| `nodeReducer` / `edgeReducer` | `null` | 见第五节 |
| `zIndex` | `false` | 打开后按节点 `zIndex` 属性排序绘制，有性能成本 |
| `allowInvalidContainer` | `false` | 容器尺寸为 0 时不抛错 |
| `nodeProgramClasses` / `nodeHoverProgramClasses` / `edgeProgramClasses` | `{}` | 见第八节 |

## 五、reducer：显示层的唯一入口

签名：

```ts
type NodeReducer = (node: string, data: NodeAttributes) => Partial<NodeDisplayData>
type EdgeReducer = (edge: string, data: EdgeAttributes) => Partial<EdgeDisplayData>
```

sigma 未单独导出这两个类型名，它们只是 `Settings` 上的内联字段类型。要在自己代码里引用，从 `Settings` 派生：

```ts
import type { Settings } from 'sigma/settings'

type NodeReducer = NonNullable<Settings['nodeReducer']>
```

行为要点：

- **每帧、对每个待绘制项各调用一次。** 这是彻底的热路径，里面不要做排序、正则、深拷贝或任何 O(n) 操作。需要预计算的东西提前算好放闭包里。
- **返回值只影响这一帧的显示**，不写回图。返回 `{}` 或不返回都表示「按原样画」。
- **不要在 reducer 里改图。** mutation 会触发图事件、进而触发重绘，直接进入重入循环。
- 返回的字段就是第 3.2 节那张表里的显示属性：`color`、`size`、`label`、`hidden`、`highlighted`、`forceLabel`、`zIndex`、`type`，节点还可以返回 `x` / `y`（用于「显示时偏移但不改数据」的场景）。

典型用法——悬停高亮邻居、淡化其他：

```ts
renderer.setSetting('nodeReducer', (node, data) => {
  if (!hoveredNode) return data
  if (node === hoveredNode || graph.areNeighbors(node, hoveredNode)) {
    return { ...data, highlighted: true }
  }
  return { ...data, color: '#eee', label: null }
})
```

**致命限制：`nodeReducer` 和 `edgeReducer` 各只能有一个。** 后设置的直接覆盖先设置的。但真实应用里高亮、淡出、图例显隐、条件过滤是四个互不相干的关注点，都想往这里塞。这就是本库 `chainReducers` + `useSigmaReducer` 的全部由来：库内维护一条按 `order` 排序的链，合成为单个函数交给 sigma。

连带的一条约束值得记住：在用了本库的项目里运行期直接调 `sigma.setSetting('nodeReducer', fn)`，会在下一次链重算时被覆盖掉。要在链里加一环，用 `useSigmaReducer()`。

## 六、事件

sigma 是 `TypedEventEmitter`，`on` / `off` / `once` 一应俱全，事件名与 payload 都有类型。

### 鼠标事件：8 种交互 × 3 类目标 = 24 个

交互：`click`、`doubleClick`、`rightClick`、`wheel`、`down`、`up`、`enter`、`leave`

目标后缀：`Stage`（空白画布）、`Node`、`Edge`

组合起来就是 `clickNode`、`enterNode`、`rightClickStage`、`wheelEdge`……

payload 形状：

```ts
interface SigmaEventPayload {
  event: MouseCoords // 含 x / y（viewport 坐标）、original（原生事件）
  preventSigmaDefault(): void
}
// Node 事件额外带 node: string，Edge 事件额外带 edge: string
```

`preventSigmaDefault()` 用来阻止 sigma 的默认响应，比如在 `downNode` 里调它可以阻止拖拽画布——实现节点拖拽的标准做法。

**边事件默认是关的。** `enableEdgeEvents` 默认 `false`，不打开的话 `clickEdge` 永远不会触发。这条几乎每个新手都会踩一次。原因是边的命中检测有成本，大图上默认关闭更合理。

### 生命周期事件：9 个

| 事件 | 时机 |
| --- | --- |
| `beforeRender` / `afterRender` | 每帧绘制前后 |
| `beforeProcess` / `afterProcess` | 数据处理（索引重建）前后 |
| `beforeClear` / `afterClear` | 清空画布前后 |
| `resize` | 容器尺寸变化 |
| `kill` | 实例销毁 |
| `moveBody` | 画布被拖动 |

`afterRender` 是 DOM 覆盖层同步位置的正确挂点：相机移动、图数据变更、容器缩放都会触发重绘，跟着重绘走就覆盖了全部情况，不需要分别订阅相机、图、ResizeObserver 三个源。本库 `SigmaOverlay` 走的就是这条路。

相机自己也是 EventEmitter，`renderer.getCamera().on('updated', state => ...)` 能拿到 `CameraState`。

## 七、坐标系：最容易翻车的一节

sigma 里有**三套**坐标系。混用不会报错，只会让覆盖层整体错位，而且错得很有迷惑性（缩放到某个比例时看起来是对的）。

| 坐标系 | 是什么 | 从哪拿到 |
| --- | --- | --- |
| graph coordinates | 你写进节点属性的原始 `x` / `y`，单位任意 | `graph.getNodeAttributes(key)` |
| framed graph coordinates | 归一化后的坐标，整张图被缩放到中心 `(0.5, 0.5)` 的单位方框内 | `sigma.getNodeDisplayData(key)`、`camera.x` / `camera.y` |
| viewport coordinates | 容器内的像素坐标，左上角为原点 | 鼠标事件的 `event.x` / `event.y` |

归一化公式是 `0.5 + (x - 中心) / max(x跨度, y跨度)`，等比缩放，不会拉伸。`autoRescale: false` 时这一层退化为恒等变换。

### 换算函数怎么选

| 手上的坐标来自 | 想要 | 用哪个函数 |
| --- | --- | --- |
| `getNodeDisplayData()` | 屏幕像素 | `framedGraphToViewport(coords)` |
| 节点属性 / 布局算法输出 | 屏幕像素 | `graphToViewport(coords)` |
| 鼠标事件 | 图坐标（比如「在点击处新建节点」） | `viewportToGraph(coords)` |
| 鼠标事件 | framed 坐标（比如换算相机位置） | `viewportToFramedGraph(coords)` |

一句话记法：**凡是 `getNodeDisplayData()` 给的，一律走 framed 那一路。** sigma 自己定位标签和 hover 圈用的就是 `framedGraphToViewport`。

反过来，小地图这类组件全程只用 framed 坐标最省事——因为节点显示坐标和相机的 `x` / `y` 本来就在同一个坐标系里，画点、画视口框、点击换算三件事不必来回转换。

### 相机

```ts
const camera = renderer.getCamera()
camera.x // 0.5（framed 坐标）
camera.y // 0.5
camera.ratio // 1，越大看得越远（这是缩放的倒数，容易记反）
camera.angle // 0，弧度

camera.setState({ x: 0.3, y: 0.7, ratio: 0.5 }) // 瞬时
await camera.animate({ ratio: 0.5 }, { duration: 300, easing: 'quadraticInOut' })
await camera.animatedZoom({ duration: 200 }) // 放大一档
await camera.animatedUnzoom()
await camera.animatedReset() // 回到初始视角
```

`ratio` 的方向是反的：**数值变小是放大**。`animatedZoom` 内部按 `settings.zoomingRatio`（默认 `1.7`）做除法。

「把视口对准某组节点」不在核心包里，在可选包 `@sigma/utils`：

```ts
import { fitViewportToNodes } from '@sigma/utils'

await fitViewportToNodes(renderer, ['n1', 'n2', 'n3'], { animate: true })
```

## 八、渲染程序（programs）

节点和边的实际绘制由「渲染程序」负责，一个程序对应一段 WebGL shader。节点属性里的 `type` 字段就是程序名。

内置程序（无需安装任何东西）：

| 类别 | 名称 | 程序 |
| --- | --- | --- |
| 节点 | `circle` | `NodeCircleProgram` |
| 边 | `line` | `EdgeRectangleProgram` |
| 边 | `arrow` | `EdgeArrowProgram` |

**`type` 写了但没注册对应程序，sigma 直接抛错**，不会降级成默认形状：

```text
Sigma: could not find a suitable program for node type "image"!
```

所以「先渲染、程序稍后加载」这条路走不通，程序必须在建实例前就备齐。本库 `defineSigmaProgram()` 的存在意义就是解决这个时序问题。

### 官方扩展包

| 包 | 版本 | 主要导出 |
| --- | --- | --- |
| `@sigma/node-image` | 3.0.0 | `NodeImageProgram`、`NodePictogramProgram`、`createNodeImageProgram` |
| `@sigma/node-border` | 3.0.0 | `NodeBorderProgram`、`createNodeBorderProgram` |
| `@sigma/node-square` | 3.0.0 | 方形节点程序 |
| `@sigma/node-piechart` | 3.0.1 | 饼图节点程序 |
| `@sigma/edge-curve` | 3.1.0 | `EdgeCurveProgram`（默认导出）、`createEdgeCurveProgram`、`indexParallelEdgesIndex` |
| `@sigma/export-image` | 3.0.0 | `toBlob`、`downloadAsPNG`、`downloadAsJPEG`、`drawOnCanvas` |
| `@sigma/utils` | 3.0.0 | `fitViewportToNodes`、`getNodesInViewport` |

注册方式：

```ts
import { NodeBorderProgram } from '@sigma/node-border'
import EdgeCurveProgram from '@sigma/edge-curve'

const renderer = new Sigma(graph, container, {
  nodeProgramClasses: { border: NodeBorderProgram },
  edgeProgramClasses: { curve: EdgeCurveProgram }
})

graph.setNodeAttribute('n1', 'type', 'border')
```

`nodeHoverProgramClasses` 是单独一份，用于 hover 状态；不指定则复用 `nodeProgramClasses`。

### 平行边的坑

`@sigma/edge-curve` 的 `indexParallelEdgesIndex()` 只写 `parallelIndex` / `parallelMinIndex` / `parallelMaxIndex` 三个属性，**不写 `curvature`**——而渲染程序读的是 `curvature`。只调它边不会弯，得自己把索引换算成曲率再写回去。本库 `curveParallelEdges()` 就是补这第二步。

## 九、布局：坐标从哪来

布局算法全在 graphology 生态，不属于 sigma。它们的产出就是往节点上写 `x` / `y`。

每个包都提供两种调用形式：

- `layout(graph, options)` 返回坐标映射 `{ [node]: { x, y } }`，不动图
- `layout.assign(graph, options)` 直接写回图

### 同步布局（`graphology-layout`）

```ts
import circular from 'graphology-layout/circular'
import circlepack from 'graphology-layout/circlepack'
import random from 'graphology-layout/random'

circular.assign(graph, { scale: 100 })
```

三种都是一次算完，适合做力导的初始位置或者小图直接用。

### ForceAtlas2（`graphology-layout-forceatlas2`）

最常用的力导布局，也是知识图谱的默认选择。

```ts
import forceAtlas2 from 'graphology-layout-forceatlas2'

const settings = forceAtlas2.inferSettings(graph) // 按图规模推断参数
forceAtlas2.assign(graph, { iterations: 100, settings })
```

`inferSettings` 值得用——它按节点数推断 `barnesHutOptimize` 等参数，比手调靠谱。

大图上 100 次迭代会卡死主线程好几秒，所以有 worker 版本：

```ts
import FA2Layout from 'graphology-layout-forceatlas2/worker'

const layout = new FA2Layout(graph, { settings })
layout.start()
// ...
layout.stop()
layout.kill() // 必须调，否则 worker 泄漏
```

**worker 版本不 `kill()` 就是线程泄漏**，组件卸载和 HMR 都要处理。这是本库 `useSigmaLayout` 托管生命周期的理由。

### Noverlap（`graphology-layout-noverlap`）

消除节点重叠，通常在力导之后跑一遍收尾。同样有同步版和 worker 版。

### 最省事的路径

图谱数据稳定的话，**在服务端预计算坐标并持久化到节点属性**，前端跳过布局直接渲染。首屏最快、每次打开位置一致、不吃客户端 CPU。1000+ 节点的场景强烈推荐这条。

## 十、图分析

| 能力 | 包 | 入口 |
| --- | --- | --- |
| 度数中心性 | 核心 graphology | `graph.degree(node)`，无需装包 |
| 介数中心性 | `graphology-metrics` | `graphology-metrics/centrality/betweenness` |
| 接近中心性 | `graphology-metrics` | `graphology-metrics/centrality/closeness` |
| PageRank / 特征向量 / HITS | `graphology-metrics` | `centrality/pagerank` 等 |
| 社区发现 | `graphology-communities-louvain` | 默认导出，返回 `{ [node]: communityId }` |
| BFS / DFS | `graphology-traversal` | `bfsFromNode` 等 |

一个实测记录，避免踩坑：**`graphology-metrics@2.4.0` 的 betweenness 在链状图上正确，但分叉节点偏低、首个插入的节点恒为 0**（4 节点星形图的星心算出来是 0，正确值是 3）。拿它做业务判断前请自行核对。

社区发现的产出是社区编号，映射成颜色才有视觉意义——这一步（`communityToColor`）不依赖 louvain 包本身，接受任何划分结果。

## 十一、性能与规模

按收益从高到低：

1. **服务端预布局**，前端不跑力导。省掉最大的一块 CPU。
2. **`hideEdgesOnMove: true`**。边通常比节点多一个数量级，拖动时不画边，交互立刻跟手。
3. **控制标签**：降 `labelDensity`、升 `labelRenderedSizeThreshold`。比整体关标签的体验好得多。
4. **概览 + 按需展开**，而不是一次渲染全量。首屏给一个抽样子图或高层概览，点击节点再增量拉取邻域合并进来。
5. **节点属性只带渲染必需字段**。详情正文按需懒加载，不要塞在节点属性里跟着图数据一起传。
6. **`refresh({ partialGraph })`** 而非全量刷新。
7. `zIndex: false`（默认）。开启 z 序排序有实打实的成本，除非确实需要。

至于「一页能放几个实例」，见下一节——那是个硬上限，不是性能问题。

## 十二、SSR 与 WebGL：本仓库几条红线的上游成因

### sigma 在模块顶层就读 WebGL 全局

sigma 用 `WebGL2RenderingContext.BOOL` 一类常量在模块顶层建查找表。Node 和 happy-dom 都没有这个全局，所以：

```ts
import Sigma from 'sigma' // SSR 下直接 ReferenceError
```

不只是主包，`sigma/settings` 以及全部 `@sigma/*` 程序包同样如此。唯一可行的写法是动态导入，且必须在 `onMounted` 之后：

```ts
onMounted(async () => {
  const { default: Sigma } = await import('sigma')
  renderer = new Sigma(graph, el.value!)
})
```

类型侧用 `import type` 不受影响，编译期就擦除了。graphology 没有这个问题，可以正常静态导入。

写成 `const p = import('sigma')` 放在顶层也不行——那同样会在服务端求值。

### 每个实例占 3 个 WebGL 上下文

一个 Sigma 实例建 7 张画布，其中 `sigma-edges`、`sigma-nodes`、`sigma-hoverNodes` 三张走 WebGL，另外四张是 2D。浏览器的 WebGL 上下文上限普遍是 16 个，**算下来一页最多同时活 5 个 Sigma 实例**，本仓库取 4 个作为安全线。

超出后最早的上下文被强制丢弃，对应画布直接变空白，控制台只留一行 `Too many active WebGL contexts` 的警告——不抛错、不崩溃，就是白屏。示例列表页最容易撞上，解法是视口内懒挂载。

### 容器尺寸

见 3.1 节。`allowInvalidContainer` + `ResizeObserver` 是标准组合。

## 十三、原生 API 到 `@movk/sigma` 的映射

这张表的用法是：知道原生怎么做之后，查一下本库有没有现成的封装。**没有封装的一律直接用原生**，本库不做代理、不拦截。

| 原生做法 | 本库对应 | 差别 |
| --- | --- | --- |
| `new Sigma(graph, container, settings)` | `<SigmaGraph :data :settings>` | 客户端实例化、SSR 安全、卸载自动 kill |
| 持有 `renderer` 变量 | `useSigma()` / `useSigmaById(id)` | 返回原生实例本身，不是包装对象 |
| 订阅 graphology 事件手动刷新 UI | `useSigmaGraph()` | 桥接成 `version` 计数与 `shallowRef` |
| `renderer.on('clickNode', fn)` | 组件 `@click-node` 或 `useSigmaEvents({ clickNode })` | 卸载自动解绑；原生 `on()` 仍可用 |
| `renderer.setSettings(obj)` | `useSigmaSettings(source)` | 接受响应式源 |
| `setSetting('nodeReducer', fn)` | `useSigmaReducer({ node, order })` | 多个 reducer 合成链而非互相覆盖 |
| `camera.animatedZoom()` 等 | `useSigmaCamera()` | 加了 `fitTo` / `gotoNode` 等便捷方法 |
| `forceAtlas2.assign` / `FA2Layout` | `useSigmaLayout(name, options)` | worker 生命周期托管 |
| `graphology-metrics` 各入口 | `useSigmaMetrics()` | 按 `version` 缓存、可选包按需动态导入 |
| `@sigma/export-image` 的 `toBlob` | `useSigmaExport()` | 归一化了扩展名重复的问题 |
| `graph.clear()` + `graph.import()` | `applyGraphDiff(graph, next, opts)` | 增量 diff，保留已有坐标 |
| 自己算覆盖层位置 | `<SigmaOverlay>` / `Tooltip` / `Popover` | 自动选对坐标换算函数并跟随 `afterRender` |
| 手写缩放 / 全屏 / 检索按钮 | `SigmaZoomControl` 等控件 | 零第三方依赖，外观可经插槽全接管 |

反过来，本库**没有**封装的能力，直接用原生就好：`graph.export()`、`renderer.getCanvases()`、`renderer.viewRectangle()`、graphology 生态的任何操作包，等等。`playgrounds/basic` 的「纯原生逃生舱」示例就是这条路径的活证明。

## 十四、报错速查

| 报错 / 现象 | 原因 | 处理 |
| --- | --- | --- |
| `could not find a valid position (x, y) for node "..."` | 节点缺 `x` / `y` | 跑一次布局，或建节点时给初值 |
| `could not find a suitable program for node type "..."` | `type` 指向未注册的程序 | 在 `nodeProgramClasses` 里注册；确保建实例前已注册 |
| `Container has no width.` / `no height.` | 容器尺寸为 0 | 开 `allowInvalidContainer`，配 `ResizeObserver` 补 `resize()` |
| `container should be an html element.` | 传了 `null` 或 ref 未解包 | 确认在 `onMounted` 之后取 DOM |
| `ReferenceError: WebGL2RenderingContext is not defined` | 静态 import 了 sigma 或 `@sigma/*` | 一律改为 `await import()`，放 `onMounted` 之后 |
| 画布空白 + `Too many active WebGL contexts` | 同页实例超过 5 个 | 视口内懒挂载，及时 `kill()` |
| `clickEdge` 不触发 | `enableEdgeEvents` 默认 `false` | 显式打开 |
| 覆盖层位置整体偏移 | 用 `graphToViewport` 处理了 `getNodeDisplayData` 的坐标 | 改用 `framedGraphToViewport` |
| 改了图但界面不动 | Vue 抓不到 graphology 的 mutation | 用 `useSigmaGraph()` 的 `version` 驱动 |
| reducer 被莫名覆盖 | 直接 `setSetting('nodeReducer')` 与库的链冲突 | 改用 `useSigmaReducer()` |
| 增量更新后整张图跳动 | `clear()` + `import()` 重置了坐标 | 用 `applyGraphDiff`，坐标缺省时沿用旧值 |
| 平行边全部重叠 | 只调了 `indexParallelEdgesIndex`，没写 `curvature` | 用 `curveParallelEdges()` |
| 多重图导入后边变少 | 目标图不是 `multi: true` | 建图时按 `data.options` 传参 |

## 十五、官方资料

| 资源 | 地址 |
| --- | --- |
| sigma.js 官网 | https://www.sigmajs.org/ |
| sigma.js 文档 | https://www.sigmajs.org/docs |
| sigma.js Storybook（可运行示例，最有价值） | https://www.sigmajs.org/storybook |
| `Settings` 完整类型 | https://www.sigmajs.org/docs/typedoc/sigma/src/settings/interfaces/Settings |
| sigma.js 源码 | https://github.com/jacomyal/sigma.js |
| graphology 文档 | https://graphology.github.io/ |

两条补充：

- **Storybook 比文档有用。** sigma 的文档偏 API 参考，Storybook 里每个示例都能直接看源码，对照着改是最快的上手方式。
- **sigma v4 已有 alpha 版**（见 [v4.sigmajs.org](https://v4.sigmajs.org/)）。本库锁在 v3（`sigma@>=3.0.0` 的 peer 约束），升级前需要重新评估 API 变更面。
