<script setup lang="ts">
/**
 * 具名导入路径：不接自动导入也能用，组件与 composable 全部来自 `@movk/sigma/vue`。
 * 面向不想引入 unplugin、或已有自己一套导入约定的项目
 */
import { SigmaControls, SigmaGraph, SigmaZoomControl } from '@movk/sigma/vue'
import { graphData } from '../graph-data'
import BarrelPanel from './BarrelPanel.vue'
</script>

<template>
  <SigmaGraph
    id="barrel"
    class="canvas"
    :data="graphData()"
  >
    <SigmaControls position="top-right">
      <SigmaZoomControl :reset="false" />
      <BarrelPanel />
    </SigmaControls>
  </SigmaGraph>
</template>
