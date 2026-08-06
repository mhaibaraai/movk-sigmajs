<script setup lang="ts">
/**
 * 缩略图与视口框。
 *
 * 全程使用 framed 坐标——getNodeDisplayData 与相机的 x / y 同在这个坐标系，
 * 画点、画视口框、点击换算三者不必来回转换。
 */
const nodes = Array.from({ length: 40 }, (_, index) => {
  const ring = Math.floor(index / 10)
  const angle = ((index % 10) / 10) * Math.PI * 2
  const radius = 60 + ring * 40
  return {
    key: `n${index}`,
    attributes: {
      label: `节点 ${index}`,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      size: 6,
      color: ['#f43f5e', '#3b82f6', '#22c55e', '#a855f7'][ring]
    }
  }
})

const data = {
  attributes: {},
  options: { type: 'mixed' as const, multi: false, allowSelfLoops: true },
  nodes,
  edges: nodes.slice(1).map((node, index) => ({ source: nodes[index]!.key, target: node.key }))
}
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaControls position="bottom-left">
      <SigmaMiniMap />
    </SigmaControls>

    <SigmaControls position="top-right">
      <SigmaZoomControl />
    </SigmaControls>

    <div class="demo-panel" data-at="top-left">
      <span class="demo-tag">放大后左下角出现视口框，点缩略图任意位置可移动相机</span>
    </div>
  </SigmaGraph>
</template>
