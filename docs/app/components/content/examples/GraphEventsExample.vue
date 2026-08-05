<script setup lang="ts">
import { shallowRef } from 'vue'

// 组件 emits 覆盖 sigma 事件全集（33 个），node / edge / stage 三组都能直接监听。
// 未被 emits 覆盖的场景走 useSigmaEvents，再底层还有 sigma.on()
const log = shallowRef<string[]>([])

function push(line: string) {
  log.value = [line, ...log.value].slice(0, 5)
}

const data = {
  attributes: {},
  options: { type: 'mixed' as const, multi: false, allowSelfLoops: true },
  nodes: [
    { key: 'a', attributes: { label: '点我', x: 0, y: 0, size: 15, color: '#f43f5e' } },
    { key: 'b', attributes: { label: '也点我', x: 340, y: 300, size: 13, color: '#3b82f6' } }
  ],
  edges: [{ source: 'a', target: 'b', attributes: { label: '点这条边' } }]
}
</script>

<template>
  <SigmaGraph
    :data="data"
    :settings="{ renderEdgeLabels: true, enableEdgeEvents: true }"
    @click-node="({ node }) => push(`clickNode ${node}`)"
    @enter-node="({ node }) => push(`enterNode ${node}`)"
    @click-edge="({ edge }) => push(`clickEdge ${edge}`)"
    @click-stage="() => push('clickStage')"
    @ready="() => push('ready')"
  >
    <div class="demo-panel" data-at="top-left">
      <span class="demo-tag">最近 5 条事件</span>
      <ul class="demo-log">
        <li v-for="(line, index) in log" :key="`${line}-${index}`">
          {{ line }}
        </li>
      </ul>
    </div>
  </SigmaGraph>
</template>
