<script setup lang="ts">
import type { StylesDeclaration } from 'sigma/types'

const limit = ref(300)

const styles: StylesDeclaration = {
  edges: { color: '#e2e8f0' }
}

const { data, status } = await useFetch('/api/graph/overview', {
  query: { limit },
  watch: [limit]
})
</script>

<template>
  <div class="relative h-[calc(100vh-3.5rem)]">
    <div v-if="status === 'pending' && !data" class="flex h-full items-center justify-center">
      <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin text-muted" />
    </div>

    <SigmaGraph
      v-else-if="data"
      id="knowledge-graph"
      :data="data"
      :styles="styles"
      :settings="{
        hideEdgesOnMove: true,
        labelRenderedSizeThreshold: 9,
        labelDensity: 0.3,
      }"
    >
      <SigmaControls position="top-right">
        <SigmaZoomControl />
        <SigmaFullscreenControl />
        <SigmaLegend field="category" />
      </SigmaControls>

      <SigmaControls position="bottom-left">
        <SigmaMiniMap />
      </SigmaControls>

      <SigmaTooltip>
        <template #default="{ id, attributes }">
          <span class="font-medium">{{ attributes.label ?? id }}</span>
        </template>
      </SigmaTooltip>

      <GraphExplorer />
    </SigmaGraph>

    <div class="absolute bottom-4 right-4 z-10">
      <UCard :ui="{ body: 'p-2 sm:p-2' }">
        <div class="flex items-center gap-2 text-xs">
          <span class="text-muted">概览规模</span>
          <UButton
            v-for="value in [150, 300, 600, 5000]"
            :key="value"
            :variant="limit === value ? 'soft' : 'ghost'"
            color="neutral"
            size="xs"
            @click="limit = value"
          >
            {{ value }}
          </UButton>
        </div>
      </UCard>
    </div>
  </div>
</template>
