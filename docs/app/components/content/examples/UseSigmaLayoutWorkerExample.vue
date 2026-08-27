<script setup lang="ts">
const data = demoGraph({ nodes: 60, extraEdges: 1 })
</script>

<template>
  <!-- worker 每一帧都在回写坐标，跨度持续变化。
       v4 默认 size 是图坐标单位，不切到 screen 语义节点会随收敛过程一路胀大 -->
  <SigmaGraph :styles="demoStyles" :data="data" :settings="{ hideEdgesOnMove: true, itemSizesReference: 'screen' }">
    <UseSigmaLayoutWorkerPanel />
  </SigmaGraph>
</template>
