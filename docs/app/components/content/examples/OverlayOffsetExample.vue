<script setup lang="ts">
const props = withDefaults(defineProps<{
  offsetX?: number | string
  offsetY?: number | string
}>(), {
  offsetX: 0,
  offsetY: -24
})

const offset = computed<[number, number]>(() => [Number(props.offsetX), Number(props.offsetY)])

const { data } = await useFetch('/api/small.json')
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaOverlay node="c" :offset="offset">
      <UBadge color="warning" size="sm">
        左上角落在锚点上
      </UBadge>
    </SigmaOverlay>

    <SigmaOverlay node="c" :offset="offset">
      <UBadge color="info" size="sm" class="-translate-x-1/2 -translate-y-full">
        translate: -50% -100%
      </UBadge>
    </SigmaOverlay>
  </SigmaGraph>
</template>
