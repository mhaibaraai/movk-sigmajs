<script setup lang="ts">
const props = withDefaults(defineProps<{ offsetY?: number | string }>(), { offsetY: -16 })

const offset = computed<[number, number]>(() => [0, Number(props.offsetY)])

const { data } = await useFetch('/api/small.json')
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaPopover node="b" :offset="offset">
      <template #default="{ attributes }">
        <strong>{{ attributes.label }}</strong>
      </template>
    </SigmaPopover>
  </SigmaGraph>
</template>
