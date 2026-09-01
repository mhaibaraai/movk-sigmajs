<script setup lang="ts">
defineProps<{ total: number, totalEdges: number }>()

const size = defineModel<number>({ required: true })
const { order, size: edgeCount } = useSigmaGraph()
</script>

<template>
  <SigmaControls>
    <div class="flex gap-1">
      <UButton
        v-for="value in [60, 150, 400]"
        :key="value"
        size="xs"
        :label="String(value)"
        :color="size === value ? 'primary' : 'neutral'"
        @click="size = value"
      />
      <UButton
        size="xs"
        label="全图"
        :color="size >= total ? 'primary' : 'neutral'"
        variant="ghost"
        @click="size = total"
      />
    </div>

    <div class="bg-accented p-2 text-muted text-xs">
      <p>原图 {{ total }} 节点 / {{ totalEdges }} 边 → 概览 {{ order }} / {{ edgeCount }}</p>
      <p>只有两端都入选的边才保留，边数下降比节点数更陡</p>
    </div>
  </SigmaControls>
</template>
