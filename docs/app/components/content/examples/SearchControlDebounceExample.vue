<script setup lang="ts">
defineProps<{ debounce: number }>()

const { data } = await useFetch('/api/data.json')
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaControls position="top-right">
      <SigmaSearchControl
        :key="debounce"
        :debounce="Number(debounce)"
        placeholder="试试单个字母 a"
      />
    </SigmaControls>
  </SigmaGraph>
</template>
