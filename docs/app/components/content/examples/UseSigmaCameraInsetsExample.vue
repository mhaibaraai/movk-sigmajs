<script setup lang="ts">
const data = demoGraph({ nodes: 40, extraEdges: 1 })
</script>

<template>
  <SigmaGraph :styles="demoStyles" :data="data" :settings="{ itemSizesReference: 'screen' }">
    <!-- 模拟真实应用的侧栏：浮在舞台上、不挤压画布，正是 fit 看不见的那部分遮挡 -->
    <div class="absolute inset-y-0 left-0 z-10 flex w-60 items-center justify-center border-r border-default bg-default/90 text-muted text-xs">
      侧栏 240px
    </div>

    <UseSigmaCameraInsetsPanel />
  </SigmaGraph>
</template>
