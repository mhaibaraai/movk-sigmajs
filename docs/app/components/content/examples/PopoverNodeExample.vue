<script setup lang="ts">
const node = shallowRef<string | null>('11.0')

const { data } = await useFetch('/api/data.json')
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

    <SigmaControls>
      <div class="bg-accented p-2 text-muted text-xs">
        node = {{ node ?? 'null' }} · 点节点换锚点，点画布空白处置空
      </div>
    </SigmaControls>
  </SigmaGraph>
</template>
