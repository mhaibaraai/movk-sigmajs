<script setup lang="ts">
import type { StylesDeclaration } from 'sigma/types'

const { data } = await useFetch('/api/relations.json')

const primitives = defineSigmaPrimitives(async () => {
  const { sdfCircle, layerFill, pathLine, pathCurved, pathLoop, extremityArrow } = await import('sigma/rendering')

  return {
    nodes: {
      shapes: [sdfCircle(), sdfPolygon({ name: 'hexagon', sides: 6 })],
      layers: [layerFill()]
    },
    edges: {
      paths: [pathLine(), pathCurved(), pathLoop()],
      extremities: [extremityArrow()]
    }
  }
})

const styles: StylesDeclaration = {
  nodes: {
    shape: { attribute: 'category', dict: { 核心: 'hexagon', 次要: 'hexagon' }, defaultValue: 'circle' },
    color: { attribute: 'category', dict: { 核心: '#f43f5e', 次要: '#3b82f6', 边缘: '#22c55e' }, defaultValue: '#64748b' },
    size: { attribute: 'category', dict: { 核心: 16, 次要: 14, 边缘: 12 }, defaultValue: 12 }
  },
  edges: {
    parallelPath: 'curved',
    parallelSpread: 3,
    selfLoopPath: 'loop',
    head: 'arrow'
  }
}
</script>

<template>
  <SigmaGraph
    :data="data"
    :primitives="primitives"
    :styles="styles"
  />
</template>
