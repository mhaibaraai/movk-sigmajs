<script setup lang="ts">
import { useResizeObserver } from '@vueuse/core'
import { onMounted, shallowRef, useTemplateRef, watch } from 'vue'
import type { MinimapProjection, SigmaMatrixUtils } from '../../utils/minimap-projection'
import { createMinimapProjection } from '../../utils/minimap-projection'
import { useSigma } from '../../composables/use-sigma'
import { useSigmaEvents } from '../../composables/use-sigma-events'

defineOptions({ name: 'SigmaMiniMap', inheritAttrs: false })

const props = withDefaults(defineProps<{
  /**
   * 节点在缩略图上的半径，单位像素
   * @defaultValue 1.5
   */
  nodeRadius?: number
  /**
   * 图内容与缩略图边缘的留白，单位像素
   * @defaultValue 6
   */
  padding?: number
  /**
   * 点击缩略图把相机移动到对应位置
   * @defaultValue true
   */
  clickToMove?: boolean
  /**
   * 相机移动动画时长，单位毫秒
   * @defaultValue 300
   */
  duration?: number
}>(), {
  nodeRadius: 1.5,
  padding: 6,
  clickToMove: true,
  duration: 300
})

const { sigma } = useSigma()
const canvasRef = useTemplateRef<HTMLCanvasElement>('canvas')
const rootRef = useTemplateRef<HTMLDivElement>('root')

/** sigma 的矩阵工具和实例一样只在客户端加载 */
const matrixUtils = shallowRef<SigmaMatrixUtils | null>(null)
/** 绘制时建立、点击时复用，画和点始终共用同一套投影参数 */
const projection = shallowRef<MinimapProjection | null>(null)
let frame = 0

function draw() {
  const instance = sigma.value
  const canvas = canvasRef.value
  const utils = matrixUtils.value
  if (!instance || !canvas || !utils) {
    return
  }

  const ratio = window.devicePixelRatio || 1
  const width = canvas.clientWidth
  const height = canvas.clientHeight

  if (canvas.width !== width * ratio || canvas.height !== height * ratio) {
    canvas.width = width * ratio
    canvas.height = height * ratio
  }

  // 先建投影再取上下文：拿不到 2D 上下文时点击依然可用
  const project = createMinimapProjection(
    utils,
    { width, height },
    instance.getGraphDimensions(),
    props.padding
  )
  projection.value = project

  const context = canvas.getContext('2d')
  if (!context) {
    return
  }

  context.setTransform(ratio, 0, 0, ratio, 0, 0)
  context.clearRect(0, 0, width, height)

  const styles = getComputedStyle(canvas)
  const nodeColor = styles.getPropertyValue('--sigma-minimap-node').trim() || '#888'
  const viewportColor = styles.getPropertyValue('--sigma-minimap-viewport').trim() || '#3b82f6'

  context.fillStyle = nodeColor
  let hasVisibleNode = false
  instance.getGraph().forEachNode((key) => {
    const display = instance.getNodeDisplayData(key)
    if (!display || display.visibility === 'hidden') {
      return
    }
    hasVisibleNode = true
    const point = project.toCanvas(display)
    context.beginPath()
    context.arc(point.x, point.y, props.nodeRadius, 0, Math.PI * 2)
    context.fill()
  })

  if (!hasVisibleNode) {
    return
  }

  const { width: viewWidth, height: viewHeight } = instance.getDimensions()
  const first = project.toCanvas(instance.viewportToFramedGraph({ x: 0, y: 0 }))
  const second = project.toCanvas(instance.viewportToFramedGraph({ x: viewWidth, y: viewHeight }))
  const left = Math.min(first.x, second.x)
  const top = Math.min(first.y, second.y)
  const right = Math.max(first.x, second.x)
  const bottom = Math.max(first.y, second.y)

  // 视野已装下整张图，画出来只会是贴着边框的一圈，不如不画
  if (left <= 0 && top <= 0 && right >= width && bottom >= height) {
    return
  }

  context.strokeStyle = viewportColor
  context.lineWidth = 1
  context.strokeRect(left, top, right - left, bottom - top)
}

function scheduleDraw() {
  if (frame) {
    return
  }
  frame = requestAnimationFrame(() => {
    frame = 0
    draw()
  })
}

// 相机移动、图变更、容器缩放都会触发重绘，跟着重绘走即可
useSigmaEvents({ afterRender: scheduleDraw })

useResizeObserver(rootRef, scheduleDraw)
// 绘制参数只在 draw 里读，改了不重绘就看不到变化
watch(() => [props.nodeRadius, props.padding], scheduleDraw)

onMounted(async () => {
  matrixUtils.value = await import('sigma/utils')
  scheduleDraw()
})

function moveTo(event: MouseEvent) {
  const instance = sigma.value
  const canvas = canvasRef.value
  const project = projection.value

  if (!props.clickToMove || !instance || !canvas || !project) {
    return
  }

  const rect = canvas.getBoundingClientRect()
  // 逆运算把画布像素送回 framed 坐标，正是相机 x / y 所在的坐标系
  const target = project.toFramed({
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  })

  instance.getCamera().animate(target, { duration: props.duration })
}
</script>

<template>
  <div
    ref="root"
    class="sigma-minimap"
    v-bind="$attrs"
    @click="moveTo"
  >
    <canvas ref="canvas" />
  </div>
</template>
