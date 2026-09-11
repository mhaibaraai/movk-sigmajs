<script setup lang="ts">
/**
 * 组件自动导入：`SigmaGraph`、`SigmaControls`、`SigmaZoomControl`、`SigmaFullscreenControl`
 * 均未显式 import，由 `@movk/sigma/vite` 的组件解析器接管。
 * 其中 controls 子目录不进组件名，与 Nuxt 侧 `pathPrefix: false` 一致
 */
import { graphData } from '../graph-data'
</script>

<template>
  <SigmaGraph
    class="canvas"
    :data="graphData()"
  >
    <SigmaControls position="top-right">
      <SigmaZoomControl />
      <SigmaFullscreenControl />
    </SigmaControls>
  </SigmaGraph>
</template>
