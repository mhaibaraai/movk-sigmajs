<script setup lang="ts">
const node = shallowRef<string | null>('11.0')
const open = ref(true)

// 换节点时重新打开，因为上一次可能被用户关掉了
watch(node, (key) => {
  if (key) {
    open.value = true
  }
})

const { data } = await useFetch('/api/data.json')
</script>

<template>
  <SigmaGraph
    :data="data"
    @click-node="({ node: key }) => (node = key)"
    @click-stage="() => (node = null)"
  >
    <SigmaPopover v-model:open="open" :node="node">
      <template #default="{ attributes, close }">
        <strong>{{ attributes.label }}</strong>
        <UButton size="xs" variant="ghost" color="neutral" label="关闭" @click="close" />
      </template>
    </SigmaPopover>

    <SigmaControls>
      <UButton :label="open ? '关闭浮层' : '打开浮层'" @click="open = !open" />
      <div class="bg-accented p-2 text-muted text-xs">
        open = {{ open }} · node = {{ node ?? 'null' }} · 可见 = {{ open && Boolean(node) }}
      </div>
    </SigmaControls>
  </SigmaGraph>
</template>
