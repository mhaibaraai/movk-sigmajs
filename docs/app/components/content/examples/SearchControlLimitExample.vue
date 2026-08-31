<script setup lang="ts">
// limit 截断结果条数，debounce 决定输入到发起检索的间隔
withDefaults(defineProps<{ limit?: number, debounce?: number }>(), {
  limit: 10,
  debounce: 200
})

const { data } = await useFetch('/api/data.json')
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaControls position="top-right">
      <SigmaSearchControl
        :key="`${limit}-${debounce}`"
        :limit="Number(limit)"
        :debounce="Number(debounce)"
        placeholder="试试单个字母 a"
      />
    </SigmaControls>
  </SigmaGraph>
</template>
