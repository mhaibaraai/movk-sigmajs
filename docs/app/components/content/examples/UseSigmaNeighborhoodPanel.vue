<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'

/**
 * N 度邻域 BFS。
 *
 * 走核心的 graph.neighbors()，它在有向图上同时返回出入两侧的邻居，
 * 正是图谱浏览要的可达性语义，因此不引入 graphology-traversal 这个可选 peer。
 */
const { graph } = useSigma()
const { neighborhood } = useSigmaNeighborhood()
const { selected } = useSigmaSelection({ dim: false })
const { setNodesState } = useSigmaState<{ reach: string }>()

const depth = shallowRef(2)
const center = computed(() => selected.value ?? 'n0')
const reachable = computed(() => neighborhood(center.value, depth.value))

// 结果写进自定义状态，外观由外壳的 styles 按 matchState 决定
watch(reachable, () => {
  const hit: string[] = []
  const out: string[] = []
  graph.value.forEachNode((key) => {
    if (key !== center.value) {
      (reachable.value.has(key) ? hit : out).push(key)
    }
  })

  setNodesState([center.value], { reach: 'center' })
  setNodesState(hit, { reach: 'hit' })
  setNodesState(out, { reach: 'out' })
}, { immediate: true })
</script>

<template>
  <div class="demo-panel" data-at="top-left">
    <div class="demo-row">
      <span class="demo-label">深度</span>
      <button v-for="value in [1, 2, 3]" :key="value" type="button" :aria-pressed="depth === value" @click="depth = value">
        {{ value }}
      </button>
    </div>
    <span class="demo-tag">中心 {{ center }}（点节点可换）· {{ depth }} 度可达 {{ reachable.size }} 个</span>
  </div>
</template>
