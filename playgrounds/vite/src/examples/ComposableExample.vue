<script setup lang="ts">
/**
 * composable 自动导入 + 可选 peer 动态加载：
 * `useSigmaLayout` 走 graphology-layout-forceatlas2，`useSigmaExport` 走 @sigma/export-image，
 * 两者都未显式 import，由 `@movk/sigma/vite` 扫描 runtime 目录得到
 */
import { graphData } from '../graph-data'
import LayoutPanel from './LayoutPanel.vue'
</script>

<template>
  <SigmaGraph
    class="canvas"
    :data="graphData()"
  >
    <SigmaControls position="top-right">
      <LayoutPanel />
    </SigmaControls>
  </SigmaGraph>
</template>
