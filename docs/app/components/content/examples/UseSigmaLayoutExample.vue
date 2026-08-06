<script setup lang="ts">
const data = demoGraph({ nodes: 40, extraEdges: 1 })
</script>

<template>
  <!-- 五种布局的输出量级差着两个数量级：circular / random 默认 scale 为 1，跨度只有 1~2 个单位，
       forceatlas2 收敛到几十个单位。v4 默认 size 是图坐标单位，不切到 screen 语义节点会铺满画布 -->
  <SigmaGraph :data="data" :settings="{ itemSizesReference: 'screen' }">
    <UseSigmaLayoutPanel />
  </SigmaGraph>
</template>
