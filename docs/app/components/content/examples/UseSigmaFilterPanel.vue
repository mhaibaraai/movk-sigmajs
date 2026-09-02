<script setup lang="ts">
const { nodeFilter, edgeFilter, only, reset, hiddenCount } = useSigmaFilter()
const { degrees, maxDegree } = useSigmaMetrics()

const mode = shallowRef<'none' | 'category' | 'degree' | 'hubs' | 'edge'>('none')

function byCategory() {
  mode.value = 'category'
  edgeFilter.value = null
  nodeFilter.value = (_key, attributes) => attributes.category === '核心'
}

function byDegree() {
  mode.value = 'degree'
  edgeFilter.value = null
  nodeFilter.value = key => (degrees.value[key] ?? 0) >= 5
}

function byEdgeWeight() {
  mode.value = 'edge'
  nodeFilter.value = null
  edgeFilter.value = (_key, attributes) => (attributes.size as number) >= 5
}

function hubsOnly() {
  mode.value = 'hubs'
  only(Object.keys(degrees.value).filter(key => degrees.value[key]! >= maxDegree.value))
}

function clearAll() {
  mode.value = 'none'
  reset()
}
</script>

<template>
  <SigmaControls>
    <div class="flex gap-1">
      <UButton size="xs" label="核心分类" :color="mode === 'category' ? 'primary' : 'neutral'" @click="byCategory" />
      <UButton size="xs" label="度数 ≥ 5" :color="mode === 'degree' ? 'primary' : 'neutral'" @click="byDegree" />
      <UButton size="xs" label="边权 ≥ 5" :color="mode === 'edge' ? 'primary' : 'neutral'" @click="byEdgeWeight" />
      <UButton size="xs" label="只看枢纽" :color="mode === 'hubs' ? 'primary' : 'neutral'" @click="hubsOnly" />
      <UButton size="xs" color="neutral" variant="ghost" label="取消" @click="clearAll" />
    </div>

    <div class="bg-accented p-2 text-muted text-xs">
      已隐藏 {{ hiddenCount }} 个节点 · 最大度 {{ maxDegree }}
    </div>
  </SigmaControls>
</template>
