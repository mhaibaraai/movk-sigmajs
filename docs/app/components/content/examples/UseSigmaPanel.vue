<script setup lang="ts">
const { sigma, graph, isReady, whenReady } = useSigma()
const info = shallowRef('')

async function callNative() {
  const instance = await whenReady()

  instance.getCamera().reset({ duration: 400 })

  const [first] = graph.value.nodes()
  if (first) {
    graph.value.setNodeAttribute(first, 'color', '#a855f7')
  }

  info.value = `ratio ${instance.getCamera().ratio.toFixed(2)} · 节点 ${graph.value.order}`
}
</script>

<template>
  <SigmaControls>
    <UButton size="xs" color="neutral" label="直接调原生 API" @click="callNative" />

    <div class="bg-accented p-2 text-muted text-xs">
      <p>{{ isReady ? '已就绪' : '等待实例…' }}</p>
      <p>{{ info || `sigma 实例：${sigma ? '原生对象' : 'null（SSR 或未挂载）'}` }}</p>
    </div>
  </SigmaControls>
</template>
