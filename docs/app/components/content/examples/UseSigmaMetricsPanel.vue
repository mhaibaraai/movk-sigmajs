<script setup lang="ts">
import { shallowRef } from 'vue'
import type { NodeDisplayData } from 'sigma/types'

/**
 * 度数、中心性与社区划分。
 *
 * 度数直接用核心 graphology 算；中心性与 Louvain 社区依赖可选 peer，
 * 用到时才动态导入，并按图版本缓存，同一版本重复调用不重算。
 */
const { graph } = useSigma()
const { maxDegree, centrality, communities } = useSigmaMetrics()

const mode = shallowRef<'none' | 'degree' | 'betweenness' | 'closeness' | 'community'>('none')
const summary = shallowRef('')
const error = shallowRef('')

const scores = shallowRef<Record<string, number>>({})
const colors = shallowRef<Record<string, string>>({})

const { refresh } = useSigmaReducer({
  order: 300,
  node: (key): Partial<NodeDisplayData> => {
    if (mode.value === 'community') {
      return colors.value[key] ? { color: colors.value[key] } : {}
    }
    const score = scores.value[key]
    return score === undefined ? {} : { size: 4 + score * 22 }
  }
})

async function rank(kind: 'degree' | 'betweenness' | 'closeness') {
  error.value = ''
  try {
    const result = await centrality(kind)
    const max = Math.max(...Object.values(result), 1)
    scores.value = Object.fromEntries(Object.entries(result).map(([key, value]) => [key, value / max]))

    const top = Object.entries(result).sort((a, b) => b[1] - a[1])[0]
    mode.value = kind
    summary.value = `最高 ${top?.[0] ?? '—'}（${top?.[1].toFixed(2) ?? '0'}）`
    refresh()
  }
  catch (cause) {
    error.value = cause instanceof Error ? cause.message : String(cause)
  }
}

async function detectCommunities() {
  error.value = ''
  try {
    const partition = await communities()
    colors.value = communityToColor(partition)
    mode.value = 'community'
    summary.value = `社区数 ${new Set(Object.values(partition)).size}`
    refresh()
  }
  catch (cause) {
    error.value = cause instanceof Error ? cause.message : String(cause)
  }
}

function applyDegreeSize() {
  const sizes = degreeToSize(graph.value, [4, 24])
  for (const [node, size] of Object.entries(sizes)) {
    graph.value.setNodeAttribute(node, 'size', size)
  }
  mode.value = 'none'
  summary.value = `度数直接写回属性，最大度 ${maxDegree.value}`
  refresh()
}
</script>

<template>
  <div class="demo-panel" data-at="top-left">
    <div class="demo-row">
      <span class="demo-label">中心性</span>
      <button type="button" :aria-pressed="mode === 'degree'" @click="rank('degree')">
        degree
      </button>
      <button type="button" :aria-pressed="mode === 'betweenness'" @click="rank('betweenness')">
        betweenness
      </button>
      <button type="button" :aria-pressed="mode === 'closeness'" @click="rank('closeness')">
        closeness
      </button>
    </div>
    <div class="demo-row">
      <span class="demo-label">其他</span>
      <button type="button" :aria-pressed="mode === 'community'" @click="detectCommunities">
        Louvain 社区着色
      </button>
      <button type="button" @click="applyDegreeSize">
        degreeToSize
      </button>
    </div>
    <span class="demo-tag">{{ error || summary || '点一个指标看视觉映射' }}</span>
    <span class="demo-tag">graphology-metrics@2.4.0 的 betweenness 在分叉节点上偏低、首个插入的节点恒为 0，依赖它做判断前请自行核对</span>
  </div>
</template>
