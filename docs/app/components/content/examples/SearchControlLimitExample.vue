<script setup lang="ts">
defineProps<{ limit: number }>()

const { data } = await useFetch('/api/data.json')
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaControls position="top-right">
      <SigmaSearchControl
        :key="limit"
        :limit="Number(limit)"
        placeholder="试试单个字母 a"
      />
    </SigmaControls>
  </SigmaGraph>
</template>
