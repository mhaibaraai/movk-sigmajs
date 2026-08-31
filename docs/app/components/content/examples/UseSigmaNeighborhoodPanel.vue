<script setup lang="ts">
import { computed, watch } from 'vue'

const props = defineProps<{ depth: number }>()

/**
 * N 度邻域 BFS。
 *
 * 走核心的 graph.neighbors()，它在有向图上同时返回出入两侧的邻居，
 * 正是图谱浏览要的可达性语义，因此不引入 graphology-traversal 这个可选 peer。
 */
const { graph } = useSigma()
const { neighborhood } = useSigmaNeighborhood({ depth: props.depth })
const { selected } = useSigmaSelection({ dim: false })
const { setNodesState } = useSigmaState<{ reach: string }>()

const center = computed(() => selected.value ?? 'n0')

// 不传 depth，取的就是 composable 的默认深度
const reachable = computed(() => neighborhood(center.value))

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
  <SigmaControls>
    <div class="bg-accented p-2 text-muted text-xs">
      中心 {{ center }}（点节点可换）· {{ depth }} 度可达 {{ reachable.size }} 个
    </div>
  </SigmaControls>
</template>
