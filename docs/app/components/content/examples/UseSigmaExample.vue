<script setup lang="ts">
// useSigma() 是 inject，必须在 SigmaGraph 子树内调用，
// 因此实际用法总是「根组件渲染图，子组件消费上下文」这两层
const data = demoGraph()
</script>

<template>
  <SigmaGraph :styles="demoStyles" :data="data">
    <UseSigmaPanel />
  </SigmaGraph>
</template>
