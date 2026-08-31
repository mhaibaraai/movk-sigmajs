<script setup lang="ts">
const props = defineProps<{ backgroundColor: string, sigmaOverrides: boolean }>()

const { toBlob, isExporting } = useSigmaExport()

const preview = shallowRef('')
const error = shallowRef('')

function setPreview(blob: Blob) {
  if (preview.value) {
    URL.revokeObjectURL(preview.value)
  }
  preview.value = URL.createObjectURL(blob)
}

onScopeDispose(() => {
  if (preview.value) {
    URL.revokeObjectURL(preview.value)
  }
})

async function run() {
  error.value = ''
  try {
    const blob = await toBlob({
      width: 640,
      height: 400,
      ...(props.backgroundColor === 'omit' ? {} : { backgroundColor: props.backgroundColor }),
      ...(props.sigmaOverrides ? { sigmaOverrides: { settings: { renderLabels: false } } } : {})
    })
    setPreview(blob)
  }
  catch (cause) {
    error.value = cause instanceof Error ? cause.message : String(cause)
  }
}
</script>

<template>
  <SigmaControls position="top-right">
    <UButton size="xs" color="neutral" label="导出预览" :disabled="isExporting" @click="run" />

    <div class="bg-accented p-2 text-muted text-xs w-56">
      <img v-if="preview" :src="preview" alt="导出结果预览" class="w-full">
      <p v-else>
        {{ error || '点上面的按钮，导出结果会显示在这里' }}
      </p>
    </div>
  </SigmaControls>
</template>
