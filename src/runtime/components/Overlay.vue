<script setup lang="ts">
import { shallowRef, watch } from 'vue'
import type { Coordinates } from 'sigma/types'
import { useSigma } from '../composables/use-sigma'
import { useSigmaEvents } from '../composables/use-sigma-events'

defineOptions({ name: 'SigmaOverlay', inheritAttrs: false })

const props = withDefaults(defineProps<{
  /** 锚定到该节点，节点被隐藏或不存在时自动隐藏 */
  node?: string
  /** 锚定到图坐标，与 `node` 二选一 */
  position?: Coordinates
  /**
   * 相对锚点的像素偏移 `[x, y]`
   * @defaultValue `[0, 0]`
   */
  offset?: [number, number]
  /**
   * 是否显示
   * @defaultValue true
   */
  visible?: boolean
}>(), {
  offset: () => [0, 0],
  visible: true
})

const { sigma, isNodeFilteredOut } = useSigma()
const hidden = shallowRef(true)
const transform = shallowRef('')

function update() {
  const instance = sigma.value

  if (!instance || !props.visible) {
    hidden.value = true
    return
  }

  let viewport: Coordinates | null = null

  if (props.node !== undefined) {
    const display = instance.getNodeDisplayData(props.node)
    // display.visibility === 'hidden' 服务的是 useSigmaState().setNodeState 那条独立
    // 隐藏路径；useSigmaFilter 的过滤态节点靠透明化表达，不会让 visibility 变化，
    // 必须单独查 isNodeFilteredOut，否则过滤后覆盖层会继续锚定在原位置显示
    if (!display || display.visibility === 'hidden' || isNodeFilteredOut(props.node)) {
      hidden.value = true
      return
    }
    // 节点的显示坐标已被 sigma 归一化，必须走 framed 换算，与 sigma 自身定位标签的方式一致
    viewport = instance.framedGraphToViewport(display)
  }
  else if (props.position) {
    viewport = instance.graphToViewport(props.position)
  }

  if (!viewport) {
    hidden.value = true
    return
  }

  const [offsetX, offsetY] = props.offset
  transform.value = `translate(${viewport.x + offsetX}px, ${viewport.y + offsetY}px)`
  hidden.value = false
}

// 相机移动、图变更、容器缩放都会触发重绘，跟着重绘同步位置即可覆盖全部情况
useSigmaEvents({ afterRender: update })

watch(
  [sigma, () => props.node, () => props.position, () => props.visible, () => props.offset],
  update,
  { immediate: true, deep: true }
)
</script>

<template>
  <div
    v-show="!hidden"
    class="sigma-overlay"
    :style="{ transform }"
    v-bind="$attrs"
  >
    <slot />
  </div>
</template>
