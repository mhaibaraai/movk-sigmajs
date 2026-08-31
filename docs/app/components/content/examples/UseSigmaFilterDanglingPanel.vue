<script setup lang="ts">
const props = defineProps<{ hideDanglingEdges: boolean }>()

/**
 * 关掉 hideDanglingEdges 后，端点被隐藏的边仍然渲染，
 * 画面上是一堆连向空白处的断线。
 */
const { nodeFilter, reset, hiddenCount } = useSigmaFilter({
  hideDanglingEdges: props.hideDanglingEdges
})

const { degrees } = useSigmaMetrics()

function hideLeaves() {
  nodeFilter.value = key => (degrees.value[key] ?? 0) >= 2
}
</script>

<template>
  <SigmaControls>
    <div class="flex gap-1">
      <UButton size="xs" color="neutral" label="隐藏度数 < 2 的节点" @click="hideLeaves" />
      <UButton size="xs" color="neutral" variant="ghost" label="取消" @click="reset" />
    </div>

    <div class="bg-accented p-2 text-muted text-xs">
      已隐藏 {{ hiddenCount }} 个节点 · hideDanglingEdges {{ hideDanglingEdges }}
    </div>
  </SigmaControls>
</template>
