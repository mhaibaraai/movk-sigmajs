<script setup lang="ts">
/**
 * 全局默认 settings 的对照：`main.ts` 里经 `SigmaPlugin` 注入了
 * `renderEdgeLabels` 与 `labelDensity`，这里只覆盖 `labelDensity`，
 * 读数用来确认未覆盖的键仍从全局兜底
 */
import { graphData } from '../graph-data'
import SettingsPanel from './SettingsPanel.vue'
</script>

<template>
  <SigmaGraph
    class="canvas"
    :data="graphData()"
    :settings="{ labelDensity: 1 }"
  >
    <SigmaControls position="top-right">
      <SettingsPanel />
    </SigmaControls>
  </SigmaGraph>
</template>
