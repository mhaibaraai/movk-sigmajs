<script setup lang="ts">
useHead({ title: '核心组件 · @movk/sigma' })
</script>

<template>
  <div class="flex flex-col gap-8">
    <header>
      <h1 class="text-xl font-semibold">
        核心组件
      </h1>
      <p class="text-muted mt-1 text-sm">
        根组件与四个 DOM 覆盖层。
      </p>
    </header>

    <ExampleCard
      title="SigmaGraph"
      name="GraphExample"
      description="data / styles / settings 与事件。唯一使用内联测试数据的示例，其余都走 docs 的真实接口。"
    >
      <GraphExample />
    </ExampleCard>

    <ExampleCard
      title="SigmaOverlay"
      name="OverlayExample"
      description="按图坐标锚定任意 DOM，内容不受限制，visible 控制显隐。"
    >
      <OverlayExample />
    </ExampleCard>

    <ExampleCard
      title="SigmaTooltip"
      name="TooltipExample"
      description="悬浮提示，target 决定跟节点还是跟边，默认插槽接管内容。"
    >
      <TooltipExample />
    </ExampleCard>

    <ExampleCard
      title="SigmaPopover"
      name="PopoverExample"
      description="点击后常驻的气泡，配合 useSigmaSelection 做详情面板与异步加载。"
    >
      <PopoverExample />
    </ExampleCard>

    <ExampleCard
      title="SigmaContextMenu"
      name="ContextMenuExample"
      description="右键菜单，target 同时覆盖节点、边与空白处。"
    >
      <ContextMenuExample />
    </ExampleCard>
  </div>
</template>
