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
  <SigmaControls position="top-right">
    <div class="flex gap-1">
      <UButton
        size="xs"
        label="整块舞台"
        :color="current === 'plain' ? 'primary' : 'neutral'"
        @click="run(false)"
      />
      <UButton
        size="xs"
        label="扣掉侧栏"
        :color="current === 'insets' ? 'primary' : 'neutral'"
        @click="run(true)"
      />
    </div>

    <div class="bg-accented p-2 text-muted text-xs w-64">
      {{ error || '整块舞台会把左侧内容压在侧栏底下，扣掉遮挡后内容整体右移并退远' }}
    </div>
  </SigmaControls>
</template>
