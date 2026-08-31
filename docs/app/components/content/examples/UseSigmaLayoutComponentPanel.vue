<script setup lang="ts">
const settings = { gravity: 1, scalingRatio: 20, adjustSizes: true, strongGravityMode: false }

const whole = useSigmaLayout('forceatlas2', { worker: false, iterations: 200, settings })
const packed = useSigmaLayout('forceatlas2', { worker: false, iterations: 200, byComponent: true, settings })

const { fitTo } = useSigmaCamera()

const current = shallowRef('')
const error = shallowRef('')

async function run(mode: 'whole' | 'packed') {
  error.value = ''
  try {
    await (mode === 'whole' ? whole : packed).assign()
    current.value = mode
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
      <UButton size="xs" label="整图一次" :color="current === 'whole' ? 'primary' : 'neutral'" @click="run('whole')" />
      <UButton size="xs" label="按分量" :color="current === 'packed' ? 'primary' : 'neutral'" @click="run('packed')" />
    </div>

    <div class="bg-accented p-2 text-muted text-xs w-72">
      {{ error || '整图一次会把互不相连的分量推满整个平面，按分量则各自成团' }}
    </div>
  </SigmaControls>
</template>
