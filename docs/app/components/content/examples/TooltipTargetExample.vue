<script setup lang="ts">
defineProps<{ target?: 'node' | 'edge' | 'both' }>()

const { data } = await useFetch('/api/data.json')
</script>

<template>
  <SigmaGraph :data="data" :settings="{ enableEdgeEvents: true }">
    <SigmaTooltip :target="target" />

    <SigmaControls>
      <div class="bg-accented p-2 text-muted text-xs">
        这份数据的边没有 label，提示层回落到边的 key，并停在边的源节点上
      </div>
    </SigmaControls>
  </SigmaGraph>
</template>
