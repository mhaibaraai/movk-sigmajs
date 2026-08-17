# AGENTS.md

`@movk/sigma` —— 基于 sigma v4 的知识图谱可视化 Nuxt 模块，为 Vue 3 / Nuxt 4 提供声明式组件与 composables。

## 目录结构

```text
src/
├── module.ts             # defineNuxtModule：meta / defaults / setup
└── runtime/
    ├── components/       # core 与 controls 两组，文件名不带前缀
    ├── composables/
    ├── utils/
    ├── types/
    └── index.css         # 可选样式表
docs/                     # @movk/nuxt-docs 文档站，示例的唯一数据源
├── app/components/content/examples/
├── app/utils/corpus.ts   # 示例数据的唯一入口
├── app/data/             # 打进 bundle 的数据集子集
├── app/assets/css/examples.css
├── public/data/          # 官方完整数据集，按需 fetch
├── scripts/              # 子集派生脚本
└── content/docs/         # 一 API 一页
playgrounds/
├── basic/                # 零 UI 依赖，反向引用 docs 的示例，纯原生逃生舱
└── ui/                   # @movk/nuxt，接口驱动的完整场景与插槽接管
test/                     # vitest + happy-dom + @vue/test-utils
```

两个 playground 的分工见「演示应用」一节，示例与文档页的组织约定见「文档站」一节。

## 红线

以下几条违反即视为缺陷，评审必须拦。

### runtime 目录禁用自动导入

已发布模块的 `src/runtime/` 内**不能依赖 Nuxt 自动导入**（`node_modules` 内出于性能不启用）。Vue API、`@movk/core`、`@vueuse/core` 以及库内的 composables 与工具函数，全部必须显式 `import`。

本地 playground 会因为源码不在 `node_modules` 而「碰巧通过」，发布后才炸。写完 runtime 代码务必自查一遍 import 是否齐全。

**不准开 `shamefully-hoist=true`。** 它把所有依赖提升到根 `node_modules`，会让漏写的 import 也能解析成功，正好掩盖上面这类 bug。某些依赖（如 `@movk/nuxt` 要求的 `tailwindcss`）的安装文档会建议开它，一律改用「在需要的 workspace 里显式安装」绕开。

### sigma 的每个子路径都只能动态导入

sigma **每个**子路径在模块顶层就读 `WebGL2RenderingContext`——`sigma`、`sigma/settings`、`sigma/rendering`、`sigma/primitives`、`sigma/types` 无一例外。服务端与 happy-dom 都没有这个全局，**静态 import 任何一条会让 SSR 直接 ReferenceError**。v4 的范围比 v3 更大，别按老印象只防主入口。

runtime 代码里一律 `await import('sigma')`，放在 `onMounted` 之后；类型侧用 `import type`，编译期擦除不影响。graphology 无此问题，可正常静态导入。

`@sigma/node-image`、`@sigma/node-border`、`@sigma/export-image` 同样如此，**使用方也不能静态 import 它们**。所以 `primitives` prop 支持 `defineSigmaPrimitives(async () => { const { sdfCircle } = await import('sigma/rendering'); ... })` 这种延迟声明，组件会在建实例前解析完。

连带的三条：异步 `onMounted` 要能在实例化完成前被卸载中断；测试需要 `test/setup/webgl-globals.ts` 补桩才能加载真实的 `sigma/settings`；所有可选 peer（布局、metrics、louvain）一律 `await import()` 并在 `catch` 里给出「装哪个包」的可操作提示。

### 自建形状必须是纯数据

`utils/node-shape.ts` 的 `sdfPolygon()` / `sdfStar()` 返回 `{ name, glsl, inradiusFactor }`，**不 import sigma 的任何值**。这正是它们能进 `addImportsDir`、能被使用方直接写在模块顶层的原因。

新增形状时守住这条：一旦为了复用某个常量而 import `sigma/rendering`，整个 `utils/` 就会被 SSR 打进包并 ReferenceError。需要内置形状时让使用方在 `defineSigmaPrimitives()` 里自行取用。

### 模块级状态必须客户端隔离

`src/runtime/` 里任何模块级的可变状态（如实例注册表）都是整个 Node 进程共享的单例。SSR 期组件的 `setup` 照常执行、但 `onBeforeUnmount` 永远不会触发，写入的条目只增不减，既跨请求残留又会误判冲突。

