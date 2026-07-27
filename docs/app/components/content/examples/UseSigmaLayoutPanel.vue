<script setup lang="ts">
import { shallowRef } from 'vue'
import type { SigmaLayoutName } from '@movk/sigma'

// 五种内置布局的统一入口。一次性布局只需 assign()，迭代型才有 start / stop
const names: SigmaLayoutName[] = ['circular', 'circlepack', 'random', 'noverlap', 'forceatlas2']

const layouts = {
  circular: useSigmaLayout('circular'),
  circlepack: useSigmaLayout('circlepack'),
  random: useSigmaLayout('random'),
  noverlap: useSigmaLayout('noverlap'),
  forceatlas2: useSigmaLayout('forceatlas2')
}

const current = shallowRef<SigmaLayoutName | ''>('')
const error = shallowRef('')

// 布局包全是可选 peer，用到时才动态导入，未安装则给出可操作的报错
async function run(name: SigmaLayoutName) {
  error.value = ''
  try {
    await layouts[name].assign()
    current.value = name
  }
  catch (cause) {
    error.value = cause instanceof Error ? cause.message : String(cause)
  }
}
</script>

<template>
  <div class="demo-panel" data-at="top-left">
    <div class="demo-row">
      <span class="demo-label">布局</span>
      <button v-for="name in names" :key="name" type="button" :aria-pressed="current === name" @click="run(name)">
        {{ name }}
      </button>
    </div>
    <span class="demo-tag">{{ error || `assign() 计算一次并写回坐标 · 当前 ${current || '初始坐标'}` }}</span>
  </div>
</template>
