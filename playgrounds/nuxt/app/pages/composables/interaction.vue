<script setup lang="ts">
useHead({ title: '交互 Composables · @movk/sigma' })
</script>

<template>
  <div class="flex flex-col gap-8">
    <header>
      <h1 class="text-xl font-semibold">
        交互 Composables
      </h1>
      <p class="text-muted mt-1 text-sm">
        相机、选择、邻域、拖拽、检索、过滤与标签分级。
      </p>
    </header>

    <ExampleCard
      title="useSigmaCamera()"
      name="UseSigmaCameraExample"
      description="缩放、聚焦节点、容纳全图与图坐标到屏幕坐标的换算。"
    >
      <UseSigmaCameraExample />
    </ExampleCard>

    <ExampleCard
      title="useSigmaSelection()"
      name="UseSigmaSelectionExample"
      description="悬浮、选中与焦点三态，dim 打开后非高亮节点淡出。"
    >
      <UseSigmaSelectionExample />
    </ExampleCard>

    <ExampleCard
      title="useSigmaNeighborhood()"
      name="UseSigmaNeighborhoodExample"
      description="以选中节点为中心逐层扩散，结果写进自定义状态由 styles 着色。"
    >
      <UseSigmaNeighborhoodExample />
    </ExampleCard>

    <ExampleCard
      title="useSigmaDrag()"
      name="UseSigmaDragExample"
      description="拖拽移动节点，enabled 可随时开关，dragged 暴露过程。"
    >
      <UseSigmaDragExample />
    </ExampleCard>

    <ExampleCard
      title="useSigmaSearch()"
      name="UseSigmaSearchExample"
      description="不带 UI 的检索原语，自己渲染结果并调 focus 聚焦。"
    >
      <UseSigmaSearchExample />
    </ExampleCard>

    <ExampleCard
      title="useSigmaFilter()"
      name="UseSigmaFilterExample"
      description="节点与边过滤器，only() 直接锁定一批节点，hiddenCount 读数。"
    >
      <UseSigmaFilterExample />
    </ExampleCard>

    <ExampleCard
      title="useSigmaLabelTiers()"
      name="UseSigmaLabelTiersExample"
      description="按相机比例分级显示标签，档位由 degreeToTier() 写进节点属性。"
    >
      <UseSigmaLabelTiersExample />
    </ExampleCard>
  </div>
</template>
