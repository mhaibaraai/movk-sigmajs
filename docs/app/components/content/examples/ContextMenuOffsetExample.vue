<script setup lang="ts">
const props = withDefaults(defineProps<{
  offsetX?: number | string
  offsetY?: number | string
}>(), {
  offsetX: 4,
  offsetY: 4
})

const offset = computed<[number, number]>(() => [Number(props.offsetX), Number(props.offsetY)])

const { data } = await useFetch('/api/data.json')
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaContextMenu :offset="offset">
      <template #default="{ attributes }">
        <span class="text-xs">{{ attributes.label }} 的菜单</span>
      </template>
    </SigmaContextMenu>

    <SigmaControls>
      <div class="bg-accented p-2 text-muted text-xs">
        offset [{{ offset[0] }}, {{ offset[1] }}] · 在节点上右键，菜单从锚点右下方展开
      </div>
    </SigmaControls>
  </SigmaGraph>
</template>
