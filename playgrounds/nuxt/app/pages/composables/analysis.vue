<script setup lang="ts">
useHead({ title: '布局与分析 · @movk/sigma' })
</script>

<template>
  <div class="flex flex-col gap-8">
    <header>
      <h1 class="text-xl font-semibold">
        布局与分析
      </h1>
      <p class="text-muted mt-1 text-sm">
        这三个都依赖可选 peer，示例同时验证缺失分支的报错路径。
      </p>
    </header>

    <ExampleCard
      title="useSigmaLayout()"
      name="UseSigmaLayoutExample"
      description="五种布局的 assign() 与迭代型布局的 start() / stop()。"
    >
      <UseSigmaLayoutExample />
    </ExampleCard>

    <ExampleCard
      title="useSigmaMetrics()"
      name="UseSigmaMetricsExample"
      description="度数、三种中心性与 Louvain 社区划分，结果映射到尺寸与配色。"
    >
      <UseSigmaMetricsExample />
    </ExampleCard>

    <ExampleCard
      title="useSigmaExport()"
      name="UseSigmaExportExample"
      description="导出 PNG，toBlob 拿数据、download 直接落盘。"
    >
      <UseSigmaExportExample />
    </ExampleCard>
  </div>
</template>
