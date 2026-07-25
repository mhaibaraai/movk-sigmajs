<script setup lang="ts">
import { shallowRef } from 'vue'

/**
 * 迭代型布局的 worker 生命周期。
 *
 * ForceAtlas2 与 Noverlap 的 worker 会持续占用线程，组件卸载或 HMR 时不 kill 就泄漏。
 * useSigmaLayout 统一在作用域销毁时释放，滚出视口让示例卸载即可验证。
 */
const forceAtlas2 = useSigmaLayout('forceatlas2', {
  settings: { gravity: 1, scalingRatio: 8 }
})

const noverlap = useSigmaLayout('noverlap')
const error = shallowRef('')

async function toggle() {
  error.value = ''
  try {
    if (forceAtlas2.isRunning.value) {
      forceAtlas2.stop()
    }
    else {
      await forceAtlas2.start()
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
      <button type="button" @click="toggle">
        {{ forceAtlas2.isRunning.value ? '停止' : '启动 ForceAtlas2' }}
      </button>
      <button type="button" :disabled="forceAtlas2.isRunning.value" @click="noverlap.assign()">
        消重叠
      </button>
      <span class="demo-tag">{{ forceAtlas2.isRunning.value ? 'worker 迭代中' : '未运行' }}</span>
    </div>
    <span class="demo-tag">{{ error || 'isSupervised 为 true 才有 start / stop，一次性布局上 start 等价于 assign' }}</span>
  </div>
</template>
