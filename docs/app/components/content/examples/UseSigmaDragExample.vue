<script setup lang="ts">
const data = demoGraph({ nodes: 12, extraEdges: 1 })
</script>

<template>
  <!-- 面板里能跑 ForceAtlas2，布局会把坐标跨度收到几十个单位。
       v4 默认 size 是图坐标单位，不切到 screen 语义节点会成倍胀大 -->
  <SigmaGraph :styles="demoStyles" :data="data" :settings="{ itemSizesReference: 'screen' }">
    <UseSigmaDragPanel />
  </SigmaGraph>
</template>
