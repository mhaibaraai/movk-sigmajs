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
  <SigmaControls>
    <div class="flex gap-1">
      <UButton size="xs" color="neutral" label="放大" @click="zoomIn()" />
      <UButton size="xs" color="neutral" label="缩小" @click="zoomOut()" />
      <UButton size="xs" color="neutral" label="复位" @click="reset()" />
    </div>

    <div class="flex gap-1">
      <UButton size="xs" color="neutral" label="聚焦 n3" @click="gotoNode('n3', { ratio: 0.4 })" />
      <UButton size="xs" color="neutral" label="旋转" @click="goto({ angle: Math.PI / 6 }, { duration: 400 })" />
      <UButton size="xs" color="neutral" label="容纳全图" @click="fitAll" />
      <UButton size="xs" color="neutral" label="读状态" @click="readState" />
    </div>

    <div class="bg-accented p-2 text-muted text-xs">
      {{ error || state || '点「读状态」看当前相机' }}
    </div>
  </SigmaControls>
</template>
