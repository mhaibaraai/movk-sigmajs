<script setup lang="ts">
import { shallowRef } from 'vue'

/**
 * 大图上两条布局路径的耗时对照。
 *
 * 服务端预布局是最稳的：坐标随数据一起下发，前端一帧都不用算。
 * 客户端跑 ForceAtlas2 则要么阻塞主线程，要么起 worker 慢慢收敛。
 */
const { graph } = useSigma()
const worker = useSigmaLayout('forceatlas2', { settings: { barnesHutOptimize: true } })
const mainThread = useSigmaLayout('forceatlas2', { worker: false, iterations: 30 })

const info = shallowRef('坐标由生成器预先算好，当前一帧布局都没跑')
const error = shallowRef('')

/** 打乱坐标，模拟「服务端没给坐标」的处境 */
function scatter() {
  graph.value.forEachNode((node) => {
    graph.value.mergeNodeAttributes(node, { x: (Math.random() - 0.5) * 1000, y: (Math.random() - 0.5) * 1000 })
  })
  info.value = '坐标已打乱，需要前端自己算'
}

async function runBlocking() {
  error.value = ''
  const t0 = performance.now()
  try {
    await mainThread.assign()
    info.value = `主线程 30 轮迭代耗时 ${(performance.now() - t0).toFixed(0)} ms，期间页面无响应`
  }
  catch (cause) {
    error.value = cause instanceof Error ? cause.message : String(cause)
  }
}

async function toggleWorker() {
  error.value = ''
  try {
    if (worker.isRunning.value) {
      worker.stop()
      info.value = 'worker 已停，主线程全程未被阻塞'
    }
    else {
      await worker.start()
      info.value = 'worker 迭代中，可以随意拖动画布'
    }
  }
  catch (cause) {
    error.value = cause instanceof Error ? cause.message : String(cause)
  }
}
</script>

<template>
  <div class="demo-panel" data-at="top-left">
    <div class="demo-row">
      <button type="button" @click="scatter">
        打乱坐标
      </button>
      <button type="button" :disabled="worker.isRunning.value" @click="runBlocking">
        主线程布局
      </button>
      <button type="button" @click="toggleWorker">
        {{ worker.isRunning.value ? '停止 worker' : 'worker 布局' }}
      </button>
    </div>
    <span class="demo-tag">{{ error || info }}</span>
  </div>
</template>
