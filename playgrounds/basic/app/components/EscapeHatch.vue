<script setup lang="ts">
/**
 * 纯原生逃生舱：不使用 @movk/sigma 的任何 composable、控件或工具函数。
 * 只用 SigmaGraph 建实例，之后全部走 sigma / graphology 的原生 API。
 * 数据也自己管——传 graph 而不是 data，组件完全不碰它。
 */
import Graph from 'graphology'
import type Sigma from 'sigma'

const graph = new Graph()
graph.addNode('x', { label: '原生 X', x: 0, y: 0, size: 12, color: '#0ea5e9' })
graph.addNode('y', { label: '原生 Y', x: 10, y: 4, size: 12, color: '#0ea5e9' })
graph.addEdge('x', 'y')

const log = ref<string[]>([])

function onReady(instance: Sigma) {
  // 原生事件订阅，不经 useSigmaEvents
  instance.on('clickNode', ({ node }) => {
    log.value = [`原生 clickNode: ${node}`, ...log.value].slice(0, 4)
  })

  // 原生 settings 读写，验证透传未被过滤
  instance.setSetting('renderLabels', true)
  log.value = [`getSettings().renderLabels = ${instance.getSettings().renderLabels}`, ...log.value]

  // 原生 graphology mutation，sigma 自动重绘
  graph.setNodeAttribute('x', 'size', 18)

  // 原生相机 API
  instance.getCamera().animatedReset({ duration: 300 })
}
</script>

<template>
  <div>
    <div class="stage">
      <SigmaGraph
        :graph="graph"
        @ready="onReady"
      />
    </div>
    <ul class="log">
      <li
        v-for="line in log"
        :key="line"
      >
        {{ line }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.stage {
  height: 240px;
  border: 1px solid #d0d7de;
  border-radius: 8px;
  overflow: hidden;
}

.log {
  margin-top: 8px;
  padding-left: 18px;
  color: #57606a;
  font-size: 13px;
}
</style>
