<script setup lang="ts">
import { shallowRef } from 'vue'

const { fitTo } = useSigmaCamera()

const current = shallowRef('')
const error = shallowRef('')

// fitTo 依赖可选 peer @sigma/utils，未安装时给出可操作的报错
async function run(withInsets: boolean) {
  error.value = ''
  try {
    await fitTo(undefined, withInsets ? { insets: { left: 240 }, minRatio: 0.12 } : {})
    current.value = withInsets ? 'insets' : 'plain'
  }
  catch (cause) {
    error.value = cause instanceof Error ? cause.message : String(cause)
  }
}
</script>

<template>
  <div class="demo-panel" data-at="top-right">
    <div class="demo-row">
      <span class="demo-label">fit</span>
      <button type="button" :aria-pressed="current === 'plain'" @click="run(false)">
        整块舞台
      </button>
      <button type="button" :aria-pressed="current === 'insets'" @click="run(true)">
        扣掉侧栏
      </button>
    </div>
    <span class="demo-tag">{{ error || '整块舞台会把左侧内容压在侧栏底下，扣掉遮挡后内容整体右移并退远' }}</span>
  </div>
</template>
