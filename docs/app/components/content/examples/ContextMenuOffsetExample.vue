<script setup lang="ts">
const props = withDefaults(defineProps<{
  offsetX?: number | string
  offsetY?: number | string
}>(), {
  offsetX: 4,
  offsetY: 4
})

const offset = computed<[number, number]>(() => [Number(props.offsetX), Number(props.offsetY)])

const { data } = await useFetch('/api/small.json')
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaContextMenu :offset="offset">
      <template #default="{ attributes }">
        <span class="text-xs">{{ attributes.label }} 的菜单</span>
      </template>
    </SigmaContextMenu>
  </SigmaGraph>
</template>
