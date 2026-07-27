<script setup lang="ts">
import { shallowRef } from 'vue'

/**
 * 拖拽移动节点。
 *
 * 与迭代型布局互斥：ForceAtlas2 之类的 worker 在跑时会持续回写坐标，
 * 拖拽结果会被立刻覆盖。这里的开关用来对照这个现象。
 */
const moved = shallowRef(0)
const { dragged, isDragging } = useSigmaDrag({
  onEnd: () => {
    moved.value += 1
  }
})

const layout = useSigmaLayout('forceatlas2')
</script>

<template>
  <div class="demo-panel" data-at="top-left">
    <div class="demo-row">
      <button type="button" @click="layout.isRunning.value ? layout.stop() : layout.start()">
        {{ layout.isRunning.value ? '停止布局' : '启动 ForceAtlas2' }}
      </button>
      <span class="demo-tag">{{ layout.isRunning.value ? '布局在跑，拖拽会被立刻覆盖' : '布局已停，可自由摆位' }}</span>
    </div>
    <span class="demo-tag">拖拽中 {{ dragged ?? '—' }} · 已移动 {{ moved }} 次 · {{ isDragging ? '按住' : '空闲' }}</span>
  </div>
</template>