这类写入一律加 `import.meta.client` 保护。判断依据很简单：服务端的 `sigma` 恒为 `null`（实例在 `onMounted` 才创建），凡是依赖实例的登记在服务端本就没有意义。

### 出口兼容不可破坏

封装是加法，不是围墙。

- 不代理实例：`useSigma()` 返回原生 `Sigma` 与 `Graph`，不包 Proxy、不包装。注意 Vue 会把 props 包成响应式代理，接收外部实例时必须 `toRaw()` 剥回原对象再往下传
- 不做 settings 白名单：`settings` 整体透传，不逐字段枚举、不过滤未知键
- 不 re-export 上游：不转发 sigma / graphology 的任何值或类型，用户从原包直接 import。**本库自己的**类型不在此列——它们全部从 `@movk/sigma` 根出口，汇总在 `src/runtime/types/public.ts`，新增公开类型时同步加一行 re-export，`test/type-exports.test-d.ts` 会在 typecheck 时兜底
- `sigma` 与 `graphology` 保持 peer 依赖，不进 dependencies
- 用户自带的 `nodeReducer` / `edgeReducer`（`SigmaGraph` 的独立 props，v4 已不在 `settings` 上）作为 reducer 链的基座执行，不得被吞掉

### 类型一律用官方类型包

- **禁止安装任何 `@types/*`**：该生态全部包自带 `.d.ts`，`@types/sigma`、`@types/graphology` 等根本不存在
- **禁止自造已有类型**：图数据契约直接用 `graphology-types` 的 `SerializedGraph`，不要写 `GraphData` 这类同义接口
- 库内类型一律从官方类型派生：`settings` 写成 `Partial<Settings>`，`styles` 与 `primitives` 直接用 `StylesDeclaration` / `PrimitivesDeclaration`

类型来源速查：

| 来源 | 类型 |
| --- | --- |
| `graphology-types` | `SerializedGraph`、`SerializedNode`、`SerializedEdge`、`Attributes` |
| `graphology` | `Graph` |
| `sigma/settings` | `Settings`（v4 只剩行为与性能项，视觉项全在 styles） |
| `sigma/types` | `NodeDisplayData`、`EdgeDisplayData`、`NodeReducer`、`EdgeReducer`、`StylesDeclaration`、`BaseNodeState`、`BaseEdgeState`、`BaseGraphState`、`LabelPosition`、`CameraState`、`Coordinates`、`MouseCoords` |
| `sigma/primitives` | `PrimitivesDeclaration`、`CustomNodeShape`、`NodePrimitives`、`EdgePrimitives` |
| `sigma/rendering` | `SDFShape`、`FragmentLayer`、`ValueSource` |

v4 **直接导出** `NodeReducer` / `EdgeReducer`，不必再从 `Settings` 派生——它们已不在 settings 上，而是构造选项。

`sigma/types` 也 re-export 了 styles 相关类型，**没有 `sigma/types/styles` 这个子路径**。少数没被 re-export 的（`NodeStyleRule` 等）从 `StylesDeclaration` 索引派生：

```ts
type NodeStyles = NonNullable<StylesDeclaration['nodes']>
```

### 通用方法先查 @movk/core

写任何工具函数前，先用 `movk-core` MCP 检索是否已有（`list-functions` / `search-composables`）。已确认可复用的有 `debounce`、`throttle`、`splitHighlight`、`triggerDownload`、`convertSvgToPng`、`deepMerge`、`getRandomUUID`、`simpleHash`、`pick`、`omit`、`unique`、`lengthToPx`、`isEmpty` 等。

已迁入 core 的还有 `clamp`、`mapRange`、`createRegistry`、`pipe`，本库不再自带。

core 里确实没有的通用能力，先写在 `src/runtime/utils/` 并在 JSDoc 标注 `@todo 待移入 @movk/core`，便于后续搬迁。图与 sigma 领域的逻辑（`applyGraphDiff`、`chainReducers`、`sdfPolygon` 等）不属于 core 范畴，正常放 `src/runtime/utils/`。

## 命名约定

Nuxt 模块最佳实践要求所有导出加模块名前缀防冲突：

- 组件：`SigmaGraph`、`SigmaTooltip`、`SigmaZoomControl`
- Composables：`useSigma`、`useSigmaCamera`、`useSigmaLayout`
- 模块配置键：`sigma`

