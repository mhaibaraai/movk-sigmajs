<template>
  <div>
    <h1>规模</h1>
    <p class="lead">
      面向 1000+ 节点的场景。本页的示例都不自动加载——最大一档要建 20k 节点、60k 边，
      开发时反复触发会很难受。读数只求可比不求精确，sigma 只在有变化时才渲染，
      FPS 要在持续平移的过程中才有意义。
    </p>

    <ExampleCard
      title="三档规模"
      name="ScaleTiersExample"
      description="1k / 5k / 20k，确定性生成，度数按幂律分布。看建图耗时、首帧耗时与平移 FPS 的变化。"
      height="480px"
    >
      <ScaleTiersExample />
    </ExampleCard>

    <ExampleCard
      title="渲染侧开关的代价"
      name="ScaleSettingsExample"
      description="同一份 5k 数据下逐项开关 hideEdgesOnMove、labelRenderedSizeThreshold、labelDensity。"
      height="480px"
    >
      <ScaleSettingsExample />
    </ExampleCard>

    <ExampleCard
      title="概览 + 按需扩展"
      name="ScaleOverviewExample"
      description="20k 的完整图只在内存里，屏上放 sampleGraph 抽出的枢纽，点击节点再增量补齐。"
      height="480px"
    >
      <ScaleOverviewExample />
    </ExampleCard>

    <ExampleCard
      title="布局路径对照"
      name="ScaleLayoutExample"
      description="服务端预布局、主线程 ForceAtlas2、worker ForceAtlas2 三条路径的实际差别。"
      height="480px"
    >
      <ScaleLayoutExample />
    </ExampleCard>
  </div>
</template>
