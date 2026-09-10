<script setup lang="ts">
const { data } = await useFetch('/api/data.json')

// 树外拿实例：SigmaGraph 挂载后按 id 注册，useSigmaIds 列出当前所有实例
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
  <div class="grid h-full grid-rows-[auto_minmax(0,1fr)] gap-2 p-2">
    <div class="border-default flex items-center gap-2 border-b pb-2">
      <UButton size="xs" color="neutral" label="树外放大" :disabled="!context" @click="zoomFromOutside" />
      <UButton size="xs" color="neutral" label="树外给 Valjean 改色" :disabled="!context" @click="paintFromOutside" />
      <span class="text-muted text-xs">注册表：{{ ids.join('、') || '空' }} · 节点 {{ order }}</span>
    </div>

    <SigmaGraph id="by-id-demo" :data="data" />
  </div>
</template>
