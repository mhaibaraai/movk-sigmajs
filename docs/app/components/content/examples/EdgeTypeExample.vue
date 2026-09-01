<script setup lang="ts">
import type { StylesDeclaration } from 'sigma/types'

const { data } = await useFetch('/api/relations.json')

/**
 * path/head 与节点的 shape 走同一套 attribute-dict 绑定：primitives 注册可用的
 * path/extremity 名字，styles 按边的 kind 属性选取，数据决定每条边用哪种线型
 */
const primitives = defineSigmaPrimitives(async () => {
  const { pathLine, pathCurved, pathStep, pathLoop, extremityArrow, extremityCircle } = await import('sigma/rendering')

  return {
    edges: {
      paths: [pathLine(), pathCurved(), pathStep(), pathLoop()],
      extremities: [extremityArrow(), extremityCircle()]
    }
  }
})

const styles: StylesDeclaration = {
  nodes: {
    color: '#64748b',
    size: 14
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
