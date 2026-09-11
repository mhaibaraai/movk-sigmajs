# AGENTS.md

`@movk/sigma` —— 基于 sigma v4 的知识图谱可视化库，以 Nuxt 模块为主入口，同时经 `@movk/sigma/vite`、`@movk/sigma/vue` 与 `@movk/sigma/vue-plugin` 支持纯 Vue 3 + Vite，为两侧提供同一套声明式组件与 composables。

## 项目概览

pnpm workspace，仓库根目录即发布包 `@movk/sigma`，子包 `docs`、`playgrounds/*`、`test/fixtures/*` 全部 private，不参与发布。

## 仓库结构

```text
src/module.ts                          Nuxt 模块入口：alias #sigma、注册组件与自动导入、挂 runtime/plugins/config
src/vite.ts                            @movk/sigma/vite：Vite 插件，自动导入 + optimizeDeps，unplugin 三件套动态加载
src/unplugin.ts                        @movk/sigma/unplugin：sigmaComponentResolver / sigmaAutoImportDirs，可注入宿主 unplugin 实例
src/vue-plugin.ts                      @movk/sigma/vue-plugin：Vue 插件，只注入全局 settings，不做全局组件注册
src/optimize-deps.ts                   探测已安装的可选 peer，生成 vite optimizeDeps.include，Nuxt 与 Vite 两侧共用
build.config.ts                        unbuild 多入口配置，nuxt-module-build 在自身产物之外追加 vite/unplugin/vue-plugin
src/runtime/index.ts                   @movk/sigma/vue 的 barrel：组件、composables、utils、config 与类型的具名出口
src/runtime/env.ts                     isDev / isClient 环境标记，替代 Nuxt 专属的 import.meta.dev / import.meta.client
src/runtime/config.ts                  globalThis 单例的运行时配置桥，Nuxt 插件与 vue-plugin 都写这里
src/runtime/plugins/config.ts          Nuxt 插件：把 runtimeConfig.public.sigma.settings 转交给 config.ts
src/runtime/components/                Graph.vue 与覆盖层，controls/ 下为控件
src/runtime/composables/               15 个 use-sigma*.ts，目录级自动导入
src/runtime/utils/                     图算法与样式工具，目录级自动导入
src/runtime/types/public.ts            对外类型出口，module.ts 里 export type *
src/runtime/index.css                  控件与覆盖层样式，--sigma-color-* 变量
docs/                                  文档站，extends @movk/nuxt-docs + Nuxt Content 3
docs/app/components/content/examples/  文档示例组件 XxxExample.vue
docs/server/api/                       示例数据接口
playgrounds/nuxt/                      Nuxt 示例场，分组对齐 docs 的 category
playgrounds/vite/                      纯 Vite + Vue 3 验证场，四个示例覆盖自动导入、可选 peer、具名导入与全局 settings
test/                                  vitest 用例，test/fixtures/basic 为 Nuxt fixture
```

`playgrounds/nuxt` 只复用 docs 的**数据层**：`nitro.scanDirs` 挂 `docs/server`、`publicAssets` 挂 `docs/public/data`，示例统一 `useFetch('/api/xxx.json')`。示例组件由 playground 自建，改动 docs 示例不影响 playground。

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `pnpm dev:prepare` | 首次克隆或依赖变更后必须先跑：stub 构建 + prepare 全部子包 + 一次 `dev:vite:build` |
| `pnpm dev` / `pnpm dev:vite` | 启动 `playgrounds/nuxt` / `playgrounds/vite` |
| `pnpm dev:vite:build` | 真实 vite 构建 `playgrounds/vite`，防止 Vue 路径静默腐化 |
| `pnpm docs` / `pnpm docs:build` | 文档站开发与构建 |
| `pnpm lint` / `pnpm lint:fix` | eslint 检查与修复 |
| `pnpm typecheck` | vue-tsc 加 `playgrounds/nuxt` 与 docs 的 nuxt typecheck，以及 `playgrounds/vite` 的 vue-tsc |
| `pnpm test` / `pnpm test:watch` | vitest |
| `pnpm build` | nuxt-module-build 构建发布产物 |

仓库没有配置 git hooks，提交前需手动按 CI 顺序自检：`lint` → `typecheck` → `test` → `build`。

## 架构约定

