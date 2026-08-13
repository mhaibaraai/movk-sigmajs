<script setup lang="ts">
import { useResizeObserver } from '@vueuse/core'
import { onMounted, shallowRef, useTemplateRef } from 'vue'
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

/**
 * 全程使用 framed 坐标：`getNodeDisplayData` 返回的是它，相机的 x / y 也是它，
 * 于是画点、画视口框、点击回写三者同在一个坐标系里，不必来回转换。
 */
const { sigma, isNodeFilteredOut } = useSigma()
const canvasRef = useTemplateRef<HTMLCanvasElement>('canvas')
const rootRef = useTemplateRef<HTMLDivElement>('root')

/** 全图在 framed 坐标系下的包围盒 */
interface Extent {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

const extent = shallowRef<Extent | null>(null)
let frame = 0

function computeExtent(): Extent | null {
  const instance = sigma.value
  if (!instance) {
    return null
  }

  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  let found = false

  instance.getGraph().forEachNode((key) => {
    const display = instance.getNodeDisplayData(key)
    // 同 draw() 里的过滤检查，见下方注释
    if (!display || display.visibility === 'hidden' || isNodeFilteredOut(key)) {
      return
    }
    found = true
    minX = Math.min(minX, display.x)
    maxX = Math.max(maxX, display.x)
    minY = Math.min(minY, display.y)
    maxY = Math.max(maxY, display.y)
  })

  if (!found) {
    return null
  }

  // 单点或共线时给一个最小跨度，避免除零
  const spanX = maxX - minX || 1
  const spanY = maxY - minY || 1

  return { minX, maxX: minX + spanX, minY, maxY: minY + spanY }
}

/**
 * 把 framed 坐标等比缩放并居中到缩略图画布上。
 * 一并返回 `scale` 与偏移量，供点击时做逆运算，两处共用同一套参数才不会错位。
 */
function project(point: { x: number, y: number }, box: Extent, width: number, height: number) {
  const inner = props.padding
  const scale = Math.min(
    (width - inner * 2) / (box.maxX - box.minX),
    (height - inner * 2) / (box.maxY - box.minY)
  )
  const offsetX = (width - (box.maxX - box.minX) * scale) / 2
  const offsetY = (height - (box.maxY - box.minY) * scale) / 2

  return {
    x: (point.x - box.minX) * scale + offsetX,
    y: (point.y - box.minY) * scale + offsetY,
    scale,
    offsetX,
    offsetY
  }
}

function draw() {
  const instance = sigma.value
  const canvas = canvasRef.value
  if (!instance || !canvas) {
    return
  }

  const box = computeExtent()
  extent.value = box
  const context = canvas.getContext('2d')
  if (!context || !box) {
    context?.clearRect(0, 0, canvas.width, canvas.height)
    return
  }

  const ratio = window.devicePixelRatio || 1
  const width = canvas.clientWidth
  const height = canvas.clientHeight

  if (canvas.width !== width * ratio || canvas.height !== height * ratio) {
    canvas.width = width * ratio
    canvas.height = height * ratio
  }

  context.setTransform(ratio, 0, 0, ratio, 0, 0)
  context.clearRect(0, 0, width, height)

  const styles = getComputedStyle(canvas)
  const nodeColor = styles.getPropertyValue('--sigma-minimap-node').trim() || '#888'
  const viewportColor = styles.getPropertyValue('--sigma-minimap-viewport').trim() || '#3b82f6'

  context.fillStyle = nodeColor
  instance.getGraph().forEachNode((key) => {
    const display = instance.getNodeDisplayData(key)
    // useSigmaFilter 的过滤态节点靠透明化表达隐藏，不会让 visibility 变化，
    // 必须单独查 isNodeFilteredOut，否则过滤后节点会继续画进缩略图
    if (!display || display.visibility === 'hidden' || isNodeFilteredOut(key)) {
      return
    }
    const point = project(display, box, width, height)
    context.beginPath()
    context.arc(point.x, point.y, props.nodeRadius, 0, Math.PI * 2)
    context.fill()
  })

  const { width: viewWidth, height: viewHeight } = instance.getDimensions()
  const topLeft = project(instance.viewportToFramedGraph({ x: 0, y: 0 }), box, width, height)
  const bottomRight = project(
    instance.viewportToFramedGraph({ x: viewWidth, y: viewHeight }),
    box,
    width,
    height
  )

  context.strokeStyle = viewportColor
  context.lineWidth = 1
  context.strokeRect(
    topLeft.x,
    topLeft.y,
    bottomRight.x - topLeft.x,
    bottomRight.y - topLeft.y
  )
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
onMounted(scheduleDraw)

function moveTo(event: MouseEvent) {
  const instance = sigma.value
  const canvas = canvasRef.value
  const box = extent.value

  if (!props.clickToMove || !instance || !canvas || !box) {
    return
  }

  const rect = canvas.getBoundingClientRect()
  const width = canvas.clientWidth
  const height = canvas.clientHeight
  const origin = project({ x: box.minX, y: box.minY }, box, width, height)

  // project 的逆运算：屏幕像素回到 framed 坐标，正是相机 x / y 所在的坐标系
  instance.getCamera().animate(
    {
      x: (event.clientX - rect.left - origin.x) / origin.scale + box.minX,
      y: (event.clientY - rect.top - origin.y) / origin.scale + box.minY
    },
    { duration: props.duration }
  )
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
