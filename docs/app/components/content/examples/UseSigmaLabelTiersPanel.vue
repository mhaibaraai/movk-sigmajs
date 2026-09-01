<script setup lang="ts">
import type { SigmaLabelTierBreakpoint } from '@movk/sigma'

const props = defineProps<{ breakpoints: readonly SigmaLabelTierBreakpoint[] }>()

const { tier } = useSigmaLabelTiers({ breakpoints: props.breakpoints })
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

    <div class="bg-accented p-2 text-muted text-xs">
      {{ label }}
    </div>
  </SigmaControls>
</template>
