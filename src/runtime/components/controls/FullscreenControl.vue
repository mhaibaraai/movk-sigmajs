<script setup lang="ts">
import { useFullscreen } from '@vueuse/core'
import { computed, shallowRef, useTemplateRef, onMounted } from 'vue'

defineOptions({ name: 'SigmaFullscreenControl', inheritAttrs: false })

const props = withDefaults(defineProps<{
  /**
   * 无障碍标签，依次为进入与退出全屏
   * @defaultValue `['进入全屏', '退出全屏']`
   */
  labels?: [string, string]
}>(), {
  labels: () => ['进入全屏', '退出全屏']
})

const el = useTemplateRef<HTMLButtonElement>('button')
const target = shallowRef<HTMLElement | null>(null)

// 整个 .sigma-root 一起全屏，覆盖层与其他控件才会跟着进去。
// 用 closest 而不是 sigma.getContainer().parentElement，避免依赖根组件的 DOM 结构
onMounted(() => {
  target.value = el.value?.closest<HTMLElement>('.sigma-root') ?? null
})

const { isFullscreen, toggle, isSupported } = useFullscreen(target)

const label = computed(() => (isFullscreen.value ? props.labels[1] : props.labels[0]))
</script>

<template>
  <div
    v-if="isSupported"
    class="sigma-control-group"
    v-bind="$attrs"
  >
    <button
      ref="button"
      type="button"
      class="sigma-control-button"
      :aria-label="label"
      :aria-pressed="isFullscreen"
      :title="label"
      @click="toggle"
    >
      <slot
        :is-fullscreen="isFullscreen"
        name="default"
      >
        {{ isFullscreen ? '⤡' : '⤢' }}
      </slot>
    </button>
  </div>
</template>
