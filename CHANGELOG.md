# Changelog

## [0.0.2](https://github.com/mhaibaraai/movk-sigmajs/compare/v0.0.1...v0.0.2) (2026-07-27)

### Build System

* 声明 publishConfig 公开发布 ([1d08fde](https://github.com/mhaibaraai/movk-sigmajs/commit/1d08fde1c454e575e1ffad1b5752087c0799209e))

## 0.0.1 (2026-07-27)

### Features

* **components:** 新增六个内置控件 b682ee4
* **components:** 新增覆盖层与三个派生组件 361ed1b
* **composables:** 新增分析、检索与过滤 d53e227
* **composables:** 新增响应式桥接与基础 composables d87e760
* **composables:** 新增图片导出 b2be593
* **composables:** 新增布局统一入口并托管 worker 生命周期 cab3753
* **composables:** 新增节点拖拽 5ab4fba
* **composables:** 新增选中状态机与邻域展开 a4f5109
* **playground:** basic 重构为按 API 分组的全量示例体系 925948c
* **playground:** ExampleCard 加零依赖源码展示 b456b36, references #examples
* **playground:** 新增 playgrounds/ui，接口驱动的完整知识图谱场景 c170016
* programs 支持延迟加载的渲染程序声明 e28da5f
* **style:** 重写样式底座为两层变量与双通道深色模式 e7ba19e
* **types:** 公开类型全部从 @movk/sigma 根出口 a052ee9
* **utils:** 新增平行边与自环的曲率分配 882b59a
* **utils:** 补齐架构方案承诺的抽样与视觉映射函数 a2c58cf
* 实现 reducer 链，让多个归约关注点共存 f13e231
* 新增 SigmaGraph 根组件并接入模块注册 fb8ac14
* 新增模块入口与图数据增量同步工具 929b404
* 补充上下文类型、事件登记与通用工具 2af4033

### Bug Fixes

* **build:** 修正根 tsconfig，让 typecheck 真正覆盖 src 7c3744b
* **components:** 区分复位与全屏的默认图标 4210b2d
* **components:** 右键菜单同时拦住浏览器原生菜单 97f5d88
* **components:** 图例插槽补上 toggle 与 reset a5e06c4
* **components:** 实例注册表改为仅客户端登记 aab0cec
* **composables:** useSigmaById 改为响应式，修复取不到后挂载的实例 e655ddf
* **composables:** 重复 id 告警推迟一拍，避免把组件交接误报成冲突 359efbb
* **playground:** 修正分析面板定位导致其落在舞台之外 e1b1d3c
* **playground:** 修正示例里的三处缺陷 db4fdda
* **style:** 控件按内容自适应宽度 9b201b8
* **tsconfig:** 排除路径跟上 playgrounds 改名 18cc7ea
* **utils:** chainReducers 单条时也合并，不再原样透传 f0f5e3e
* **utils:** 跳过端点缺失的边而非抛错 5509b06
* 多重图的平行边不再被压成一条 3bb6b66

### Performance Improvements

* **utils:** chainReducers 减少热路径上的对象分配 abbd68c

### Documentation

* AGENTS 与 README 同步文档站现状 195ab30
* AGENTS 补充 h3 锁版本与文档页写作约定 8cd797e
* **graph:** 补齐 SigmaGraph 的 emits 逐条 JSDoc 与默认插槽说明 df079cb
* **readme:** 同步实现现状与公开 API 清单 4af2107
* **references:** 新增 sigma.js 上手指南 994fa19
* **references:** 新增知识图谱可视化模块架构方案 0e1c453
* **site:** seo 标题改英文，API 表改用 field-group ab9c151
* **site:** 首页、入门两页与三个样板 API 页 fb6fa49
* **src:** 补齐跨文件链路与坐标系的注释 7e43340, references #sigma
* 修正类型来源与组件命名的两处错误 31d7db5
* 同步 M2 实现中确认的坐标与插槽约定 b6523c3
* 同步 playground 拆分结果与示例组织约定 2f76060
* 同步实现过程中发现的四处偏差 9985c9c
* 明确 playground 的 UI 依赖分区策略 2e3e6bf
* 补充 :where() 优先级与样式改动需重跑 dev:prepare 的坑 b71edf1
* 补充 @sigma/* 的延迟加载要求与 betweenness 的已知偏差 4e9c795
* 补充 AGENTS.md 与 README 说明 bc231b3
* 补充插槽内容须自行绝对定位的坑 35d8e0e
* 记录 core 迁移结论与本轮踩到的坑 2006573
* 记录不内置 Tailwind 的结论与控件实现要点 c122c2d

### Code Refactoring

* **examples:** 示例迁入 docs，playgrounds/basic 反向引用 909588d
* 移除已迁入 @movk/core 的 core-candidates 9858274

### Tests

* 修正被 Record<string, unknown> 挡住的调用断言 1d22875
* 接入 WebGL 全局桩的 setup 文件 ada1053
* 覆盖 M2 的交互原语与覆盖层 8311b12
* 覆盖 M3 的布局、分析、检索、过滤与延迟程序 bd54ba5
* 覆盖内置控件与导出 e047a05
* 覆盖增量同步与归约链合成 759e138
* 覆盖根组件、响应式桥接与通用工具 8643b28

### Build System

* **docs:** 新建 @movk/nuxt-docs 文档站 workspace 52ffae0
* playground 迁移为 playgrounds/basic 1f1679a
* 按 Nuxt 官方模块脚手架初始化工程 f50d9c9
* 接入 @movk/core 预览构建并补声明两个渲染程序包 4d27992
* 锁定 h3 到 1.15.11 并把 docs 纳入 typecheck a177d5f

### Chores

* **components:** 精简覆盖层组件内的注释 65546f6
* **playground:** 新增最小演示应用 1ff9398
* **playground:** 概览页调亮边色并补 5000 规模档 35cfb9e
* **playground:** 演示内置控件 06c4329
* **playground:** 演示声明式用法与纯原生逃生舱 35dc298
* **playground:** 演示布局、分析与延迟加载的渲染程序 d413f44
* **playground:** 演示拖拽、平行边分离与视觉映射 4dfb670
* **playground:** 演示选中高亮、详情懒加载与邻域展开 5df58e4
* 初始化项目基础配置 8aba504
* 配置项目 MCP 服务 970b418
