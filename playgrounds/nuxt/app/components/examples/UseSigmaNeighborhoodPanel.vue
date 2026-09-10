<script setup lang="ts">
const depth = shallowRef(1)

const { graph } = useSigma()
const { neighborhood } = useSigmaNeighborhood()
const { selected } = useSigmaSelection({ dim: false })
const { setNodesState } = useSigmaState<{ reach: string }>()

const center = computed(() => selected.value ?? '11.0')
const reachable = computed(() => neighborhood(center.value, depth.value))

watch(reachable, () => {
  const hit: string[] = []
  const out: string[] = []
  graph.value.forEachNode((key) => {
    if (key !== center.value) {
      (reachable.value.has(key) ? hit : out).push(key)
    }
  })

  setNodesState([center.value], { reach: 'center' })
  setNodesState(hit, { reach: 'hit' })
  setNodesState(out, { reach: 'out' })
}, { immediate: true })
</script>

<template>
  <SigmaControls>
    <div class="flex gap-1">
      <UButton
        v-for="value in [1, 2, 3]"
        :key="value"
        size="xs"
        :label="`${value} 度`"
        :color="depth === value ? 'primary' : 'neutral'"
        @click="depth = value"
      />
    </div>

    <div class="bg-accented text-muted p-2 text-xs">
      中心 {{ center }}（点节点可换）· {{ depth }} 度可达 {{ reachable.size }} 个
    </div>
  </SigmaControls>
</template>
