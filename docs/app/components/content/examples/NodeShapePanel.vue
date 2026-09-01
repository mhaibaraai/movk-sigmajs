<script setup lang="ts">
const { goto } = useSigmaCamera()

const rotated = shallowRef(false)

function toggle() {
  rotated.value = !rotated.value
  goto({ angle: rotated.value ? Math.PI / 5 : 0 }, { duration: 300 })
}
</script>

<template>
  <SigmaControls>
    <div class="flex gap-1">
      <UBadge size="sm" color="neutral" variant="subtle" label="核心 · star" />
      <UBadge size="sm" color="neutral" variant="subtle" label="次要 · hexagon" />
      <UBadge size="sm" color="neutral" variant="subtle" label="边缘 · square" />
    </div>

    <div class="flex gap-1">
      <UButton size="xs" color="neutral" :label="rotated ? '转回正视' : '旋转相机'" @click="toggle" />
    </div>

    <div class="bg-accented p-2 text-muted text-xs">
      size 是外接圆半径，inradiusFactor 决定标签让位的距离
    </div>
  </SigmaControls>
</template>
