<script setup lang="ts">
import { shallowRef } from 'vue'
import type { SigmaLayoutName } from '@movk/sigma'

const props = defineProps<{ name: SigmaLayoutName }>()

// 五种内置布局的统一入口。一次性布局只需 assign()，迭代型才有 start / stop
const { assign, isSupervised } = useSigmaLayout(props.name)

const done = shallowRef(false)
const error = shallowRef('')

// 布局包全是可选 peer，用到时才动态导入，未安装则给出可操作的报错
async function run() {
  error.value = ''
  try {
    await assign()
    done.value = true
  }
  catch (cause) {
    error.value = cause instanceof Error ? cause.message : String(cause)
  }
}
</script>

<template>
  <SigmaControls>
    <UButton size="xs" color="neutral" :label="`${name}.assign()`" @click="run" />

    <div class="bg-accented p-2 text-muted text-xs w-64">
      {{ error || `isSupervised ${isSupervised} · ${done ? '已写回坐标' : '还是初始坐标'}` }}
    </div>
  </SigmaControls>
</template>
