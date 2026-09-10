<script setup lang="ts">
const { tier } = useSigmaLabelTiers({ breakpoints: [[2.6, 0], [1.3, 1]] })
const { zoomIn, zoomOut, reset } = useSigmaCamera()

const label = computed(() =>
  Number.isFinite(tier.value) ? `只显示 ${tier.value} 档及以上` : '不限制，全部标签可见'
)
</script>

<template>
  <SigmaControls>
    <div class="flex gap-1">
      <UButton size="xs" color="neutral" label="拉远" @click="zoomOut()" />
      <UButton size="xs" color="neutral" label="拉近" @click="zoomIn()" />
      <UButton size="xs" color="neutral" label="复位" @click="reset()" />
    </div>

    <div class="bg-accented text-muted p-2 text-xs">
      {{ label }}
    </div>
  </SigmaControls>
</template>
