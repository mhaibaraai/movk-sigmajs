<script setup lang="ts">
import type { NodeReducer } from 'sigma/types'

/**
 * 用户经 nodeReducer prop 直接传的归约会被当作链的基座（order 最低）执行，
 * 库注册的在其后叠加，语义明确且不丢失。
 *
 * v4 的 reducer 只能在构造时给定，组件交出的是一对稳定的 dispatcher，
 * 链的增删不会重建实例。
 */
const baseReducer: NodeReducer = (_key, data, attributes) => ({
  size: data.size * 1.4,
  label: `[基座] ${attributes.label}`
})

const data = demoGraph({ nodes: 12, extraEdges: 0 })
</script>

<template>
  <SigmaGraph
    :data="data"
    :node-reducer="baseReducer"
    :settings="{ labelRenderedSizeThreshold: 0 }"
  >
    <ChainReducersPanel />
  </SigmaGraph>
</template>
