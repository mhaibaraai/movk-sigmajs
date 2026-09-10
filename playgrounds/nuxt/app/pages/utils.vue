<script setup lang="ts">
useHead({ title: '工具函数 · @movk/sigma' })
</script>

<template>
  <div class="flex flex-col gap-8">
    <header>
      <h1 class="text-xl font-semibold">
        工具函数
      </h1>
      <p class="text-muted mt-1 text-sm">
        目录级自动导入，无需手动 import。
      </p>
    </header>

    <ExampleCard
      title="applyGraphDiff()"
      name="ApplyGraphDiffExample"
      description="增量合入不带坐标的数据，已有节点的位置不被覆盖；prune 决定是否删除缺席节点。"
    >
      <ApplyGraphDiffExample />
    </ExampleCard>

    <ExampleCard
      title="composeStyles()"
      name="ComposeStylesExample"
      description="按序拼接多份 styles 声明，后者覆盖前者。"
    >
      <ComposeStylesExample />
    </ExampleCard>

    <ExampleCard
      title="labelPlacements()"
      name="LabelPlacementsExample"
      description="按邻居分布推导标签朝向，让标签背离最密的一侧。"
    >
      <LabelPlacementsExample />
    </ExampleCard>

    <ExampleCard
      title="degreeToTier()"
      name="DegreeToTierExample"
      description="按度数排名分档，ratios 控制每档占比。"
    >
      <DegreeToTierExample />
    </ExampleCard>

    <ExampleCard
      title="sdfPolygon() / sdfStar()"
      name="SdfShapesExample"
      description="自定义节点形状，按数据属性绑定 shape。"
    >
      <SdfShapesExample />
    </ExampleCard>

    <ExampleCard
      title="defineSigmaPrimitives()"
      name="DefineSigmaPrimitivesExample"
      description="注册形状、线型与端点，用带平行边和自环的小图验证。"
    >
      <DefineSigmaPrimitivesExample />
    </ExampleCard>
  </div>
</template>
