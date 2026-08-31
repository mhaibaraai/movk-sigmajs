<script setup lang="ts">
// 组件实例上也暴露了 reset()，与插槽作用域里的同名方法一致
const legend = useTemplateRef('legend')

const { data } = await useFetch('/api/data.json')
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaControls position="top-right">
      <SigmaLegend ref="legend" field="category" color-field="categoryColor" />
    </SigmaControls>

    <SigmaControls position="bottom-left">
      <UButton size="xs" color="neutral" label="reset()" @click="legend?.reset()" />
    </SigmaControls>
  </SigmaGraph>
</template>
