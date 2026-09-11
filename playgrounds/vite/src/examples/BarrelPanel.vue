<script setup lang="ts">
import { useSigmaGraph } from '@movk/sigma/vue'
import { computed } from 'vue'

const { graph } = useSigmaGraph()

const summary = computed(() => `${graph.value.order} 节点 · ${graph.value.size} 边`)
</script>

<template>
  <div class="panel">
    <span>{{ summary }}</span>
  </div>
</template>
