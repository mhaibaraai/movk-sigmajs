<script setup lang="ts">
const props = withDefaults(defineProps<{ offsetY?: number | string }>(), { offsetY: -12 })

const offset = computed<[number, number]>(() => [0, Number(props.offsetY)])

const { data } = await useFetch('/api/data.json')
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaTooltip :offset="offset" />

    <SigmaControls>
      <div class="bg-accented p-2 text-muted text-xs">
        offset y = {{ offset[1] }} · 默认 -12 适配多数节点，悬浮到 size 45 的 Valjean 上就压着圆了，-40 才让开
      </div>
    </SigmaControls>
  </SigmaGraph>
</template>
