<script setup lang="ts">
import Graph from 'graphology'
import { computed, shallowRef } from 'vue'

/**
 * 大图概览抽样：按度数取前 N 个节点，连同两端都入选的边。
 *
 * 万级节点一次性渲染既慢又看不清，先展示枢纽，再由
 * useSigmaNeighborhood().expand() 按需补齐。基于 graph.export() 过滤，
 * 图级 attributes 与 options 原样保留，结果可直接喂给 SigmaGraph 的 data。
 */
const full = new Graph()
full.import(createScaleGraph(1000))

const size = shallowRef(80)
const sampled = computed(() => sampleGraph(full, size.value))
</script>

<template>
  <SigmaGraph :data="sampled" :settings="{ labelRenderedSizeThreshold: 6 }">
    <div class="demo-panel" data-at="top-left">
      <div class="demo-row">
        <span class="demo-label">抽样</span>
        <button v-for="value in [40, 80, 200, 1000]" :key="value" type="button" :aria-pressed="size === value" @click="size = value">
          {{ value }}
        </button>
      </div>
      <span class="demo-tag">原图 {{ full.order }} 节点 / {{ full.size }} 边 → 概览 {{ sampled.nodes.length }} / {{ sampled.edges.length }}</span>
      <span class="demo-tag">抽样按度数排序，留下的都是枢纽；size 不小于节点总数时原样返回</span>
    </div>
  </SigmaGraph>
</template>
