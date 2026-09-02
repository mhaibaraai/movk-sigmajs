<script setup lang="ts">
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
  <SigmaControls>
    <div class="flex gap-1">
      <UButton
        size="xs"
        color="neutral"
        :label="forceAtlas2.isRunning.value ? '停止' : '启动 ForceAtlas2'"
        @click="toggle"
      />
      <UButton
        size="xs"
        color="neutral"
        label="消重叠"
        :disabled="forceAtlas2.isRunning.value"
        @click="noverlap.assign()"
      />
    </div>

    <div class="bg-accented p-2 text-muted text-xs w-72">
      <p>{{ forceAtlas2.isRunning.value ? 'worker 迭代中' : '未运行' }}</p>
      <p v-if="error">
        {{ error }}
      </p>
    </div>
  </SigmaControls>
</template>
