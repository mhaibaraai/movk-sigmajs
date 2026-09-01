<script setup lang="ts">
import type { StylesDeclaration } from 'sigma/types'

/**
 * path/head 与节点的 shape 走同一套 attribute-dict 绑定：primitives 注册可用的
 * path/extremity 名字，styles 按边的 kind 属性选取，数据决定每条边用哪种线型
 */
const primitives = defineSigmaPrimitives(async () => {
  const { pathLine, pathCurved, pathStep, extremityArrow, extremityCircle } = await import('sigma/rendering')

  return {
    edges: {
      paths: [pathLine(), pathCurved(), pathStep()],
      extremities: [extremityArrow(), extremityCircle()]
    }
  }
})

const styles: StylesDeclaration = {
  edges: {
    path: { attribute: 'kind', dict: { assoc: 'line', flow: 'curved', dependency: 'step' }, defaultValue: 'line' },
    head: { attribute: 'kind', dict: { flow: 'arrow', dependency: 'circle' }, defaultValue: 'none' }
  }
}

const data = {
  attributes: {},
  options: { type: 'directed' as const, multi: false, allowSelfLoops: false },
  nodes: [
    { key: 'a', attributes: { label: '节点 A', x: 0, y: -180, size: 14, color: '#64748b' } },
    { key: 'b', attributes: { label: '节点 B', x: 170, y: -60, size: 14, color: '#64748b' } },
    { key: 'c', attributes: { label: '节点 C', x: 105, y: 145, size: 14, color: '#64748b' } },
    { key: 'd', attributes: { label: '节点 D', x: -105, y: 145, size: 14, color: '#64748b' } },
    { key: 'e', attributes: { label: '节点 E', x: -170, y: -60, size: 14, color: '#64748b' } }
  ],
  edges: [
    { source: 'a', target: 'b', attributes: { kind: 'assoc', label: '关联' } },
    { source: 'b', target: 'c', attributes: { kind: 'flow', label: '流向' } },
    { source: 'c', target: 'd', attributes: { kind: 'dependency', label: '依赖' } },
    { source: 'd', target: 'e', attributes: { kind: 'flow', label: '流向' } },
    { source: 'e', target: 'a', attributes: { kind: 'assoc', label: '关联' } }
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
    <EdgeTypePanel />
  </SigmaGraph>
</template>
