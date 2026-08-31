<script setup lang="ts">
const { fitTo } = useSigmaCamera()

const current = shallowRef('')
const error = shallowRef('')

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
  </SigmaControls>
</template>