**组件文件名不带前缀**，前缀由 `addComponentsDir` 的 `prefix` 选项统一加上（默认 `'Sigma'`，用户可改）。即 `components/Graph.vue` 注册为 `<SigmaGraph>`，`components/controls/ZoomControl.vue` 注册为 `<SigmaZoomControl>`。目录层级不参与命名（`pathPrefix: false`）。

## 开发流程

```bash
pnpm install
pnpm dev:prepare     # 首次或依赖变更后必须先跑，两个 playground 与 docs 一起 prepare
pnpm dev             # 启动 playgrounds/basic
pnpm dev:ui          # 启动 playgrounds/ui
pnpm docs            # 启动 docs
pnpm test            # vitest
pnpm typecheck
pnpm lint
```

改动 `src/` 后若 playground 或 docs 表现异常，先重跑 `pnpm dev:prepare`。`nuxt-component-meta` 只在启动时解析一次，改了组件 JSDoc 要重启 `pnpm docs` 才能看到新的 API 表。

已经踩过的坑：

- 覆盖层定位有两套坐标：节点用 `framedGraphToViewport()`（`getNodeDisplayData()` 返回的是归一化后的 framed 坐标），原始图坐标才用 `graphToViewport()`，混用会整体错位
- 覆盖层用 `v-show` 保留 DOM，隐藏时插槽内容必须另用 `v-if` 跳过，否则使用方拿到空作用域且隐藏内容仍可点击
- `SigmaGraph` 的默认插槽排在占满高度的画布之后，走的是正常文档流。插槽内的任何面板都必须自行 `position: absolute`，否则会被挤到容器之外并被 `overflow` 裁掉
- `index.css` 里同一属性不要一半写在裸类名规则、一半写在 `:where()` 里：前者优先级 0,1,0，后者是 0，`:where()` 的覆盖永远赢不了。需要被后续规则覆盖的属性，基础规则也要包 `:where()`
- 改完 `src/runtime/index.css` 必须重跑 `pnpm dev:prepare`，playground 加载的是 `dist/` 里的副本，不重新 stub 就还是旧样式
- **一页里能同时存活的 Sigma 实例有硬上限**：每个实例占 3 个 WebGL 上下文（`sigma-edges` / `sigma-nodes` / `sigma-hoverNodes` 三张画布走 WebGL，另外四张是 2D），浏览器上限多为 16 个。超出后最早的上下文被强制丢弃、画布直接变空白，只在控制台留一行 `Too many active WebGL contexts` 的警告。示例列表页一律经 `ExampleCard` 视口内懒挂载，同屏不超过四个实例
- 控件插槽的作用域要连行为一起给。只暴露数据（如图例只给 `groups`）会让「接管外观」等于「丢掉功能」，与设计前提相悖
- 文档站的 `.example-stage` 是 **flex 行容器**。示例根节点若是自己的 `div`（而不是直接给 `SigmaGraph`），只声明 `height: 100%` 会缩成内容宽，图被压成一条。这类容器必须一并写 `width: 100%`
- **布局会毁掉 360 单位的坐标约定**：`circular` / `random` 默认 `scale` 为 1，跨度只剩 1~2 个单位；`forceatlas2` 用 `inferSettings()` 会收敛到几十个单位。跑布局的示例一律传 `itemSizesReference: 'screen'` 让 size 退回像素语义——布局后归一化坐标按不住 worker 版 ForceAtlas2，它每一帧都在回写坐标
- **v4 的节点 `size` 是图坐标单位，不是屏幕像素**：`itemSizesReference` 默认从 v3 的 `'screen'` 改成了 `'positions'`，渲染半径 = `size × 每坐标单位的像素数`，也就是说决定视觉大小的是 size 与坐标跨度的**比值**。v3 时代「坐标随便写、size 当像素填」的数据搬到 v4 会渲染出比画布还大的色块。示例一律把坐标跨度取在 360 单位左右（对应 `.example-stage` 的 420px 减去 `stagePadding`），使每单位约等于 1px、size 数值读起来就是像素半径；新写示例要守这个约定。库不覆盖这个默认值，语义与逃生方式写在 `docs/content/docs/6.guides/4.node-size.md`
- **`glDrawArraysInstanced: Active draw buffers with missing fragment shader outputs` 是浏览器驱动层的良性告警，不是本库的 bug**：已用 chrome-devtools 在 `/graph` 页实测，`GraphBasicExample`（无 `primitives`/`styles`）与 `GraphPrimitivesExample`（有自建 `primitives`）在各自 Sigma 实例刚建好时都会各触发几次，与是否传 `primitives`/`styles` 无关。已装的 `sigma@4.0.0-beta.3` 源码里也没有任何 `gl.drawBuffers` 调用（`generateFragmentShader` 恒定只声明一个 `out vec4 fragColor`），picking 走的是单附件 framebuffer 两遍渲染，语义上对不上这条警告字面描述的场景，sigma.js 官方仓库也未见同款 issue。判断是 macOS Chrome 的 ANGLE-Metal 后端在 WebGL2 实例化绘制上的驱动告警，可安全忽略，不必为此改动 runtime 代码或示例配置

