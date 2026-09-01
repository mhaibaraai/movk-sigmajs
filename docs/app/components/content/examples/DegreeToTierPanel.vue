<script setup lang="ts">
const { graph } = useSigmaGraph()

const presets = [
  { label: '15% / 50%', ratios: [0.15, 0.5] },
  { label: '50% / 90%', ratios: [0.5, 0.9] },
  { label: '只分两档', ratios: [0.2] }
]

const current = shallowRef(presets[0]!.label)
const counts = shallowRef<number[]>([])

function apply(preset: typeof presets[number]) {
  current.value = preset.label

  const tiers = degreeToTier(graph.value, { ratios: preset.ratios })
  const tally = Array.from({ length: preset.ratios.length + 1 }, () => 0)

  for (const [node, tier] of Object.entries(tiers)) {
    graph.value.setNodeAttribute(node, 'labelTier', tier)
    tally[tier] = (tally[tier] ?? 0) + 1
  }

  counts.value = tally
}

apply(presets[0]!)
</script>

<template>
  <SigmaControls>
    <div class="flex gap-1">
      <UButton
        v-for="preset in presets"
        :key="preset.label"
        size="xs"
        :label="preset.label"
        :color="current === preset.label ? 'primary' : 'neutral'"
        @click="apply(preset)"
      />
    </div>

    <div class="bg-accented p-2 text-muted text-xs">
      <p>
        <span v-for="(count, tier) in counts" :key="tier">{{ tier }} 档 {{ count }} 个 </span>
      </p>
      <p>档位经 dict 绑定映射到字号与配色，0 档强制显示标签</p>
    </div>
  </SigmaControls>
</template>
