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

## Sigma v4

使用 sigma v4，重新根据 v4 版本进行架构设计：

- [官方文档](https://v4.sigmajs.org/)
- [github 仓库](https://github.com/jacomyal/sigma.js/tree/v4)
