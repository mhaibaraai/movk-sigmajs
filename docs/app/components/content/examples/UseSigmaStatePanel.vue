<script setup lang="ts">
const { graph } = useSigma()
const { setNodeState, setNodesState, getNodeState, getGraphState } = useSigmaState<{ isPinned: boolean }>()

const info = shallowRef('')

function report() {
  info.value = `a.isHighlighted=${getNodeState('a')?.isHighlighted} · hasHighlighted=${getGraphState()?.hasHighlighted}`
}

function highlight() {
  setNodesState(['a', ...graph.value.neighbors('a')], { isHighlighted: true })
  report()
}

function pin() {
  setNodeState('b', { isPinned: true })
  report()
}

function clear() {
  setNodesState(graph.value.nodes(), { isHighlighted: false, isPinned: false })
  report()
}
</script>

<template>
  <SigmaControls>
    <div class="flex gap-1">
      <UButton size="xs" color="neutral" label="高亮 A 及邻居" @click="highlight" />
      <UButton size="xs" color="neutral" label="钉住 B" @click="pin" />
      <UButton size="xs" color="neutral" label="清空" @click="clear" />
    </div>
  </SigmaControls>
</template>
