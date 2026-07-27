<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import type { NodeDisplayData } from 'sigma/types'

/**
 * N 度邻域 BFS。
 *
 * 走核心的 graph.neighbors()，它在有向图上同时返回出入两侧的邻居，
 * 正是图谱浏览要的可达性语义，因此不引入 graphology-traversal 这个可选 peer。
 */
const { neighborhood } = useSigmaNeighborhood()
const { selected } = useSigmaSelection({ dim: false })

const depth = shallowRef(2)
const center = computed(() => selected.value ?? 'n0')
const reachable = computed(() => neighborhood(center.value, depth.value))

// 把邻域结果画出来：中心与命中的染色，其余淡出
const { refresh } = useSigmaReducer({
  order: 300,
  node: (key): Partial<NodeDisplayData> => {
    if (key === center.value) {
      return { color: '#f43f5e', zIndex: 2 }
    }
    return reachable.value.has(key)
      ? { color: '#3b82f6', zIndex: 1 }
      : { color: '#d1d5db', label: '' }
  }
})

// 归约函数本身不变，变的是它闭包里的状态，那种情况下调 refresh 让 sigma 重跑归约
watch(reachable, refresh)
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
