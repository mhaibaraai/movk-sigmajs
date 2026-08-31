<script setup lang="ts">
const node = shallowRef<string | null>('b')

const { data } = await useFetch('/api/small.json')
</script>

<template>
  <SigmaGraph
    :data="data"
    @click-node="({ node: key }) => (node = key)"
    @click-stage="() => (node = null)"
  >
    <SigmaPopover :node="node">
      <template #default="{ attributes }">
        <strong>{{ attributes.label }}</strong>
      </template>
    </SigmaPopover>
  </SigmaGraph>
</template>
