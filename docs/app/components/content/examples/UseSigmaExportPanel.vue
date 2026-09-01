<script setup lang="ts">
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

    <div v-if="error || info || isExporting" class="bg-accented p-2 text-muted text-xs w-64">
      {{ error || info || '导出中…' }}
    </div>
  </SigmaControls>
</template>
