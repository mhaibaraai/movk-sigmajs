<script setup lang="ts">
import type { StylesDeclaration } from 'sigma/types'

const { data } = await useFetch('/api/relations.json')

/**
 * primitives 注册可用的 shape / path / extremity 名字，styles 再按数据属性选取，
 * 两者走同一套 attribute-dict 绑定
 */
const primitives = defineSigmaPrimitives(async () => {
  const { sdfCircle, layerFill, pathLine, pathCurved, pathStep, pathLoop, extremityArrow, extremityCircle } = await import('sigma/rendering')

  return {
    nodes: {
      shapes: [sdfCircle(), sdfPolygon({ name: 'hexagon', sides: 6 })],
      layers: [layerFill()]
    },
    edges: {
      paths: [pathLine(), pathCurved(), pathStep(), pathLoop()],
      extremities: [extremityArrow(), extremityCircle()]
    }
  }
})

const styles: StylesDeclaration = {
  nodes: {
    shape: { attribute: 'category', dict: { 核心: 'hexagon' }, defaultValue: 'circle' },
    color: { attribute: 'category', dict: { 核心: '#f43f5e', 次要: '#3b82f6', 边缘: '#22c55e' }, defaultValue: '#64748b' },
    size: { attribute: 'category', dict: { 核心: 16, 次要: 14, 边缘: 12 }, defaultValue: 12 }
  },
  edges: {
    path: { attribute: 'kind', dict: { assoc: 'line', flow: 'curved', dependency: 'step' }, defaultValue: 'line' },
    head: { attribute: 'kind', dict: { flow: 'arrow', dependency: 'circle' }, defaultValue: 'none' },
    // 平行边与自环由这三个字段接管，其余边才轮到 path 按 kind 选取
    parallelPath: 'curved',
    parallelSpread: 3,
    selfLoopPath: 'loop'
  }
}
</script>

<template>
  <SigmaGraph
    :data="data"
    :primitives="primitives"
    :styles="styles"
    :settings="{ renderEdgeLabels: true }"
  />
</template>
