<script setup lang="ts">
const node = shallowRef<string | null>('c')
const open = ref(true)

watch(node, (key) => {
  if (key) {
    open.value = true
  }
})

const { data } = await useFetch('/api/small.json')
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
        <UButton size="xs" label="关闭" class="ml-2" @click="close" />
      </template>
    </SigmaPopover>

    <SigmaControls>
      <UButton :label="open ? '关闭浮层' : '打开浮层'" @click="open = !open" />
    </SigmaControls>
  </SigmaGraph>
</template>
