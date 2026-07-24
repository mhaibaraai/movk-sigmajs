<script setup lang="ts">
defineOptions({ name: 'SigmaControls', inheritAttrs: false })

withDefaults(defineProps<{
  /**
   * 停靠角
   * @defaultValue 'bottom-right'
   */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  /**
   * 内部控件的排布方向
   * @defaultValue 'vertical'
   */
  direction?: 'vertical' | 'horizontal'
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
