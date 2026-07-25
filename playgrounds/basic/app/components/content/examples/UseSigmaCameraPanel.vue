<script setup lang="ts">
import { shallowRef } from 'vue'

// 全部基于原生 sigma.getCamera()，需要更底层的控制随时可以直接拿实例自己调
const { zoomIn, zoomOut, reset, goto, gotoNode, fitTo, getState, toViewport } = useSigmaCamera()

const state = shallowRef('')
const error = shallowRef('')

function readState() {
  const current = getState()
  const screen = toViewport({ x: 0, y: 0 })
  state.value = current
    ? `ratio ${current.ratio.toFixed(2)} · x ${current.x.toFixed(2)} · 图原点在屏幕 ${screen ? `${Math.round(screen.x)},${Math.round(screen.y)}` : '—'}`
    : '未就绪'
}

// fitTo 依赖可选 peer @sigma/utils，未安装时给出可操作的报错
async function fitAll() {
  error.value = ''
  try {
    await fitTo()
  }
  catch (cause) {
    error.value = cause instanceof Error ? cause.message : String(cause)
  }
}
</script>

<template>
  <div class="demo-panel" data-at="top-left">
    <div class="demo-row">
      <button type="button" @click="zoomIn()">
        放大
      </button>
      <button type="button" @click="zoomOut()">
        缩小
      </button>
      <button type="button" @click="reset()">
        复位
      </button>
    </div>
    <div class="demo-row">
      <button type="button" @click="gotoNode('n3', { ratio: 0.4 })">
        聚焦 n3
      </button>
      <button type="button" @click="goto({ angle: Math.PI / 6 }, { duration: 400 })">
        旋转
      </button>
      <button type="button" @click="fitAll">
        容纳全图
      </button>
      <button type="button" @click="readState">
        读状态
      </button>
    </div>
    <span class="demo-tag">{{ error || state || '点「读状态」看当前相机' }}</span>
  </div>
</template>
