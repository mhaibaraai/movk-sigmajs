<script setup lang="ts">
const enabled = shallowRef(true)
const moved = shallowRef(0)

const { dragged, isDragging } = useSigmaDrag({
  enabled: () => enabled.value,
  onEnd: () => {
    moved.value += 1
  }
})
</script>

<template>
  <SigmaControls>
    <USwitch v-model="enabled" size="xs" label="允许拖拽" />

    <div class="bg-accented text-muted p-2 text-xs">
      拖拽中 {{ dragged ?? '—' }} · 已移动 {{ moved }} 次 · {{ isDragging ? '按住' : '空闲' }}
    </div>
  </SigmaControls>
</template>
