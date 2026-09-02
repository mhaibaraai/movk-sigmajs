<script setup lang="ts">
import type { SDFShape } from 'sigma/rendering'
import type { SerializedGraph } from 'graphology-types'

// heart SDF 改自 Inigo Quilez 的 2D distance functions
// 尖端在原点，整体向上延伸到约 y=1，所以要下移 0.5 让心形居中于节点原点，再缩小 0.7 留出抗锯齿边距
const HEART_SCALE = 0.7
const HEART_Y_CENTER = 0.5

function sdfHeart(): SDFShape {
  const glsl = /* glsl */ `
float dot2_heart(vec2 v) { return dot(v, v); }

float sdf_heart(vec2 uv, float size) {
  float scale = ${HEART_SCALE.toFixed(4)};
  vec2 p = uv / (size * scale);
  p.y += ${HEART_Y_CENTER.toFixed(4)};
  p.x = abs(p.x);

  float d;
  if (p.y + p.x > 1.0) {
    d = sqrt(dot2_heart(p - vec2(0.25, 0.75))) - sqrt(2.0) / 4.0;
  } else {
    d = sqrt(min(dot2_heart(p - vec2(0.0, 1.0)), dot2_heart(p - 0.5 * max(p.x + p.y, 0.0)))) * sign(p.x - p.y);
  }

  return d * size * scale;
}
`

  return {
    name: 'heart',
    glsl,
    uniforms: [],
    inradiusFactor: 0.5
  }
}

// 内置工厂只能在这里按需加载：sigma 在模块顶层就读 WebGL2RenderingContext
const primitives = defineSigmaPrimitives(async () => {
  const { sdfCircle, layerFill } = await import('sigma/rendering')

  return {
    nodes: {
      shapes: [sdfCircle(), sdfHeart()],
      layers: [layerFill()]
    }
  }
})

const styles = {
  nodes: {
    shape: { attribute: 'shape', defaultValue: 'circle' }
  }
}

const data: SerializedGraph = {
  attributes: {},
  options: { type: 'mixed', multi: false, allowSelfLoops: true },
  nodes: [
    { key: 'a', attributes: { label: 'A', x: 0, y: 0, size: 20, color: '#e22653' } },
    { key: 'b', attributes: { label: 'B', x: 100, y: -100, size: 40, color: '#e28b53', shape: 'heart' } },
    { key: 'c', attributes: { label: 'C', x: 300, y: -200, size: 20, color: '#9be225', shape: 'heart' } },
    { key: 'd', attributes: { label: 'D', x: 100, y: -300, size: 20, color: '#53a4e2', shape: 'heart' } },
    { key: 'e', attributes: { label: 'E', x: 300, y: -400, size: 40, color: '#7553e2', shape: 'heart' } },
    { key: 'f', attributes: { label: 'F', x: 400, y: -500, size: 20, color: '#e253d5', shape: 'heart' } }
  ],
  edges: [
    { source: 'a', target: 'b', attributes: { size: 10 } },
    { source: 'b', target: 'c', attributes: { size: 10 } },
    { source: 'b', target: 'd', attributes: { size: 10 } },
    { source: 'c', target: 'e', attributes: { size: 10 } },
    { source: 'd', target: 'e', attributes: { size: 10 } },
    { source: 'f', target: 'e', attributes: { size: 10 } }
  ]
}
</script>

<template>
  <SigmaGraph :data="data" :primitives="primitives" :styles="styles" />
</template>
