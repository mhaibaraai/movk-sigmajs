# Changelog

## [0.1.3](https://github.com/mhaibaraai/movk-sigmajs/compare/v0.1.2...v0.1.3) (2026-08-17)

### ⚠ BREAKING CHANGES

* **camera:** peer sigma 下界抬到 >=4.0.0-beta.0。alpha 版没有 zoomIn /
  zoomOut / reset，继续搭 alpha 会让缩放控件在运行时报错。

### Features

* **controls:** 停靠位补到八向，排布方向补上反向 ([ce418fb](https://github.com/mhaibaraai/movk-sigmajs/commit/ce418fb0283d83faec8470fada2f4519d5f20995))

### Bug Fixes

* **camera:** 跟进 sigma 4.0.0-beta.0 的相机 API ([1c7a80d](https://github.com/mhaibaraai/movk-sigmajs/commit/1c7a80d4549716fba0ae2b8026528c047e13722c))
* **filter:** useSigmaFilter 改用透明化归约，避免 sigma v4-beta 的 GPU 渲染缺陷 ([2ed882e](https://github.com/mhaibaraai/movk-sigmajs/commit/2ed882e8d2b8637e6af385157214cdad6b120716))
* **graph:** 修复 SigmaGraph afterTexturesUpload Vue 警告 ([8609ca6](https://github.com/mhaibaraai/movk-sigmajs/commit/8609ca60b0ec7cf901699ce8940012ea652e5521))
* **graph:** 归约刷新前先 flush 图级状态 ([2b267ab](https://github.com/mhaibaraai/movk-sigmajs/commit/2b267abaed2c1740dcaa31f8c3f44dfe6730298b))
* **sigma:** 随包发布 sigma@4.0.0-beta.0 补丁，作为次要防御 ([4982466](https://github.com/mhaibaraai/movk-sigmajs/commit/4982466a04f47b074321a69e72eef07ecf76c27e))

### Reverts

* **filter:** useSigmaFilter 回归 visibility，撤回透明化归约 ([4a37bda](https://github.com/mhaibaraai/movk-sigmajs/commit/4a37bdaee31b85bb77792119e3a4d504a3a1d1bb))

### Documentation

* AGENTS.md 记录 sigma 版本下限，移除 patch 退出条件 ([52c631f](https://github.com/mhaibaraai/movk-sigmajs/commit/52c631f69d586a8ae215f92d6715a1b3e62b1312))
* **controls:** 补齐八向停靠与排布方向的说明与示例 ([d7167f4](https://github.com/mhaibaraai/movk-sigmajs/commit/d7167f4fec1849838235ab50eafd8dfb9935c9b2))
* **filter:** sigma patch 从「次要防御」升为必需前置 ([901ef32](https://github.com/mhaibaraai/movk-sigmajs/commit/901ef3280cd11583f0c0e0dc8cb8666b4a28059b))
* **filter:** 同步过滤态渲染语义变更到相关文档 ([400a2f8](https://github.com/mhaibaraai/movk-sigmajs/commit/400a2f8dd3a2f0620c4139d40deaf2f5c0b357ca))
* 同步 sigma patch 版本号至 4.0.0-beta.1 ([b74dab1](https://github.com/mhaibaraai/movk-sigmajs/commit/b74dab1ff44ed7abb800fc77bd380efc86773f2d))
* 相机 API 更名后同步示例与说明 ([eeef4d9](https://github.com/mhaibaraai/movk-sigmajs/commit/eeef4d9e3a7bcf1d882bf80456a49f6e5c156db4))
* 移除 sigma patch 接入说明，改为版本下限要求 ([fc9059c](https://github.com/mhaibaraai/movk-sigmajs/commit/fc9059cfb2115eccdf8f1b42cadb82ed20e02c9e))
* 补上游修复状态与 patch 退出条件 ([dabf665](https://github.com/mhaibaraai/movk-sigmajs/commit/dabf66552e17b040d639702717095a3c846de9f7))

### Tests

* **controls:** 参数化断言八个停靠位与四种排布方向 ([5531488](https://github.com/mhaibaraai/movk-sigmajs/commit/55314887016afbd577f10a27bb6660ebe915451e))

### Build System

* **deps:** sigma 升级至 4.0.0-beta.1 ([7074d39](https://github.com/mhaibaraai/movk-sigmajs/commit/7074d39d64faeda2179aa92125d503284f0adb1b))
* **deps:** sigma 升级至 4.0.0-beta.3 并移除 patch ([b479654](https://github.com/mhaibaraai/movk-sigmajs/commit/b4796542c9b8fd9b6f9c1ca1a0ce66f66ce533d1)), references [#1550](https://github.com/mhaibaraai/movk-sigmajs/issues/1550)
* **patch:** sigma patch 注释改指上游已合入的修复 ([15d268e](https://github.com/mhaibaraai/movk-sigmajs/commit/15d268eae829eedbb488c02b41801fd32afd585e)), references [#1549](https://github.com/mhaibaraai/movk-sigmajs/issues/1549)
* **patch:** sigma patch 重建至 4.0.0-beta.1 ([3d8aa65](https://github.com/mhaibaraai/movk-sigmajs/commit/3d8aa65f52d40bae4864c1f8feaf181bd24dae53))

### Chores

* **deps:** 升级依赖包版本 ([90cc117](https://github.com/mhaibaraai/movk-sigmajs/commit/90cc117461783e69c354d9dbd2c14ce48470d2d3))
* 忽略本地 AI 工具目录 ([7f1577e](https://github.com/mhaibaraai/movk-sigmajs/commit/7f1577e32f4c10a6aa49b032447eeedc5cfcaafb))

## [0.1.2](https://github.com/mhaibaraai/movk-sigmajs/compare/v0.1.1...v0.1.2) (2026-08-06)

### Bug Fixes

* **layout:** 分量归一化改按节点数定密度 ([104a12e](https://github.com/mhaibaraai/movk-sigmajs/commit/104a12e084181590bb77ea561b79e00daefcfc5e))

## [0.1.1](https://github.com/mhaibaraai/movk-sigmajs/compare/v0.1.0...v0.1.1) (2026-08-06)

### Features

* **camera:** fitTo 支持浮层遮挡与相机比例下限 ([3e4cf98](https://github.com/mhaibaraai/movk-sigmajs/commit/3e4cf98048e0efb950b60afca706e5405862b0fc))
* **layout:** useSigmaLayout 支持按连通分量布局 ([a7b6df2](https://github.com/mhaibaraai/movk-sigmajs/commit/a7b6df207dbda92ccc524eeae32f5c2f9ea38ac5))

### Documentation

* 补充按连通分量布局与浮层遮挡 fit 的说明与示例 ([9ffb9ec](https://github.com/mhaibaraai/movk-sigmajs/commit/9ffb9ecb23edb6d5a4b8ba13d950887fdce81fff))

### Chores

* **types:** 从根出口导出新增的布局与相机选项类型 ([c61278c](https://github.com/mhaibaraai/movk-sigmajs/commit/c61278c9f10ba13a8d2b931a2efe7ae2dd6a9f66))

## [0.1.0](https://github.com/mhaibaraai/movk-sigmajs/compare/v0.0.4...v0.1.0) (2026-08-06)

### ⚠ BREAKING CHANGES

* **runtime:** 需要 sigma >= 4.0.0-alpha.7。programs prop 与
  defineSigmaProgram() 移除，改用 primitives；节点隐藏从 hidden 改为
  visibility；标签置空从 label: null 改为 labelVisibility: 'hidden'。

### Features

* **composables:** 新增 useSigmaLabelTiers 按相机比例分级标签 ([132313b](https://github.com/mhaibaraai/movk-sigmajs/commit/132313b93db9a2b5fade65c0c9b1473e7c8b53cd))
* **docs:** 升级 @movk/nuxt-docs 并接入 AI 对话与 Vercel Analytics ([0a39890](https://github.com/mhaibaraai/movk-sigmajs/commit/0a398909b0815b28a25f6d62d9becd2f399e4b15))
* **docs:** 示例数据改用 sigma 官方 wikipedia 数据集 ([baf49df](https://github.com/mhaibaraai/movk-sigmajs/commit/baf49df99aa3bcaa0f7ab98e5d14af23d5d83a00))
* **examples:** 演示边的 path 与 head 按属性绑定 ([7fb8ad0](https://github.com/mhaibaraai/movk-sigmajs/commit/7fb8ad0abceabf999e5f65a6778e3f336450457c))
* **programs:** 新增 createNodeShapeProgram 多边形与星形节点 ([a0a0395](https://github.com/mhaibaraai/movk-sigmajs/commit/a0a03952dfb2eef6e25abf24aa0a11011a0ea540))
* **runtime:** primitives 支持延迟声明 ([e05f256](https://github.com/mhaibaraai/movk-sigmajs/commit/e05f256d99ac55c97b8a864db091d94e186a1d22))
* **runtime:** 迁移到 sigma v4 的 styles/primitives/state 架构 ([c5a1bf6](https://github.com/mhaibaraai/movk-sigmajs/commit/c5a1bf6342c8b637eafd8f34985382060f5827c3)), references [#app](https://github.com/mhaibaraai/movk-sigmajs/issues/app)
* **types:** 汇出标签与形状相关的公开类型 ([6673652](https://github.com/mhaibaraai/movk-sigmajs/commit/6673652640c5c31cc246410b0fede7ccc1599ff1))
* **utils:** 新增标签避让绘制层与档位、方位派生 ([110329b](https://github.com/mhaibaraai/movk-sigmajs/commit/110329b742d5446869c08d2c730f19785e64f1e9))

### Bug Fixes

* **examples:** useSigma 示例不再写死节点 id ([a995fb2](https://github.com/mhaibaraai/movk-sigmajs/commit/a995fb297c8651de42d1313fc141cb545fdc03fb))
* **examples:** 修复带 wrap 容器的示例被压成内容宽 ([a6d5dae](https://github.com/mhaibaraai/movk-sigmajs/commit/a6d5daed6e4cf3d357422e24149f6a600cf1307e))
* **examples:** 修正 themed 页三个示例的节点尺寸 ([b896059](https://github.com/mhaibaraai/movk-sigmajs/commit/b896059ac4d901e7ccb41ad359dd2068681dda26))
* **examples:** 示例坐标跨度对齐 v4 的 size 语义 ([914e0cc](https://github.com/mhaibaraai/movk-sigmajs/commit/914e0cc794ddd197055e386c10c0c1018c3d9dd4))
* **examples:** 跑布局的示例切到 screen 尺寸语义 ([7871e0a](https://github.com/mhaibaraai/movk-sigmajs/commit/7871e0a196f5142711ef70ba441864043ba2354e))
* **graph:** 修正 2 倍屏下中文节点标签整体不渲染 ([fcb5b9b](https://github.com/mhaibaraai/movk-sigmajs/commit/fcb5b9bd3037515a99e8ffec55b58a52836550ae))
* **optimize-deps:** 探测忽略 NODE_PATH 暴露的包 ([d077f7a](https://github.com/mhaibaraai/movk-sigmajs/commit/d077f7a6c05949a922381464415aeb240435b117))
* **runtime:** styles 变更改比引用而非比值 ([8b3bf61](https://github.com/mhaibaraai/movk-sigmajs/commit/8b3bf615024d66634dfd9ee43684be8858e64131))

### Documentation

* **agents:** 同步数据集接入与新踩的坑 ([b7d0056](https://github.com/mhaibaraai/movk-sigmajs/commit/b7d0056a1206e1787ca5f48a066a478e7d00b549))
* **agents:** 红线与类型来源表同步到 v4 ([37084f0](https://github.com/mhaibaraai/movk-sigmajs/commit/37084f07eddf9c9e11e78cd6075532234592c983))
* **agents:** 补上 programs 目录的红线与文档站现状 ([d1264f0](https://github.com/mhaibaraai/movk-sigmajs/commit/d1264f07469028e36e86fd0a9093759a88813724))
* **composables:** 按现有实现重写 useSigmaDrag 页 ([ef621cd](https://github.com/mhaibaraai/movk-sigmajs/commit/ef621cdc7d4a44b98cf2d7f9dea3f5a93186be47))
* **guides:** 新增节点尺寸与坐标量级指南 ([b527e3f](https://github.com/mhaibaraai/movk-sigmajs/commit/b527e3f01d803f432c841c4d2dd3114ac0339708))
* llms 元信息中的 sigma 版本改为 v4 ([3e75d15](https://github.com/mhaibaraai/movk-sigmajs/commit/3e75d155c266ab7cee958ec2f3da6b9b3064ddbe))
* **references:** 移除 references 目录和相关内容 ([26680f6](https://github.com/mhaibaraai/movk-sigmajs/commit/26680f6f73ad6381746e834d049173d3b5965514))
* 修正 reducer 归属表述并升级依赖 ([54acd63](https://github.com/mhaibaraai/movk-sigmajs/commit/54acd632c97965821809afe929d8f7a5ad3afdef))
* 文档站适配 v4 ([a3eecd2](https://github.com/mhaibaraai/movk-sigmajs/commit/a3eecd23a314e3aa45ab79b0a5eeebbb54c64747))
* 新增渲染程序分组与五个 API 页 ([ab9971a](https://github.com/mhaibaraai/movk-sigmajs/commit/ab9971a8e15b973f95825787066f0450a583d013))
* 补充节点标签字形图集的说明与踩坑 ([e87d09f](https://github.com/mhaibaraai/movk-sigmajs/commit/e87d09feb5243a292e552f654dd88ff86c63442e))

### Code Refactoring

* **docs:** 示例与 playground 页面适配 v4 ([7fd8872](https://github.com/mhaibaraai/movk-sigmajs/commit/7fd8872795e16fe4db5e8202f88656594ab7ef4e))
* **runtime:** 精简 runtime 代码注释 ([706d743](https://github.com/mhaibaraai/movk-sigmajs/commit/706d7432fab6dcce87595b1b3822e4cc05800451))

### Tests

* 测试套件适配 v4 API ([8529e91](https://github.com/mhaibaraai/movk-sigmajs/commit/8529e9153cf651e01d37deff5fe212d8954d691d)), references [#app](https://github.com/mhaibaraai/movk-sigmajs/issues/app)
* 覆盖标签绘制层、图侧派生、缩放分级与形状着色器 ([8acb6b1](https://github.com/mhaibaraai/movk-sigmajs/commit/8acb6b1f429b467ce54102f63aaf9cd6e24106cc))

### Build System

* **deps:** 依赖基线切换到 sigma v4 ([114b5e1](https://github.com/mhaibaraai/movk-sigmajs/commit/114b5e1d86c3a9cc2373256fa40d9bc4e7fd19a0))

### Chores

* **deps:** playgrounds/ui 的 @movk/nuxt 升到 1.7.1 ([0f7c949](https://github.com/mhaibaraai/movk-sigmajs/commit/0f7c9493e8fbeaae652619902010ca81eee8e196))
* **docs:** 清理空的 ui 与 aiChat 配置项 ([862f159](https://github.com/mhaibaraai/movk-sigmajs/commit/862f159c9f915a09fe94ab36add4505b0b90bc1a))
* **playground-ui:** 升级 @movk/nuxt 并简化会话密钥配置 ([2006d55](https://github.com/mhaibaraai/movk-sigmajs/commit/2006d55b02154ac3348e64af919ffb4de1c37980))
* **playground-ui:** 启用图标客户端打包并新增通用组件目录 ([fb07ec7](https://github.com/mhaibaraai/movk-sigmajs/commit/fb07ec75ca078e02fd750cb086b60949b4b1802d))
* **playground-ui:** 精简冗余注释 ([9c6bf11](https://github.com/mhaibaraai/movk-sigmajs/commit/9c6bf11f57dfc0f0a6b8bb7e291156f4c5034c6e))
* 升级 pnpm 与根依赖版本 ([7f4270e](https://github.com/mhaibaraai/movk-sigmajs/commit/7f4270e56c2c44f9f148b8a7e92420335086cfb5))
* 更新 pnpm 锁文件 ([6133f5d](https://github.com/mhaibaraai/movk-sigmajs/commit/6133f5d62a60e05dfa934a36a038984168d32e5a))
* 清理冗余配置与脚本名 ([435f033](https://github.com/mhaibaraai/movk-sigmajs/commit/435f0332dfd904adcf732dc5d10a67fc66c60f96))
* 版本回退并补充文档与 playground 调整 ([abb1622](https://github.com/mhaibaraai/movk-sigmajs/commit/abb1622e1c54a13bf824af1670a96688880fc00a))

## [0.0.4](https://github.com/mhaibaraai/movk-sigmajs/compare/v0.0.3...v0.0.4) (2026-07-30)

### ⚠ BREAKING CHANGES

* **utils:** degreeToSize 的中间段取值变大，依赖线性插值具体数值的调用方需要重新核对尺寸区间。

### Features

* **utils:** degreeToSize 改用 sqrt 曲线映射度数 ([46600ae](https://github.com/mhaibaraai/movk-sigmajs/commit/46600aec42fa6748b7db5b34c142dbfbc92f9a57))

### Documentation

* **utils:** 同步 degreeToSize 的 sqrt 口径 ([87ef7c0](https://github.com/mhaibaraai/movk-sigmajs/commit/87ef7c0eacae16398e1a252dae65955e811c98da))
* 可选 peer 的分析类去掉 graphology-traversal ([0a85535](https://github.com/mhaibaraai/movk-sigmajs/commit/0a855357fe3a2d088c0f6c5a6bbe3b8a55be1ba0))
* 新增指南栏目并接上入口 ([ab5aa3f](https://github.com/mhaibaraai/movk-sigmajs/commit/ab5aa3f9f15cd3307df1b54dd81038c0e7e4cd4e))
* 补齐组件、composables 与工具函数的 API 文档 ([c1eb8a5](https://github.com/mhaibaraai/movk-sigmajs/commit/c1eb8a547186abca24d9d36e8ffa041e4c5cd0bf))

### Chores

* **deps:** 升级 pnpm 与依赖版本 ([1b18044](https://github.com/mhaibaraai/movk-sigmajs/commit/1b18044c53b07f969233b798182fa1da68e29e23))

## [0.0.3](https://github.com/mhaibaraai/movk-sigmajs/compare/v0.0.2...v0.0.3) (2026-07-30)

### Features

* **module:** 内置 Vite 预构建声明 ([a26c4af](https://github.com/mhaibaraai/movk-sigmajs/commit/a26c4af08f78513ec3d7e219000f3a6160e17d51))
* **search:** 检索控件新增 [#input](https://github.com/mhaibaraai/movk-sigmajs/issues/input) 插槽 ([c6ef765](https://github.com/mhaibaraai/movk-sigmajs/commit/c6ef7650c8b74cd6d70986127005bc3b5b3ccd97))
* **search:** 检索控件新增 [#results](https://github.com/mhaibaraai/movk-sigmajs/issues/results) 插槽 ([082e293](https://github.com/mhaibaraai/movk-sigmajs/commit/082e293cb22a6c8fee3bc14986fffd8ce3677b43)), references [#option](https://github.com/mhaibaraai/movk-sigmajs/issues/option) [#option](https://github.com/mhaibaraai/movk-sigmajs/issues/option) [#empty](https://github.com/mhaibaraai/movk-sigmajs/issues/empty)

### Documentation

* **agents:** 补充预构建声明的踩坑记录 ([4aea304](https://github.com/mhaibaraai/movk-sigmajs/commit/4aea304f0ba7387b6d32e314a60d137d4faec13e))
* **playground:** 检索控件演示 UInput 完全接管 ([8aa279e](https://github.com/mhaibaraai/movk-sigmajs/commit/8aa279ec083c490b8c2475fad17faa4f3b76031d))
* **search:** 补充检索控件插槽接管实施计划 ([add64c6](https://github.com/mhaibaraai/movk-sigmajs/commit/add64c6b366ee98381855e11083d935806706ca9)), references [#input](https://github.com/mhaibaraai/movk-sigmajs/issues/input) [#results](https://github.com/mhaibaraai/movk-sigmajs/issues/results)
* **search:** 补充检索控件插槽接管设计文档 ([42ed78b](https://github.com/mhaibaraai/movk-sigmajs/commit/42ed78b6a615c13e5f197dcdbbbadc8d7f36d77f)), references [#input](https://github.com/mhaibaraai/movk-sigmajs/issues/input) [#results](https://github.com/mhaibaraai/movk-sigmajs/issues/results) [#option](https://github.com/mhaibaraai/movk-sigmajs/issues/option) [#empty](https://github.com/mhaibaraai/movk-sigmajs/issues/empty)

### Tests

* **module:** 覆盖预构建候选的探测与跳过 ([31edf58](https://github.com/mhaibaraai/movk-sigmajs/commit/31edf583d0c48dd7fda013673df28d2aabc2b6a1))

### CI

* 升级 setup-node 并接入 pkg-pr-new 预览发布 ([5b165ee](https://github.com/mhaibaraai/movk-sigmajs/commit/5b165eee16768d354dbae1dadb10a854aa905f9f))

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
