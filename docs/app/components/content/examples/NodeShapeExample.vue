<script setup lang="ts">
import Graph from 'graphology'
import type { StylesDeclaration } from 'sigma/types'

/**
 * 形状是与颜色正交的第二个编码维度：类别一多，光靠配色早就分不开了。
 * 节点的 shape 属性对应 primitives.nodes.shapes 里声明的形状名。
 */
const SHAPES = ['circle', 'square', 'diamond', 'hexagon', 'star'] as const

const graph = new Graph()
graph.import(demoGraph({ nodes: 16, extraEdges: 1 }))

graph.forEachNode((node) => {
  const index = Number(node.slice(1))
  graph.setNodeAttribute(node, 'shape', SHAPES[index % SHAPES.length])
})

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
        sdfPolygon({ name: 'diamond', sides: 4 }),
        sdfPolygon({ name: 'hexagon', sides: 6 }),
        sdfStar({ name: 'star', points: 5, innerRatio: 0.45 })
      ],
      layers: [layerFill()]
    }
  }
})

const styles: StylesDeclaration = {
  nodes: [demoNodeStyle, {
    shape: { attribute: 'shape', defaultValue: 'circle' },
    size: 14
  }]
}
</script>

<template>
  <SigmaGraph
    :graph="graph"
    :primitives="primitives"
    :styles="styles"
    :settings="{ renderEdgeLabels: false }"
  >
    <NodeShapePanel />
  </SigmaGraph>
</template>
