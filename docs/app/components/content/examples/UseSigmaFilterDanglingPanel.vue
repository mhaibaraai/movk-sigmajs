<script setup lang="ts">
const props = defineProps<{ hideDanglingEdges: boolean }>()

const { nodeFilter, reset, hiddenCount } = useSigmaFilter({
  hideDanglingEdges: props.hideDanglingEdges
})

const { degrees } = useSigmaMetrics()

function hideLeaves() {
  nodeFilter.value = key => (degrees.value[key] ?? 0) >= 5
}
</script>

<template>
  <SigmaControls>
    <div class="flex gap-1">
      <UButton size="xs" color="neutral" label="隐藏度数 < 5 的节点" @click="hideLeaves" />
      <UButton size="xs" color="neutral" variant="ghost" label="取消" @click="reset" />
    </div>

    <div class="bg-accented p-2 text-muted text-xs">
      已隐藏 {{ hiddenCount }} 个节点 · hideDanglingEdges {{ hideDanglingEdges }}
    </div>
  </SigmaControls>
</template>
