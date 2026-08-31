<script setup lang="ts">
const props = withDefaults(defineProps<{ offsetY?: number | string }>(), { offsetY: -12 })

const offset = computed<[number, number]>(() => [0, Number(props.offsetY)])

const { data } = await useFetch('/api/small.json')
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaTooltip :offset="offset" />
  </SigmaGraph>
</template>
