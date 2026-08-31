<script setup lang="ts">
// toggleable 为 false 时 toggle() 是空操作，默认外观的按钮一并置为 disabled
withDefaults(defineProps<{ toggleable?: boolean }>(), { toggleable: true })

const { data } = await useFetch('/api/data.json')
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaControls position="top-right">
      <SigmaLegend field="category" color-field="categoryColor" :toggleable="toggleable" />
    </SigmaControls>
  </SigmaGraph>
</template>
