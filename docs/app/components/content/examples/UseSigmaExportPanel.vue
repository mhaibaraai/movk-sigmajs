<script setup lang="ts">
import { shallowRef } from 'vue'

/**
 * 把当前画面导出为 PNG。
 *
 * 依赖可选 peer `@sigma/export-image`，用到时才动态加载——它与 sigma 本体一样
 * 在模块顶层读 WebGL 全局，静态 import 会让 SSR 直接崩。
 */
const { toBlob, download, isExporting } = useSigmaExport()

const info = shallowRef('')
const error = shallowRef('')

async function measure() {
  error.value = ''
  try {
    const blob = await toBlob({ backgroundColor: '#ffffff' })
    info.value = `${(blob.size / 1024).toFixed(1)} KB · ${blob.type}`
  }
  catch (cause) {
    error.value = cause instanceof Error ? cause.message : String(cause)
  }
}

// 上游会按格式自行追加扩展名，因此 download('x.png') 与 download('x') 归一为同一结果
async function save() {
  error.value = ''
  try {
    await download('graph.png', { backgroundColor: '#ffffff', width: 1200, height: 800 })
  }
  catch (cause) {
    error.value = cause instanceof Error ? cause.message : String(cause)
  }
}
</script>

<template>
  <SigmaControls>
    <div class="flex gap-1">
      <UButton size="xs" color="neutral" label="toBlob" :disabled="isExporting" @click="measure" />
      <UButton size="xs" color="neutral" label="download" :disabled="isExporting" @click="save" />
    </div>

    <div class="bg-accented p-2 text-muted text-xs w-64">
      {{ error || info || (isExporting ? '导出中…' : '导出不做成组件，加一个自己的按钮即可') }}
    </div>
  </SigmaControls>
</template>
