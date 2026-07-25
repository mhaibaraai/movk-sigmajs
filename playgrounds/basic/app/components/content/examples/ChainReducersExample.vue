<script setup lang="ts">
import type { NodeDisplayData } from 'sigma/types'
import type { Attributes } from 'graphology-types'

/**
 * 用户经 settings 直接传的 reducer 会被当作链的基座（order 最低）执行，
 * 库注册的在其后叠加，语义明确且不丢失。
 *
 * 一条运行期约束：直接调 sigma.setSetting('nodeReducer', fn) 会在下一次链重算时
 * 被覆盖，那种场景应改用 useSigmaReducer()。
 */
function baseReducer(_key: string, attributes: Attributes): Partial<NodeDisplayData> {
  return {
    size: (attributes.size ?? 8) * 1.4,
    label: `[基座] ${attributes.label}`
  }
}

const data = demoGraph({ nodes: 12, extraEdges: 0 })
</script>

<template>
  <SigmaGraph :data="data" :settings="{ nodeReducer: baseReducer, labelRenderedSizeThreshold: 0 }">
    <ChainReducersPanel />
  </SigmaGraph>
</template>
