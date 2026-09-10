<script setup lang="ts">
import type { SigmaLayoutName } from '@movk/sigma'

const name = defineModel<SigmaLayoutName>('name', { required: true })

const names: SigmaLayoutName[] = ['circular', 'random', 'circlepack', 'noverlap', 'forceatlas2']

/**
 * 布局实现全部来自可选 peer，缺装时动态 import() 会抛错。
 * 这里把异常显示出来，验证缺失分支不会把整个示例带崩。
 */
const { assign, start, stop, isRunning, isSupervised } = useSigmaLayout(name.value)

const error = shallowRef('')
const done = shallowRef('')

async function run() {
  error.value = ''
  done.value = ''
  try {
    await assign()
    done.value = `${name.value} 已写回坐标`
  }
  catch (cause) {
    error.value = cause instanceof Error ? cause.message : String(cause)
  }
}
</script>

<template>
  <SigmaControls>
    <div class="flex flex-wrap gap-1">
      <UButton
        v-for="item in names"
        :key="item"
        size="xs"
        :label="item"
        :color="name === item ? 'primary' : 'neutral'"
        @click="name = item"
      />
    </div>

    <div class="flex gap-1">
      <UButton size="xs" color="neutral" label="assign()" @click="run" />
      <UButton
        v-if="isSupervised"
        size="xs"
        color="neutral"
        :label="isRunning ? '停止' : 'start()'"
        @click="isRunning ? stop() : start()"
      />
    </div>

    <div class="bg-accented text-muted w-64 p-2 text-xs">
      {{ error || done || `isSupervised ${isSupervised}` }}
    </div>
  </SigmaControls>
</template>
