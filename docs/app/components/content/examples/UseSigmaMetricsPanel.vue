<script setup lang="ts">
const { graph } = useSigma()
const { degrees, maxDegree, centrality, communities } = useSigmaMetrics()

const mode = shallowRef<'none' | 'degree' | 'betweenness' | 'closeness' | 'community'>('none')
const summary = shallowRef('')
const error = shallowRef('')

function writeAttribute(name: string, values: Record<string, number>) {
  for (const [node, value] of Object.entries(values)) {
    graph.value.setNodeAttribute(node, name, value)
  }
}

async function rank(kind: 'degree' | 'betweenness' | 'closeness') {
  error.value = ''
  try {
    const result = await centrality(kind)
    const max = Math.max(...Object.values(result), 1)
    writeAttribute('metric', Object.fromEntries(
      Object.entries(result).map(([key, value]) => [key, value / max])
    ))

    const top = Object.entries(result).sort((a, b) => b[1] - a[1])[0]
    mode.value = kind
    summary.value = `最高 ${top?.[0] ?? '—'}（${top?.[1].toFixed(2) ?? '0'}）`
  }
  catch (cause) {
    error.value = cause instanceof Error ? cause.message : String(cause)
  }
}

async function detectCommunities() {
  error.value = ''
  try {
    const partition = await communities()
    writeAttribute('community', partition)
    mode.value = 'community'
    summary.value = `社区数 ${new Set(Object.values(partition)).size}`
  }
  catch (cause) {
    error.value = cause instanceof Error ? cause.message : String(cause)
  }
}

function applyDegreeSize() {
  const max = Math.max(maxDegree.value, 1)
  writeAttribute('metric', Object.fromEntries(
    Object.entries(degrees.value).map(([node, degree]) => [node, Math.sqrt(degree / max)])
  ))
  mode.value = 'degree'
  summary.value = `度数映射尺寸，最大度 ${maxDegree.value}`
}
</script>

<template>
  <SigmaControls>
    <div class="flex gap-1">
      <UButton size="xs" label="degree" :color="mode === 'degree' ? 'primary' : 'neutral'" @click="rank('degree')" />
      <UButton size="xs" label="betweenness" :color="mode === 'betweenness' ? 'primary' : 'neutral'" @click="rank('betweenness')" />
      <UButton size="xs" label="closeness" :color="mode === 'closeness' ? 'primary' : 'neutral'" @click="rank('closeness')" />
    </div>

    <div class="flex gap-1">
      <UButton size="xs" label="Louvain 社区着色" :color="mode === 'community' ? 'primary' : 'neutral'" @click="detectCommunities" />
      <UButton size="xs" color="neutral" variant="ghost" label="度数映射尺寸" @click="applyDegreeSize" />
    </div>

    <div class="bg-accented p-2 text-muted text-xs w-72">
      {{ error || summary || '点一个指标看视觉映射' }}
    </div>
  </SigmaControls>
</template>
