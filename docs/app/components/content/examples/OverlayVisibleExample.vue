<script setup lang="ts">
defineProps<{
  visible?: boolean
}>()

const Badge = defineComponent({
  props: { label: { type: String, required: true } },
  setup(props) {
    const since = new Date().toLocaleTimeString()
    return () => h(
      'div',
      { class: '-translate-x-1/2 -translate-y-full rounded-md bg-inverted px-2 py-1 text-xs text-inverted whitespace-nowrap' },
      `${props.label} · 挂载于 ${since}`
    )
  }
})

const { data } = await useFetch('/api/small.json')
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaOverlay node="b" :offset="[0, -24]" :visible="visible">
      <Badge label="没有 v-if" />
    </SigmaOverlay>

    <SigmaOverlay node="c" :offset="[0, -24]" :visible="visible">
      <Badge v-if="visible" label="加了 v-if" />
    </SigmaOverlay>
  </SigmaGraph>
</template>
