<script setup lang="ts">
import type { SigmaStyles } from '@movk/sigma'

const { data } = await useFetch('/api/data.json')

/**
 * sdfPolygon / sdfStar 返回纯数据，可直接写在外层；内置的 sdfCircle 与 layerFill
 * 来自 sigma/rendering，那个模块顶层就读 WebGL 全局，必须延迟到客户端加载
 */
const primitives = defineSigmaPrimitives(async () => {
  const { sdfCircle, layerFill } = await import('sigma/rendering')

  return {
    nodes: {
      shapes: [
        sdfCircle(),
        sdfPolygon({ name: 'square', sides: 4, rotation: Math.PI / 4 }),
        sdfPolygon({ name: 'hexagon', sides: 6 }),
        sdfStar({ name: 'star', points: 5, innerRatio: 0.45 })
      ],
      layers: [layerFill()]
    }
  }
})

// 形状与颜色正交：同一批节点的分类既由配色表达，也由轮廓表达
const styles: SigmaStyles = {
  nodes: {
    shape: { attribute: 'category', dict: { 核心: 'star', 次要: 'hexagon', 边缘: 'square' }, defaultValue: 'circle' },
    size: { attribute: 'size', min: 8, max: 22, minValue: 1, maxValue: 45 }
  }
}
</script>

<template>
  <SigmaGraph :data="data" :primitives="primitives" :styles="styles" :settings="{ renderEdgeLabels: false }">
    <NodeShapePanel />
  </SigmaGraph>
</template>
