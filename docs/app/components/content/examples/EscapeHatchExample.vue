<script setup lang="ts">
/**
 * 纯原生逃生舱：不使用 Movk Sigma 的任何 composable、控件或工具函数。
 *
 * 只用 SigmaGraph 建实例，之后全部走 sigma / graphology 的原生 API。
 * 数据也自己管——传 graph 而不是 data，组件完全不碰它。
 * 封装是加法不是围墙，这一页的说服力全在「不用库的任何东西也能跑」。
 */
import Graph from 'graphology'
import { shallowRef } from 'vue'
import type Sigma from 'sigma'

const graph = new Graph()
graph.addNode('x', { label: '原生 X', x: 0, y: 0, size: 14, color: '#0ea5e9' })
graph.addNode('y', { label: '原生 Y', x: 320, y: 140, size: 12, color: '#0ea5e9' })
graph.addNode('z', { label: '原生 Z', x: 160, y: -220, size: 12, color: '#0ea5e9' })
graph.addEdge('x', 'y')
graph.addEdge('x', 'z')

const log = shallowRef<string[]>([])

function push(line: string) {
  log.value = [line, ...log.value].slice(0, 5)
}

function onReady(instance: Sigma) {
  // 原生事件订阅，不走库的事件绑定
  instance.on('clickNode', ({ node }) => push(`原生 clickNode: ${node}`))
  instance.on('enterNode', ({ node }) => push(`原生 enterNode: ${node}`))

  // 原生 settings 读写，验证透传未被过滤
  instance.setSetting('renderLabels', true)
  push(`getSettings().renderLabels = ${instance.getSettings().renderLabels}`)

  // 原生 graphology mutation，sigma 自动重绘
  graph.setNodeAttribute('x', 'size', 20)

  // 原生相机 API
  instance.getCamera().reset({ duration: 300 })
}
</script>

<template>
  <SigmaGraph :graph="graph" @ready="onReady">
    <div class="demo-panel" data-at="top-left">
      <span class="demo-tag">本示例只用到 SigmaGraph，其余全是 sigma / graphology 原生 API</span>
      <ul class="demo-log">
        <li v-for="(line, index) in log" :key="`${line}-${index}`">
          {{ line }}
        </li>
      </ul>
    </div>
  </SigmaGraph>
</template>
