<script setup lang="ts">
import Graph from 'graphology'
import type { SigmaNodeBorder } from '@movk/sigma'

/**
 * 形状是与颜色正交的第二个编码维度：类别一多，光靠配色早就分不开了。
 * 节点的 type 属性即 programs.node 的键名，缺省走 defaultNodeType（'circle'）。
 */
const SHAPES = ['circle', 'square', 'diamond', 'hexagon', 'triangle'] as const

const graph = new Graph()
graph.import(demoGraph({ nodes: 16, extraEdges: 1 }))

// 空心环：外圈按类别取色，内部填白
graph.forEachNode((node, attributes) => {
  const index = Number(node.slice(1))
  graph.mergeNodeAttributes(node, {
    type: SHAPES[index % SHAPES.length],
    borderColor: attributes.color,
    color: '#ffffff',
    size: 14
  })
})

const borders: SigmaNodeBorder[] = [
  // pixels 模式：按半径比例算的描边在小节点上只有 1px 出头，会被抗锯齿抹淡
  { size: { value: 2, mode: 'pixels' }, color: { attribute: 'borderColor' } },
  { size: { fill: true }, color: { attribute: 'color' } }
]

// sigma 与 @movk/sigma 的渲染程序都在模块顶层读 WebGL 全局，只能延迟加载
const load = (options: Record<string, unknown>) => defineSigmaProgram(() =>
  import('@movk/sigma/programs/node-shape').then(m => m.createNodeShapeProgram({ borders, ...options }))
)

const programs = {
  node: {
    circle: load({ shape: 'circle' }),
    square: load({ sides: 4 }),
    diamond: load({ sides: 4, rotation: Math.PI / 4 }),
    hexagon: load({ sides: 6 }),
    triangle: load({ sides: 3, rotation: -Math.PI / 2 })
  }
}
</script>

<template>
  <SigmaGraph :graph="graph" :programs="programs" :settings="{ renderEdgeLabels: false }">
    <NodeShapePanel />
  </SigmaGraph>
</template>
