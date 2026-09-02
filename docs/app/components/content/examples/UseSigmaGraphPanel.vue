<script setup lang="ts">
const { graph, version, order, size, onGraphUpdate } = useSigmaGraph()

const updates = shallowRef(0)
onGraphUpdate(() => {
  updates.value += 1
})

let seq = 0

function addNode() {
  seq += 1
  const key = `extra-${seq}`
  graph.value.addNode(key, {
    label: key,
    x: 200 + Math.cos(seq) * 220,
    y: -250 + Math.sin(seq) * 220,
    size: 20,
    color: '#f59e0b'
  })
  graph.value.addEdge('a', key)
}

function recolor() {
  graph.value.setNodeAttribute('a', 'color', `hsl(${(seq += 40) % 360} 70% 55%)`)
}
</script>

<template>
  <SigmaControls>
    <div class="flex gap-1">
      <UButton size="xs" color="neutral" label="addNode" @click="addNode" />
      <UButton size="xs" color="neutral" label="改属性" @click="recolor" />
    </div>

    <div class="bg-accented p-2 text-muted text-xs">
      version {{ version }} · 节点 {{ order }} · 边 {{ size }} · 回调 {{ updates }} 次
    </div>
  </SigmaControls>
</template>
