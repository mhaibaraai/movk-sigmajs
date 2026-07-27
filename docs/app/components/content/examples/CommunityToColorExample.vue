<script setup lang="ts">
import Graph from 'graphology'
import { shallowRef } from 'vue'

/**
 * 把社区编号映射为颜色。
 *
 * 入参是社区划分结果而非图，因此本函数不依赖 graphology-communities-louvain
 * 这个可选 peer——手写的划分、服务端下发的划分、Louvain 的输出都能直接喂进来。
 * 编号超出调色板长度时循环取用，负数编号也能正确回绕。
 */
const graph = new Graph()
graph.import(demoGraph({ nodes: 12, extraEdges: 1 }))

// 手写一份划分，证明这个函数与任何社区检测算法解耦
const partition: Record<string, number> = {
  n0: 0, n1: 0, n2: 0, n3: 1, n4: 1, n5: 1,
  n6: 2, n7: 2, n8: 2, n9: -1, n10: 5, n11: 12
}

const palette = shallowRef<'default' | 'custom'>('default')

const CUSTOM = ['#0ea5e9', '#f97316', '#84cc16'] as const

function paint(kind: 'default' | 'custom') {
  palette.value = kind
  const colors = kind === 'custom'
    ? communityToColor(partition, CUSTOM)
    : communityToColor(partition)

  for (const [node, color] of Object.entries(colors)) {
    graph.setNodeAttribute(node, 'color', color)
  }
}
</script>

<template>
  <SigmaGraph :graph="graph">
    <div class="demo-panel" data-at="top-left">
      <div class="demo-row">
        <span class="demo-label">调色板</span>
        <button type="button" :aria-pressed="palette === 'default'" @click="paint('default')">
          内置
        </button>
        <button type="button" :aria-pressed="palette === 'custom'" @click="paint('custom')">
          自定义三色
        </button>
      </div>
      <span class="demo-tag">划分里有 -1、5、12 三个越界编号，回绕后仍能取到颜色</span>
    </div>
  </SigmaGraph>
</template>
