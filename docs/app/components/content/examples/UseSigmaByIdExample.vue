<script setup lang="ts">
const { data } = await useFetch('/api/data.json')

const context = useSigmaById('by-id-demo')
const ids = useSigmaIds()

const order = computed(() => context.value?.graph.value.order ?? 0)

function zoomFromOutside() {
  context.value?.sigma.value?.getCamera().zoomIn({ duration: 300 })
}

function paintFromOutside() {
  context.value?.graph.value.setNodeAttribute('11.0', 'color', '#a855f7')
}
</script>

<template>
  <div class="flex-1 h-120 flex flex-col gap-2">
    <div class="flex items-center gap-2 pb-2 border-b border-default">
      <UButton size="xs" color="neutral" label="树外放大" :disabled="!context" @click="zoomFromOutside" />
      <UButton size="xs" color="neutral" label="树外给 Valjean 改色" :disabled="!context" @click="paintFromOutside" />
      <span class="text-muted text-xs">注册表：{{ ids.join('、') || '空' }} · 节点 {{ order }}</span>
    </div>

    <SigmaGraph id="by-id-demo" :data="data" class="flex-1 min-h-0" />
  </div>
</template>
