<script setup lang="ts">
useHead({ title: '控件 · @movk/sigma' })
</script>

<template>
  <div class="flex flex-col gap-8">
    <header>
      <h1 class="text-xl font-semibold">
        控件
      </h1>
      <p class="text-muted mt-1 text-sm">
        SigmaControls 容器与五个内置控件。
      </p>
    </header>

    <ExampleCard
      title="SigmaControls"
      name="ControlsExample"
      description="九宫格定位与排列方向；顺带验证 --sigma-color-* 接到 Nuxt UI 色板后随主题切换。"
    >
      <ControlsExample />
    </ExampleCard>

    <ExampleCard
      title="SigmaZoomControl"
      name="ZoomControlExample"
      description="缩放倍率、动画时长、文案与三个图标插槽。"
    >
      <ZoomControlExample />
    </ExampleCard>

    <ExampleCard
      title="SigmaFullscreenControl"
      name="FullscreenControlExample"
      description="全屏切换，进入与退出文案分别可配。"
    >
      <FullscreenControlExample />
    </ExampleCard>

    <ExampleCard
      title="SigmaSearchControl"
      name="SearchControlExample"
      description="按字段检索并聚焦，results 插槽自定义结果列表与命中高亮。"
    >
      <SearchControlExample />
    </ExampleCard>

    <ExampleCard
      title="SigmaLegend"
      name="LegendExample"
      description="按属性分组统计并可点选隐藏；默认插槽接管整个图例外观。"
    >
      <LegendExample />
    </ExampleCard>

    <ExampleCard
      title="SigmaMiniMap"
      name="MiniMapExample"
      description="缩略图与视口框，尺寸与配色走 --sigma-minimap-* 变量。用大图验证。"
    >
      <MiniMapExample />
    </ExampleCard>
  </div>
</template>
