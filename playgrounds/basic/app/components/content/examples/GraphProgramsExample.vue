<script setup lang="ts">
/**
 * `@sigma/*` 程序包与 sigma 本体一样在模块顶层读 WebGL 全局，
 * 静态 import 会让 SSR 直接 ReferenceError，写成 Promise 也不行——那同样在服务端求值。
 * defineSigmaProgram 声明「用到时才加载」，组件会在建实例前把它们解析完。
 */
const programs = {
  node: {
    border: defineSigmaProgram(() =>
      import('@sigma/node-border').then(m => m.createNodeBorderProgram({
        borders: [
          { size: { value: 0.1 }, color: { attribute: 'borderColor', defaultValue: '#3b82f6' } },
          { size: { fill: true }, color: { attribute: 'color' } }
        ]
      }))
    )
  },
  edge: {
    curved: defineSigmaProgram(() => import('@sigma/edge-curve').then(m => m.default)),
    straight: defineSigmaProgram(() => import('sigma/rendering').then(m => m.EdgeRectangleProgram))
  }
}

const data = {
  attributes: {},
  options: { type: 'mixed' as const, multi: true, allowSelfLoops: true },
  nodes: [
    { key: 'a', attributes: { label: '带描边 A', x: 0, y: 0, size: 16, color: '#f43f5e', borderColor: '#7f1d1d' } },
    { key: 'b', attributes: { label: '带描边 B', x: 14, y: 5, size: 14, color: '#3b82f6', borderColor: '#1e3a8a' } },
    { key: 'c', attributes: { label: '带描边 C', x: 7, y: -9, size: 12, color: '#22c55e', borderColor: '#14532d' } }
  ],
  edges: [
    { source: 'a', target: 'b', attributes: { label: '曲线边', type: 'curved', curvature: 0.4 } },
    { source: 'a', target: 'b', attributes: { label: '直线边', type: 'straight' } },
    { source: 'b', target: 'c', attributes: { label: '曲线边', type: 'curved', curvature: 0.3 } }
  ]
}
</script>

<template>
  <SigmaGraph
    :data="data"
    :programs="programs"
    :settings="{ renderEdgeLabels: true, defaultNodeType: 'border', defaultEdgeType: 'straight' }"
  >
    <div class="demo-panel" data-at="top-left">
      <span class="demo-tag">节点走 @sigma/node-border，边同时用到 edge-curve 与内置直线程序</span>
      <span class="demo-tag">三个程序都由 defineSigmaProgram 延迟加载，SSR 阶段不求值</span>
    </div>
  </SigmaGraph>
</template>
