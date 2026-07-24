<script setup lang="ts">
import { useSigmaCamera } from '../../composables/use-sigma-camera'

defineOptions({ name: 'SigmaZoomControl', inheritAttrs: false })

const props = withDefaults(defineProps<{
  /**
   * 每次缩放的倍数
   * @defaultValue 1.5
   */
  factor?: number
  /**
   * 缩放动画时长，单位毫秒
   * @defaultValue 200
   */
  duration?: number
  /**
   * 是否显示复位按钮
   * @defaultValue true
   */
  reset?: boolean
  /**
   * 无障碍标签，依次为放大、缩小、复位
   * @defaultValue `['放大', '缩小', '复位']`
   */
  labels?: [string, string, string]
}>(), {
  factor: 1.5,
  duration: 200,
  reset: true,
  labels: () => ['放大', '缩小', '复位']
})

const camera = useSigmaCamera()

function animateOptions() {
  return { factor: props.factor, duration: props.duration }
}
</script>

<template>
  <div
    class="sigma-control-group"
    v-bind="$attrs"
  >
    <button
      type="button"
      class="sigma-control-button"
      :aria-label="labels[0]"
      :title="labels[0]"
      @click="camera.zoomIn(animateOptions())"
    >
      <slot name="zoom-in">
        +
      </slot>
    </button>

    <button
      type="button"
      class="sigma-control-button"
      :aria-label="labels[1]"
      :title="labels[1]"
      @click="camera.zoomOut(animateOptions())"
    >
      <slot name="zoom-out">
        −
      </slot>
    </button>

    <button
      v-if="reset"
      type="button"
      class="sigma-control-button"
      :aria-label="labels[2]"
      :title="labels[2]"
      @click="camera.reset({ duration })"
    >
      <slot name="reset">
        ⤢
      </slot>
    </button>
  </div>
</template>