- 模块装进消费方的 `node_modules` 后，Vite 的依赖扫描不进 node_modules 里的源码，runtime 对 graphology / sigma 系列的 import 拿不到预构建，浏览器直接收到 CJS 报缺少命名导出。声明由 `src/optimize-deps.ts` 内置，runtime 新增对某个包的 import 时要同步补一条候选。传递依赖（`events`、`graphology-utils/*`）必须写成 Vite 的 `parent > child` 形式，未安装的可选 peer 必须探测后跳过——直接塞进 `optimizeDeps.include` 会换来一串启动告警
- 根 `tsconfig.json` 必须 `extends: "./.nuxt/tsconfig.json"`。改成 project references 写法会让 `vue-tsc --noEmit` 完全跳过 `src/`，typecheck 空转却仍退出码 0
- 组件 emits 的类型要逐条写出。用 `{ [K in SigmaEventType]: ... }` 这类映射类型派生，`vue-tsc` 能过但 `pnpm build` 会失败——`@vue/compiler-sfc` 要在编译期静态提取事件名，解析不了跨包映射类型
- **中文节点标签在 2 倍屏上会整体不渲染，起因是上游节点标签图集按 `64 × devicePixelRatio` 烘字形**：2 倍屏单个字形连同 buffer 约 144px，2048² 的图集一页只装得下约 190 个，中文字形集溢出后游标翻到 `atlasIndex: 1`，而 `updateAtlasTexture()` 只上传 `textures[0]`，`finalizeCurrentTexture()` 在翻页那一刻（`cursor.x === 0 && rowHeight === 0`）又把它算成 1px 宽。表现是标签全部进了 `displayedNodeLabels`、字符也提交给了绘制，屏幕上却一个字都没有，且无任何报错——边标签字形少不受影响，1 倍屏也正常，极易误判成 `labelSize` 太小。`utils/node-label-atlas.ts` 在实例建好、首帧之前把图集换成不乘 `devicePixelRatio` 的 64，可容约 600 个字形；字号经 `labelAtlasFontSize` prop 可调。这套内部字段（`internals.labelProgram`、`atlasFontSize`、`atlasManager`）上游全是 private，升级 sigma 后要回归验证。新 manager 的类从现有实例原型取而不从 `sigma` 命名导入——测试里 `vi.mock('sigma')` 的工厂只返回 `default`，多取一个导出会让所有挂载组件的用例报错
- 上一条与 `glDrawArraysInstanced` 那条告警无关，排查时别被它带偏：告警在 1 倍屏同样出现，而 1 倍屏标签是正常的
- **sigma 的下限是 `4.0.0-beta.3`，不要为了兼容旧 beta 而放宽。** `visibility: 'hidden'` 的两处缺陷——隐藏元素别名纹理第 0 行（[PR #1550](https://github.com/jacomyal/sigma.js/pull/1550)）与隐藏边导致后续边属性行错位（issue #1549 第二部分）——在 beta.3 才由上游修好：前者用 `HIDDEN_ITEM_INDEX = -1` 哨兵写进 `a_nodeIndex` / `a_edgeIndex`，后者把键控分配器换成 `updateAllAttributesAtRow(edgeTextureIndex, packed)`。降到更低版本不会报错，只会让 `useSigmaFilter`、`SigmaLegend` 与 `useSigmaState` 的隐藏路径静默渲染成第 0 号元素的副本。仓库此前随包发布的 `patches/sigma@4.0.0-beta.1.patch` 已随升级删除，不要重建
- **边标签的字号与朝向上游都没有旋钮，别浪费时间找。** `DEFAULT_EDGE_LABEL_SIZE = 12` 硬编码在 `LabelRenderer` 里，`EdgeLabelOptions` 只暴露 `color` / `margin` / `textBorder` / `fontSizeMode` / `minVisibilityThreshold` / `fullVisibilityThreshold`，没有 size；节点侧的 `NodeDisplayData.labelSize` 边侧没有对应物。字符旋转恒为 source→target 切向，`EdgeLabelPosition` 的 `'auto'` 只在 `computeEdgeLabelPerpOffset()` 里决定贴线的哪一侧，不动字形朝向，所以指向左侧的边标签整串倒置无解。另外边标签有两处会让它整体消失或逐字淡出的原生机制：`computeEdgeLabelAlpha()` 在 `bodyLength / textWidth < minVisibilityThreshold`（默认 0.5）时直接返回 alpha 0，文字与背景用的是同一判据所以一起消失；`v_edgeFade` 让贴近 body 两端的字符淡出。排查「边标签不见了」先调这两个阈值，别先怀疑字形图集

## 演示应用

文档站接手了对外展示，playground 仍然留着——它是「模块能否装进一个干净 Nuxt 项目」的验证信号，而 docs 带着 `@nuxt/ui` 与 Tailwind，给不出这个信号。因此对 UI 依赖有明确分区。

| 目录 | UI 依赖 | 承载内容 |
| --- | --- | --- |
| `playgrounds/basic` | 零，永远不引入 | 全部公开 API 的示例（反向引用 docs 的目录）、内置控件的原样外观、规模三档、**纯原生逃生舱** |
| `playgrounds/ui` | `@movk/nuxt` | 插槽接管控件外观、服务端接口驱动的完整知识图谱场景 |
| `docs` | `@nuxt/ui`（经 `@movk/nuxt-docs`） | 面向用户的 API 参考，示例源码的唯一数据源 |

必须分区的三条理由：

- 逃生舱示例的全部说服力来自「不用库的任何东西也能跑」，混进 UI 库就废了
- 内置控件自带极简 CSS 与 CSS 变量，若外观全被 UI 库接管，这套样式无人可见也就无人验证
- 混入大型 UI 模块后，样式冲突、自动导入冲突、构建失败都难以归因，验证信号被污染

选 `@movk/nuxt` 而不是直接用 `@nuxt/ui`：前者本身就建在后者之上，且演示两个 movk 库如何配合更贴近实际项目。引入时它要求的 `tailwindcss` 装进 `playgrounds/ui` 这个 workspace，**不准用 `shamefully-hoist=true` 绕过**，理由见红线第一条。

三个应用都显式声明自己用到的可选 peer（`@sigma/*`、`graphology-layout*`、`graphology-metrics` 等）。不靠仓库根的 devDependencies 蹭解析——那样得到的「装得进干净项目」信号是假的。docs 因为要跑同一批示例，peer 清单与 basic 一致。

`playgrounds/ui` 还需要一个会话密钥：`@movk/nuxt` 依赖 `nuxt-auth-utils`，它在每个请求上取会话，密钥为空会让整页 500。playground 不做鉴权，`nuxt.config.ts` 里给了开发占位值，真实项目用 `NUXT_SESSION_PASSWORD` 覆盖。

## 文档站

`docs/` 是 `@movk/nuxt-docs` 的消费方，`pnpm docs` 起站。入门、组件、composables、工具函数、指南五个分组，一 API 一页已补齐。部署未排期。

### 示例的唯一数据源在 docs

50 个示例、`corpus.ts`、`examples.css` 与 `public/data/` 全部住在 `docs/`，`playgrounds/basic` 经 `components` / `imports.dirs` / `css` / `nitro.publicAssets` 四处的绝对路径**反向引用**同一份文件。不要在 basic 下重建这些目录，两份会立刻漂移。

物理位置必须在 docs 侧，因为 `ComponentExample.vue` 用 `import.meta.glob('~/components/content/examples/**/*.vue')` 找预览组件，`~` 硬绑 docs 自身 srcDir。示例放在别处时**预览会静默消失**——模板是 `v-else-if="resolvedComponent"`，没有兜底分支也不报错，只剩源码块。改完示例位置务必肉眼确认预览还在。

（源码抓取是另一条链路，按 `shortPath.includes('components/content/examples/')` 过滤，跨 workspace 的相对路径仍含这个片段，不受影响。）

**目录与命名**：PascalCase 加 `Example` 后缀，MDC 侧写 `:component-example{name="GraphBasicExample"}`。两边的 `nuxt.config.ts` 都必须给这个目录配 `pathPrefix: false`，否则组件名会被拼成 `ContentExamplesGraphBasicExample`，与服务端接口的 `pascalCase(name)` 查找对不上。

**自包含约束**：

- 自带 `SigmaGraph`、自带数据，不依赖页面布局或任何 playground 专用组件
- 依赖白名单：`@movk/sigma` 的自动导入、`graphology`、`sigma`、Vue API，加上自动导入的 `demoGraph()` / `createScaleGraph()` 与 `examples.css` 的公共 class
- **不准用 `@nuxt/ui` 的自动导入**。示例现在住在装了 `@nuxt/ui` 的 docs 里，误用 `UButton` 这类组件在文档站看不出问题，只有 basic 构建会炸。`pnpm dev:build` 是这条的守门人
- 组件示例的数据内联，因为数据形状本身就是演示内容；composable 与规模示例用 `demoGraph()` / `createScaleGraph()`，那些示例讲的是行为，数据只是背景板
- 示例内的注释会出现在文档的源码展示里，只写验证点，一两行

**示例数据取自 sigma 官方数据集**。`docs/public/data/wikipedia.json` 是从上游 v4 仓库原样 copy 的完整数据集（2085 节点 / 5409 边 / 24 社区），来源与 commit 记在同目录 README。分工照搬上游：

- `demoGraph()` 是同步函数，示例里 `const data = demoGraph()` 一行就要拿到数据，所以它读的是 `docs/app/data/wikipedia-subset.json`——一份 160 节点的子集，随包打进 bundle。子集由 `docs/scripts/build-wikipedia-subset.mjs` 从完整数据集派生，改了取样规则要重跑
- 完整数据集只由 `loadWikipediaGraph()` 按需 `fetch('/data/wikipedia.json')`，886 KB 不该在挂载时加载
- `demoGraph()` 把节点 key 重编为 `n0..nN`（`n0` 恒为枢纽）。示例与文档正文都按这套稳定 id 引用节点，**不要改成真实 key**，否则六处按 `'n0'` / `'n3'` 取节点的示例会一起失效
- `createScaleGraph()` 仍是合成数据，且应当保持：规模示例要 2k / 5k / 20k 节点，官方公开数据目录里最大的图也只有 2085 个，上游那批万级数据集是构建时从 SNAP 下载、不入库的

**成对的示例**：`useSigma()` 是 inject，必须在 `SigmaGraph` 子树内调用，所以 composable 示例一律是 `XxxExample.vue`（渲染图的外壳）加 `XxxPanel.vue`（消费上下文的面板）两个文件。这也正是真实应用的结构。

### 写文档页的硬约束

- **每个 `:component-example` 都要带 `class="example-stage"`**。`.sigma-root` 是 `height: 100%`，文档站的示例容器不给高度就塌成 0。用普通 class 而非 `h-[420px]` 这类原子类，是因为 Tailwind 不扫 `content/` 下的 Markdown，生成不出规则
- **每个 `:component-example` 都要带 `client-only="true"`**，理由同红线第二条
- **一页最多 4 个渲染 sigma 的示例**。`ComponentExample` 没有懒挂载，每个实例吃 3 个 WebGL 上下文，浏览器上限多为 16。超了最早的上下文被丢弃、画布变空白，只在控制台留一行 `Too many active WebGL contexts`。示例更多的 API 要拆页
- **`seo.title` 与 `seo.description` 必须写英文**。OG 图渲染中文会乱码。frontmatter 的 `title` / `description` 照常用中文，那两个进侧边栏与页面正文，不进 OG 图
- **非必要不用表格**。API 一律 `::field-group` 加 `::field{name type}`，默认值写进 field 正文（`默认 \`true\` —— …`），嵌套选项用 `::collapsible` 包一层；MDC 嵌套按冒号递增（`::` → `:::` → `::::`）。签名行单独一句，带 `{lang="ts-type"}`。页面里唯一该出现的表格是 `:component-props` / `:component-emits` / `:component-slots` 自动生成的那三张

### JSDoc 与 API 表的现状

props 表由 `nuxt-component-meta` 从**源码 JSDoc** 自动生成，描述、类型、默认值都能读到——`src/runtime/` 里的 JSDoc 就是文档正文，「代码风格」一节关于 `@defaultValue` / `@see` 的要求因此不只是风格偏好。

emits 与 slots 的**描述目前落不了地**，两个已知缺口都在上游：`vue-component-meta` 对这两类返回空 `description`（`@movk/nuxt-docs` 自己的线上站点同样如此，与 `metaFields` 配置无关），而 `ComponentEmits.vue` 压根没有描述列。JSDoc 照写不误——IDE hover 能用，上游修好即自动显示——但别指望它现在出现在页面上。composables 与工具函数不在 `nuxt-component-meta` 的覆盖范围内，用 `::field-group` 手写。

### h3 版本必须锁死

`pnpm-workspace.yaml` 的 `overrides` 里钉了 `h3: 1.15.11`，**不要摘掉**。依赖树里 h3 v1 与 v2-rc 会同时出现，两套 `H3Event` 互不兼容，症状是两处看起来毫不相干的 typecheck 报错：`playgrounds/ui` 的 `useFetch` 把服务端返回类型塌成 `{}`，docs 则在 `@movk/nuxt-docs` 自身的 server 路由上报 38 条 `H3Event` 不匹配。统一到 v1 后两处一起消失。

nitro 的 `h3-next`（`npm:h3@2` 别名）不受这条 override 影响，那是它有意并存的第二份，不用管。

## 测试要求

- 工具函数与 composables 必须有单测，重点覆盖：`applyGraphDiff` 的坐标保留、`chainReducers` 的合成顺序、`useSigmaGraph` 的 version 递增、`useSigmaNeighborhood` 的 BFS 深度
- 出口兼容专项断言：`settings` 未知键透传后仍能从 `sigma.getSettings()` 读回、`styles` 与 `primitives` 原样到达构造选项、用户自带 reducer 位于链首且被调用
- 组件测试用 `@vue/test-utils`，WebGL 相关 mock 掉 Sigma 构造
- **同一用例内不要并发挂载多个 `SigmaGraph`**：组件在 `onMounted` 里动态 `import('sigma')`，同一 tick 内的并发导入会让 vitest 的 mock 漏掉一个，第二个实例拿到真实 sigma 后崩在 WebGL 上。顺序挂载即可（先 `await` 前一个就绪）
- 需要真实 Nuxt 环境的场景用 `@nuxt/test-utils` 加 `test/fixtures/*`
- `import.meta.dev` 与 `import.meta.client` 是 Nuxt 注入的，vitest 里取不到值。`vitest.config.ts` 里有个 transform 插件把它们替换为 `true`，否则仅开发环境生效的告警与仅客户端执行的分支在测试中都是死代码（Vite 的 `define` 不处理 `import.meta.*`）

## 代码风格

- 不可变优先：不原地修改传入的对象或数组，返回新值。graphology 实例的 mutation 是唯一例外，因为它本身就是可变数据结构
- 文件保持聚焦，200-400 行为宜，上限 800 行
- 不写 emoji
- 不写装饰性注释：禁止 `// =====`、`// -----` 这类由重复符号构成的分隔行；只写说明意图的简短主题注释
- 二次修改时不要在注释里留「修改」「优化」「更新」这类标记
- props 与 options 的 JSDoc 按规范标注 `@defaultValue` 与 `@see`：默认值不写进描述文本，字符串加引号、数字与布尔裸写、数组与对象用反引号包裹；纯描述保持单行，带标签则展开为多行块
- 中文描述使用全角标点，代码标识符、数字、单位、URL 保持半角，中英文之间加空格

## 提交规范

遵循 Conventional Commits，`description`、`body`、`footer` 一律用中文。

- 类型：`feat` `fix` `build` `refactor` `docs` `test` `chore` `perf` `ci`
- 按逻辑分组提交，同类型且同功能关注点的文件归为一组，不要用 `git add .` 一次性提交混合改动
- 不添加 co-author

## MCP 服务

仓库配置了三个（见 `.mcp.json`）：

- `nuxt` —— Nuxt 模块开发规范与 API
- `movk-core` —— 检索 `@movk/core` 可复用的函数与 composables
- `context7` —— 查 sigma / graphology 的 API（sigma 官方无 MCP Server）
