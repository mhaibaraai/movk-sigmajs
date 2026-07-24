<script setup lang="ts">
/**
 * 控件外观全部交给 Nuxt UI 接管。
 *
 * 库只提供行为与无障碍结构：按钮的 aria-label、aria-pressed、焦点顺序都还在，
 * 换掉的只是图标与视觉。右上是原样外观，右下是接管后的。
 */
const data = {
  attributes: {},
  options: { type: 'mixed' as const, multi: false, allowSelfLoops: true },
  nodes: [
    { key: 'a', attributes: { label: '管理制度', x: 0, y: 0, size: 16, color: '#f43f5e' } },
    { key: 'b', attributes: { label: '技术标准', x: 16, y: 6, size: 13, color: '#3b82f6' } },
    { key: 'c', attributes: { label: '操作规程', x: 8, y: -10, size: 13, color: '#22c55e' } }
  ],
  edges: [
    { source: 'a', target: 'b' },
    { source: 'a', target: 'c' }
  ]
}
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaControls position="top-right">
      <SigmaZoomControl />
      <SigmaFullscreenControl />
    </SigmaControls>

    <SigmaControls position="bottom-right">
      <SigmaZoomControl>
        <template #zoom-in>
          <UIcon name="i-lucide-zoom-in" class="size-4" />
        </template>
        <template #zoom-out>
          <UIcon name="i-lucide-zoom-out" class="size-4" />
        </template>
        <template #reset>
          <UIcon name="i-lucide-locate-fixed" class="size-4" />
        </template>
      </SigmaZoomControl>

      <SigmaFullscreenControl>
        <template #default="{ isFullscreen }">
          <UIcon :name="isFullscreen ? 'i-lucide-minimize' : 'i-lucide-maximize'" class="size-4" />
        </template>
      </SigmaFullscreenControl>
    </SigmaControls>

    <!-- 小地图是 canvas 绘制、没有插槽，正好留它验证 CSS 变量在深色下的表现 -->
    <SigmaControls position="bottom-left">
      <SigmaMiniMap />
    </SigmaControls>
  </SigmaGraph>
</template>
