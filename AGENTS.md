# AGENTS.md

`@movk/sigma` —— 基于 sigma v3 的知识图谱可视化 Nuxt 模块，为 Vue 3 / Nuxt 4 提供声明式组件与 composables。

完整设计依据见 [references/movk-sigma-architecture.md](references/movk-sigma-architecture.md)，动手前先读第三节（出口兼容）与第五节（七个技术难点）。

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
playground/               # Nuxt 演示应用，含「纯原生逃生舱」示例
test/                     # vitest + happy-dom + @vue/test-utils
references/               # 架构方案与背景资料
```

M4 起 `playground/` 拆为 `playgrounds/basic` 与 `playgrounds/ui`，见「演示应用」一节。

## 红线

以下几条违反即视为缺陷，评审必须拦。

### runtime 目录禁用自动导入

已发布模块的 `src/runtime/` 内**不能依赖 Nuxt 自动导入**（`node_modules` 内出于性能不启用）。Vue API、`@movk/core`、`@vueuse/core` 以及库内的 composables 与工具函数，全部必须显式 `import`。

本地 playground 会因为源码不在 `node_modules` 而「碰巧通过」，发布后才炸。写完 runtime 代码务必自查一遍 import 是否齐全。

**不准开 `shamefully-hoist=true`。** 它把所有依赖提升到根 `node_modules`，会让漏写的 import 也能解析成功，正好掩盖上面这类 bug。某些依赖（如 `@movk/nuxt` 要求的 `tailwindcss`）的安装文档会建议开它，一律改用「在需要的 workspace 里显式安装」绕开。

### sigma 与 @sigma/* 只能动态导入

sigma 在模块顶层就读 `WebGL2RenderingContext`，服务端与 happy-dom 都没有这个全局，**静态 `import 'sigma'` 或 `import 'sigma/settings'` 会让 SSR 直接 ReferenceError**。

runtime 代码里 sigma 一律 `await import('sigma')`，放在 `onMounted` 之后；类型侧用 `import type`，编译期擦除不影响。graphology 无此问题，可正常静态导入。

`@sigma/node-image`、`@sigma/node-border`、`@sigma/edge-curve`、`@sigma/export-image` 同样如此，**使用方也不能静态 import 它们**。所以 `programs` prop 支持 `defineSigmaProgram(() => import('@sigma/node-border').then(...))` 这种延迟声明，组件会在建实例前解析完。

连带的三条：异步 `onMounted` 要能在实例化完成前被卸载中断；测试需要 `test/setup/webgl-globals.ts` 补桩才能加载真实的 `sigma/settings`；所有可选 peer（布局、metrics、louvain）一律 `await import()` 并在 `catch` 里给出「装哪个包」的可操作提示。

### 出口兼容不可破坏

封装是加法，不是围墙。

- 不代理实例：`useSigma()` 返回原生 `Sigma` 与 `Graph`，不包 Proxy、不包装。注意 Vue 会把 props 包成响应式代理，接收外部实例时必须 `toRaw()` 剥回原对象再往下传
- 不做 settings 白名单：`settings` 整体透传，不逐字段枚举、不过滤未知键
- 不 re-export 上游：不转发 sigma / graphology 的任何值或类型，用户从原包直接 import
- `sigma` 与 `graphology` 保持 peer 依赖，不进 dependencies
- 用户自带的 `settings.nodeReducer` / `edgeReducer` 作为 reducer 链的基座执行，不得被吞掉

### 类型一律用官方类型包

- **禁止安装任何 `@types/*`**：该生态全部包自带 `.d.ts`，`@types/sigma`、`@types/graphology` 等根本不存在
- **禁止自造已有类型**：图数据契约直接用 `graphology-types` 的 `SerializedGraph`，不要写 `GraphData` 这类同义接口
- 库内类型一律从官方类型派生：`settings` 写成 `Partial<Settings>`，`programs` 从 `NodeProgramType` / `EdgeProgramType` 派生

类型来源速查：

| 来源 | 类型 |
| --- | --- |
| `graphology-types` | `SerializedGraph`、`SerializedNode`、`SerializedEdge`、`Attributes` |
| `graphology` | `Graph` |
| `sigma/settings` | `Settings`（reducer 类型未单独导出，见下） |
| `sigma/types` | `NodeDisplayData`、`EdgeDisplayData`、`CameraState`、`Coordinates`、`MouseCoords` |
| `sigma/rendering` | `NodeProgramType`、`EdgeProgramType` |

sigma **没有**导出 `NodeReducer` / `EdgeReducer`，它们只是 `Settings` 上的内联字段类型。库内一律派生，不要自己重写一份签名：

```ts
export type SigmaNodeReducer = NonNullable<Settings['nodeReducer']>
export type SigmaEdgeReducer = NonNullable<Settings['edgeReducer']>
```

### 通用方法先查 @movk/core

写任何工具函数前，先用 `movk-core` MCP 检索是否已有（`list-functions` / `search-composables`）。已确认可复用的有 `debounce`、`throttle`、`splitHighlight`、`triggerDownload`、`convertSvgToPng`、`deepMerge`、`getRandomUUID`、`simpleHash`、`pick`、`omit`、`unique`、`lengthToPx`、`isEmpty` 等。

已迁入 core 的还有 `clamp`、`mapRange`、`createRegistry`、`pipe`，本库不再自带。

core 里确实没有的通用能力，先写在 `src/runtime/utils/` 并在 JSDoc 标注 `@todo 待移入 @movk/core`，便于后续搬迁。图与 sigma 领域的逻辑（`applyGraphDiff`、`chainReducers`、`curveParallelEdges` 等）不属于 core 范畴，正常放 `src/runtime/utils/`。

## 命名约定

Nuxt 模块最佳实践要求所有导出加模块名前缀防冲突：

- 组件：`SigmaGraph`、`SigmaTooltip`、`SigmaZoomControl`
- Composables：`useSigma`、`useSigmaCamera`、`useSigmaLayout`
- 模块配置键：`sigma`

**组件文件名不带前缀**，前缀由 `addComponentsDir` 的 `prefix` 选项统一加上（默认 `'Sigma'`，用户可改）。即 `components/Graph.vue` 注册为 `<SigmaGraph>`，`components/controls/ZoomControl.vue` 注册为 `<SigmaZoomControl>`。目录层级不参与命名（`pathPrefix: false`）。

## 开发流程

```bash
pnpm install
pnpm dev:prepare     # 首次或依赖变更后必须先跑
pnpm dev             # 启动 playground
pnpm test            # vitest
pnpm typecheck
pnpm lint
```

改动 `src/` 后若 playground 表现异常，先重跑 `pnpm dev:prepare`。

四个已经踩过的坑：

- 覆盖层定位有两套坐标：节点用 `framedGraphToViewport()`（`getNodeDisplayData()` 返回的是归一化后的 framed 坐标），原始图坐标才用 `graphToViewport()`，混用会整体错位
- 覆盖层用 `v-show` 保留 DOM，隐藏时插槽内容必须另用 `v-if` 跳过，否则使用方拿到空作用域且隐藏内容仍可点击
- `SigmaGraph` 的默认插槽排在占满高度的画布之后，走的是正常文档流。插槽内的任何面板都必须自行 `position: absolute`，否则会被挤到容器之外并被 `overflow` 裁掉
- `index.css` 里同一属性不要一半写在裸类名规则、一半写在 `:where()` 里：前者优先级 0,1,0，后者是 0，`:where()` 的覆盖永远赢不了。需要被后续规则覆盖的属性，基础规则也要包 `:where()`
- 改完 `src/runtime/index.css` 必须重跑 `pnpm dev:prepare`，playground 加载的是 `dist/` 里的副本，不重新 stub 就还是旧样式

- 根 `tsconfig.json` 必须 `extends: "./.nuxt/tsconfig.json"`。改成 project references 写法会让 `vue-tsc --noEmit` 完全跳过 `src/`，typecheck 空转却仍退出码 0
- 组件 emits 的类型要逐条写出。用 `{ [K in SigmaEventType]: ... }` 这类映射类型派生，`vue-tsc` 能过但 `pnpm build` 会失败——`@vue/compiler-sfc` 要在编译期静态提取事件名，解析不了跨包映射类型

## 演示应用

文档站不排期，演示职责全部由 playground 承担。它同时是「模块能否装进一个干净 Nuxt 项目」的验证信号，因此对 UI 依赖有明确分区。

**M4 之前：不引入任何 UI 库。** M1 到 M3 展示的是渲染与交互原语，一个按钮加一段 `<pre>` 就够，引入 UI 库只有负担没有信息量。

**M4 起拆成两个：**

| 目录 | UI 依赖 | 承载内容 |
| --- | --- | --- |
| `playgrounds/basic` | 零，永远不引入 | 核心渲染、内置控件的原样外观、**纯原生逃生舱示例** |
| `playgrounds/ui` | `@movk/nuxt` | 插槽接管控件外观、完整知识图谱场景 |

必须分区的三条理由：

- 逃生舱示例的全部说服力来自「不用库的任何东西也能跑」，混进 UI 库就废了
- 内置控件自带极简 CSS 与 CSS 变量，若外观全被 UI 库接管，这套样式无人可见也就无人验证
- 混入大型 UI 模块后，样式冲突、自动导入冲突、构建失败都难以归因，验证信号被污染

选 `@movk/nuxt` 而不是直接用 `@nuxt/ui`：前者本身就建在后者之上，且演示两个 movk 库如何配合更贴近实际项目。引入时它要求的 `tailwindcss` 装进 `playgrounds/ui` 这个 workspace，**不准用 `shamefully-hoist=true` 绕过**，理由见红线第一条。

## 测试要求

- 工具函数与 composables 必须有单测，重点覆盖：`applyGraphDiff` 的坐标保留、`chainReducers` 的合成顺序、`useSigmaGraph` 的 version 递增、`useSigmaNeighborhood` 的 BFS 深度
- 出口兼容专项断言：`settings` 未知键透传后仍能从 `sigma.getSettings()` 读回、用户自带 reducer 位于链首且被调用
- 组件测试用 `@vue/test-utils`，WebGL 相关 mock 掉 Sigma 构造
- **同一用例内不要并发挂载多个 `SigmaGraph`**：组件在 `onMounted` 里动态 `import('sigma')`，同一 tick 内的并发导入会让 vitest 的 mock 漏掉一个，第二个实例拿到真实 sigma 后崩在 WebGL 上。顺序挂载即可（先 `await` 前一个就绪）
- 需要真实 Nuxt 环境的场景用 `@nuxt/test-utils` 加 `test/fixtures/*`

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
