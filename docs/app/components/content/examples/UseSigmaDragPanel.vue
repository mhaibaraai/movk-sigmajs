<script setup lang="ts">
const props = defineProps<{ enabled: boolean }>()

const moved = shallowRef(0)
const { dragged, isDragging } = useSigmaDrag({
  enabled: () => props.enabled,
  onEnd: () => {
    moved.value += 1
  }
})

const layout = useSigmaLayout('forceatlas2')
</script>

<template>
  <SigmaControls>
    <UButton
      size="xs"
      color="neutral"
      :label="layout.isRunning.value ? '停止布局' : '启动 ForceAtlas2'"
      @click="layout.isRunning.value ? layout.stop() : layout.start()"
    />

    <div class="bg-accented p-2 text-muted text-xs">
      <p>{{ layout.isRunning.value ? '布局在跑，拖拽会被立刻覆盖' : '布局已停，可自由摆位' }}</p>
      <p>拖拽中 {{ dragged ?? '—' }} · 已移动 {{ moved }} 次 · {{ isDragging ? '按住' : '空闲' }}</p>
    </div>
  </SigmaControls>
</template>
