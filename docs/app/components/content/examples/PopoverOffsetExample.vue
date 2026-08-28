<script setup lang="ts">
const props = withDefaults(defineProps<{ offsetY?: number | string }>(), { offsetY: -16 })

const offset = computed<[number, number]>(() => [0, Number(props.offsetY)])

const { data } = await useFetch('/api/data.json')
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaPopover node="11.0" :offset="offset">
      <template #default="{ attributes }">
        <strong>{{ attributes.label }}</strong>
      </template>
    </SigmaPopover>

    <SigmaControls>
      <div class="bg-accented p-2 text-muted text-xs">
        offset y = {{ offset[1] }} · 锚在 size 45 的 Valjean 上，默认 -16 还压着圆，-40 才让开
      </div>
    </SigmaControls>
  </SigmaGraph>
</template>
