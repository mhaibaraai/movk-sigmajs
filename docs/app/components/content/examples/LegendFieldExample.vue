<script setup lang="ts">
// field 取业务字段而非 sigma 的 type；colorField 决定组色取哪个属性：
// 数据集的 color 是一条度数渐变，同档内取值不一，categoryColor 才是每档一色
withDefaults(defineProps<{ field?: string, colorField?: string, fallback?: string }>(), {
  field: 'category',
  colorField: 'categoryColor',
  fallback: '未分类'
})

const { data } = await useFetch('/api/data.json')
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaControls position="top-right">
      <SigmaLegend :field="field" :color-field="colorField" :fallback="fallback" />
    </SigmaControls>
  </SigmaGraph>
</template>
