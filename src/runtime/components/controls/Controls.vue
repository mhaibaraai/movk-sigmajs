<script setup lang="ts">
defineOptions({ name: 'SigmaControls', inheritAttrs: false })

withDefaults(defineProps<{
  /**
   * 停靠位，语序为「纵向-横向」，四角之外还有四条边的中点
   * @defaultValue 'bottom-right'
   */
  position?:
    | 'top-left' | 'top-center' | 'top-right'
    | 'middle-left' | 'middle-right'
    | 'bottom-left' | 'bottom-center' | 'bottom-right'
  /**
   * 内部控件的排布方向，reverse 变体会连同控件组内部一起翻转
   * @defaultValue 'vertical'
   */
  direction?: 'vertical' | 'vertical-reverse' | 'horizontal' | 'horizontal-reverse'
}>(), {
  position: 'bottom-right',
  direction: 'vertical'
})
</script>

<template>
  <div
    class="sigma-controls"
    :data-position="position"
    :data-direction="direction"
    v-bind="$attrs"
  >
    <slot />
  </div>
</template>
