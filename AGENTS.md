# AGENTS.md

`@movk/sigma` —— 基于 sigma v3 的知识图谱可视化 Nuxt 模块，为 Vue 3 / Nuxt 4 提供声明式组件与 composables。

完整设计依据见 [references/movk-sigma-architecture.md](references/movk-sigma-architecture.md)，动手前先读第三节（出口兼容）与第五节（七个技术难点）。

## 目录结构

```text
src/
├── module.ts             # defineNuxtModule：meta / defaults / setup
└── runtime/
    ├── components/       # core 与 controls 两组，文件名带 Sigma 前缀
    ├── composables/
    ├── utils/
    │   └── core-candidates.ts   # 待移入 @movk/core 的通用函数
    ├── types/
    └── index.css         # 可选样式表
playground/               # Nuxt 演示应用，含「纯原生逃生舱」示例
test/                     # vitest + happy-dom + @vue/test-utils
references/               # 架构方案与背景资料
```

## 红线

以下几条违反即视为缺陷，评审必须拦。

### runtime 目录禁用自动导入

已发布模块的 `src/runtime/` 内**不能依赖 Nuxt 自动导入**（`node_modules` 内出于性能不启用）。Vue API、`@movk/core`、`@vueuse/core` 以及库内的 composables 与工具函数，全部必须显式 `import`。

本地 playground 会因为源码不在 `node_modules` 而「碰巧通过」，发布后才炸。写完 runtime 代码务必自查一遍 import 是否齐全。

### 出口兼容不可破坏

封装是加法，不是围墙。

- 不代理实例：`useSigma()` 返回原生 `Sigma` 与 `Graph`，不包 Proxy、不包装
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
| `sigma/settings` | `Settings`、`NodeReducer`、`EdgeReducer` |
| `sigma/types` | `NodeDisplayData`、`EdgeDisplayData`、`CameraState`、`Coordinates`、`MouseCoords` |
| `sigma/rendering` | `NodeProgramType`、`EdgeProgramType` |

### 通用方法先查 @movk/core

写任何工具函数前，先用 `movk-core` MCP 检索是否已有（`list-functions` / `search-composables`）。已确认可复用的有 `debounce`、`throttle`、`splitHighlight`、`triggerDownload`、`convertSvgToPng`、`deepMerge`、`getRandomUUID`、`simpleHash`、`pick`、`omit`、`unique`、`lengthToPx`、`isEmpty` 等。

core 里确实没有的通用能力，写进 `src/runtime/utils/core-candidates.ts`，并在 JSDoc 标注 `@todo 待移入 @movk/core`，便于后续整体搬迁。图与 sigma 领域的逻辑（`applyGraphDiff`、`chainReducers` 等）不属于 core 范畴，正常放 `src/runtime/utils/`。

## 命名约定

Nuxt 模块最佳实践要求所有导出加模块名前缀防冲突：

- 组件：`SigmaGraph`、`SigmaTooltip`、`SigmaZoomControl`
- Composables：`useSigma`、`useSigmaCamera`、`useSigmaLayout`
- 模块配置键：`sigma`

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

## 测试要求

- 工具函数与 composables 必须有单测，重点覆盖：`applyGraphDiff` 的坐标保留、`chainReducers` 的合成顺序、`useSigmaGraph` 的 version 递增、`useSigmaNeighborhood` 的 BFS 深度
- 出口兼容专项断言：`settings` 未知键透传后仍能从 `sigma.getSettings()` 读回、用户自带 reducer 位于链首且被调用
- 组件测试用 `@vue/test-utils`，WebGL 相关 mock 掉 Sigma 构造
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