- 组件注册为 `addComponentsDir({ prefix: 'Sigma', pathPrefix: false })`，目录层级不进组件名：`controls/Controls.vue` → `<SigmaControls>`，`controls/SearchControl.vue` → `<SigmaSearchControl>`
- composables 与 utils 按目录自动导入且无前缀，新增文件即可直接使用，不需要在 `module.ts` 登记
- 运行时内部互相引用一律用相对路径，`#sigma` alias 只对 Nuxt 消费方开放，`src/` 内不使用
- 运行时不得引用 `#app` 或 `import.meta.dev` / `import.meta.client` 等 Nuxt 专属 API：环境判断走 `src/runtime/env.ts`，全局配置走 `src/runtime/config.ts`
- 新增组件必须补进 `src/runtime/index.ts` 的 barrel，`test/vue-entry.test.ts` 会比对导出与 `components/**/*.vue` 文件集合
- `playgrounds/vite` 的浏览器侧 alias 指向 `src/` 源码（`--stub` 产物经 jiti 加载会把 jiti 拖进浏览器包），`vite.config.ts` 自身 import 的 `@movk/sigma/vite` 走 Node 侧 stub 无需 alias
- 新增对外类型必须补进 `src/runtime/types/public.ts`，否则消费方拿不到；`test/type-exports.test-d.ts` 由 `vue-tsc --noEmit` 覆盖，不在 `vitest run` 范围内
- 可选 peer 依赖（`@sigma/*`、`graphology-layout*`、`graphology-metrics`、`graphology-communities-louvain`）一律动态 `import()` 并处理缺失分支，参考 `use-sigma-layout.ts` 与 `use-sigma-export.ts`；新增可选 peer 时同步更新 `package.json` 的 `peerDependenciesMeta` 与 `src/optimize-deps.ts`
- 模块选项为 `prefix` / `settings` / `css` / `optimizeDeps`，其中全局默认 settings 写入 `runtimeConfig.public.sigma.settings`，再由 `runtime/plugins/config.ts` 转交 `config.ts`；Vite 侧对应 `vue-plugin` 的 `settings`
- unplugin 三件套（`unplugin`、`unplugin-vue-components`、`unplugin-auto-import`）是可选 peer，只有走 `@movk/sigma/vite` 才需要，`src/unplugin.ts` 里动态 `import()` 并给出安装指引；`sigmaComponentResolver` / `sigmaAutoImportDirs` 只读文件系统，不触碰三件套

## 代码风格

- 文件保持聚焦，200-400 行为宜，上限 800 行
- 不写 emoji
- 不写装饰性注释：禁止 `// =====`、`// -----` 这类由重复符号构成的分隔行；只写说明意图的简短主题注释
- 二次修改时不要在注释里留「修改」「优化」「更新」这类标记
- props 与 options 的 JSDoc 按规范标注 `@defaultValue` 与 `@see`：默认值不写进描述文本，字符串加引号、数字与布尔裸写、数组与对象用反引号包裹；纯描述保持单行，带标签则展开为多行块
- 中文描述使用全角标点，代码标识符、数字、单位、URL 保持半角，中英文之间加空格

## 测试

- vitest 4 + happy-dom，用例放在根目录 `test/`，扁平命名 `<主题>.test.ts`
- `test/setup/webgl-globals.ts` 桩了 WebGL 常量，happy-dom 没有 WebGL，缺了它静态 import sigma 会直接 ReferenceError
- `#app` 通过 alias 指向 `test/setup/nuxt-app-stub.ts`；`vitest.config.ts` 里的自定义插件会把 `src/runtime/` 下的 `import.meta.dev` 与 `import.meta.client` 替换为 `true`
- 仓库未配置 coverage provider，不要在 PR 描述里声称覆盖率数字

## 组件文档页

- 骨架：`## 用法`（开篇 + 一 prop 一 `###` 小节，顺序照 `defineProps`）→ `## 示例`（插槽、expose 方法等非 prop 能力，一节一项）→ `## API`
- 每个小节配一个可跑示例 `:component-example{name="XxxExample"}`；prop 变体由 MDC `options` 选择条驱动，示例内不写切换按钮
- `### Slots` 只放 `:component-slots`，作用域说明写在 `## 示例` 的插槽小节；`### Expose` 用 `| Name | Type |` 两列表格
- 示例的读数与按钮放进 `<SigmaControls>`，用 Nuxt UI 与工具类，不用 `.demo-*` 面板类
- 样板：`docs/content/docs/2.components/1.graph.md`

## 提交与发布

遵循 Conventional Commits，`description`、`body`、`footer` 一律用中文。

- 类型：`feat` `fix` `build` `refactor` `docs` `test` `chore` `perf` `ci`
- 按逻辑分组提交，同类型且同功能关注点的文件归为一组，不要用 `git add .` 一次性提交混合改动
- 不添加 co-author

发布流程：

- `pnpm release` 走 release-it，`hooks.before:init` 会先跑 lint、typecheck、test，然后改 CHANGELOG、提交并打 tag
- npm 发布由 `.github/workflows/release.yml` 在 tag `v*` 上触发，会校验 tag 与 `package.json` 的 version 一致，不一致直接失败
- CHANGELOG 由 conventional-changelog 从提交信息生成，因此提交描述必须是可读的完整中文

## MCP 服务

仓库配置了三个（见 `.mcp.json`）：

- `nuxt` —— Nuxt 模块开发规范与 API
- `movk-core` —— 检索 `@movk/core` 可复用的函数与 composables
- `context7` —— 查 sigma / graphology 的 API（sigma 官方无 MCP Server）

## Sigma v4

使用 sigma v4，重新根据 v4 版本进行架构设计：

- [官方文档](https://v4.sigmajs.org/)
- [github 仓库](https://github.com/jacomyal/sigma.js/tree/v4)
