<script setup lang="ts">
import type { SigmaStyles } from '@movk/sigma'

const { data } = await useFetch('/api/data.json')

const graphRef = useTemplateRef('graph')

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

const styles: SigmaStyles = {
  nodes: {
    shape: { attribute: 'category', dict: { 核心: 'star', 次要: 'hexagon', 边缘: 'square' }, defaultValue: 'circle' },
    size: { attribute: 'size', min: 8, max: 22, minValue: 1, maxValue: 45 }
  }
}

const rotated = shallowRef(false)

function toggle() {
  rotated.value = !rotated.value
  graphRef.value?.sigma?.getCamera().animate({ angle: rotated.value ? Math.PI / 5 : 0 }, { duration: 300 })
}
</script>

<template>
  <SigmaGraph
    ref="graph"
    :data="data"
    :primitives="primitives"
    :styles="styles"
    :settings="{ renderEdgeLabels: false }"
  >
    <SigmaControls>
      <UButton size="xs" color="neutral" :label="rotated ? '转回正视' : '旋转相机'" @click="toggle" />
    </SigmaControls>
  </SigmaGraph>
</template>
