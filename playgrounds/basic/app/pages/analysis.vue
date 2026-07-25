<template>
  <div>
    <h1>布局与分析</h1>
    <p class="lead">
      布局是「跑一次运算或起一个 worker」，是行为不是声明，因此走 composable 而非组件。
      布局与分析的底层包全是可选 peer，用到时才动态导入，未安装时给出「装哪个包」的可操作提示。
    </p>

    <ExampleCard
      title="useSigmaLayout 的五种布局"
      name="UseSigmaLayoutExample"
      description="circular / circlepack / random / noverlap / forceatlas2，一次性布局只需 assign()。"
    >
      <UseSigmaLayoutExample />
    </ExampleCard>

    <ExampleCard
      title="worker 生命周期"
      name="UseSigmaLayoutWorkerExample"
      description="迭代型布局在 worker 里跑，卸载时自动 kill。滚出视口让示例卸载即可验证。"
    >
      <UseSigmaLayoutWorkerExample />
    </ExampleCard>

    <ExampleCard
      title="useSigmaMetrics"
      name="UseSigmaMetricsExample"
      description="度数、三种中心性与 Louvain 社区划分，按图版本缓存。顺带演示 degreeToSize 与 communityToColor 两个视觉映射工具。"
    >
      <UseSigmaMetricsExample />
    </ExampleCard>

    <ExampleCard
      title="useSigmaExport"
      name="UseSigmaExportExample"
      description="toBlob 与 download。依赖可选 peer @sigma/export-image。"
    >
      <UseSigmaExportExample />
    </ExampleCard>
  </div>
</template>
