<script setup lang="ts">
withDefaults(defineProps<{ target?: Array<'node' | 'edge' | 'stage'> }>(), {
  target: () => ['node']
})

const { data } = await useFetch('/api/small.json')
</script>

<template>
  <SigmaGraph :data="data" :settings="{ enableEdgeEvents: true }">
    <SigmaContextMenu :target="target">
      <template #default="{ type, id }">
        <span class="text-xs">{{ type }} {{ id ?? '（空白处）' }}</span>
      </template>
    </SigmaContextMenu>
  </SigmaGraph>
</template>
