<script setup lang="ts">
import type { StylesDeclaration } from 'sigma/types'

/**
 * primitives 声明「有哪些形状与路径可用」，styles 决定「谁用哪个」。
 * 内置的工厂函数来自 sigma/rendering，那个模块顶层就读 WebGL 全局，
 * 必须包在 defineSigmaPrimitives 里延迟到客户端。
 */
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
    shape: { attribute: 'shape', defaultValue: 'circle' },
    size: { attribute: 'size', defaultValue: 12 }
  },
  edges: {
    // 平行边由 sigma 自己编号，只需指定分散用的路径与间距
    parallelPath: 'curved',
    parallelSpread: 3,
    selfLoopPath: 'loop',
    head: 'arrow'
  }
}

const data = {
  attributes: {},
  options: { type: 'directed' as const, multi: true, allowSelfLoops: true },
  nodes: [
    { key: 'a', attributes: { label: '节点 A', x: 0, y: 0, size: 16, color: '#f43f5e', shape: 'hexagon' } },
    { key: 'b', attributes: { label: '节点 B', x: 320, y: 140, size: 14, color: '#3b82f6' } },
    { key: 'c', attributes: { label: '节点 C', x: 160, y: -220, size: 12, color: '#22c55e', shape: 'hexagon' } }
  ],
  edges: [
    { source: 'a', target: 'b', attributes: { label: '关系一' } },
    { source: 'a', target: 'b', attributes: { label: '关系二' } },
    { source: 'a', target: 'b', attributes: { label: '关系三' } },
    { source: 'b', target: 'c', attributes: { label: '单边' } },
    { source: 'c', target: 'c', attributes: { label: '自环' } }
  ]
}
</script>

<template>
  <SigmaGraph
    :data="data"
    :primitives="primitives"
    :styles="styles"
    :settings="{ renderEdgeLabels: true }"
  >
    <div class="demo-panel" data-at="top-left">
      <span class="demo-tag">三条平行边经 parallelPath 自动分散，自环走 loop 路径</span>
      <span class="demo-tag">六边形来自本库的 sdfPolygon，圆形与路径来自 sigma 内置</span>
    </div>
  </SigmaGraph>
</template>
