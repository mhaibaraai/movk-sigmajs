<script setup lang="ts">
const props = defineProps<{ depth: number }>()

const { graph } = useSigma()
const { neighborhood } = useSigmaNeighborhood({ depth: props.depth })
const { selected } = useSigmaSelection({ dim: false })
const { setNodesState } = useSigmaState<{ reach: string }>()

const center = computed(() => selected.value ?? '11.0')

const reachable = computed(() => neighborhood(center.value))

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
    <div class="bg-accented p-2 text-muted text-xs">
      中心 {{ center }}（点节点可换）· {{ depth }} 度可达 {{ reachable.size }} 个
    </div>
  </SigmaControls>
</template>
