<script setup lang="ts">
/**
 * 覆盖矩阵：34 个公开 API 逐个对到示例。
 * 这一层将来会被 docs 的 content 目录取代，所以刻意不写逻辑。
 */
const groups = [
  {
    title: '组件',
    to: '/graph',
    items: [
      { api: 'SigmaGraph', to: '/graph', examples: ['GraphBasic', 'GraphExternal', 'GraphSettings', 'GraphPrimitives', 'GraphEvents', 'GraphMultiInstance'] },
      { api: 'SigmaOverlay', to: '/overlays', examples: ['OverlayNode', 'OverlayPosition'] },
      { api: 'SigmaTooltip', to: '/overlays', examples: ['Tooltip'] },
      { api: 'SigmaPopover', to: '/overlays', examples: ['Popover'] },
      { api: 'SigmaContextMenu', to: '/overlays', examples: ['ContextMenu'] },
      { api: 'SigmaControls', to: '/controls', examples: ['ControlsPosition', 'ControlsScheme'] },
      { api: 'SigmaZoomControl', to: '/controls', examples: ['ZoomControl'] },
      { api: 'SigmaFullscreenControl', to: '/controls', examples: ['FullscreenControl'] },
      { api: 'SigmaSearchControl', to: '/controls', examples: ['SearchControl'] },
      { api: 'SigmaLegend', to: '/controls', examples: ['Legend'] },
      { api: 'SigmaMiniMap', to: '/controls', examples: ['MiniMap'] }
    ]
  },
  {
    title: 'Composables',
    to: '/core',
    items: [
      { api: 'useSigma', to: '/core', examples: ['UseSigma'] },
      { api: 'useSigmaById / useSigmaIds', to: '/core', examples: ['UseSigmaById'] },
      { api: 'useSigmaGraph', to: '/core', examples: ['UseSigmaGraph'] },
      { api: 'useSigmaEvents', to: '/core', examples: ['UseSigmaEvents'] },
      { api: 'useSigmaSettings', to: '/core', examples: ['UseSigmaSettings'] },
      { api: 'useSigmaSelection', to: '/interaction', examples: ['UseSigmaSelection'] },
      { api: 'useSigmaNeighborhood', to: '/interaction', examples: ['UseSigmaNeighborhood', 'UseSigmaNeighborhoodExpand'] },
      { api: 'useSigmaDrag', to: '/interaction', examples: ['UseSigmaDrag'] },
      { api: 'useSigmaSearch', to: '/interaction', examples: ['UseSigmaSearch'] },
      { api: 'useSigmaFilter', to: '/interaction', examples: ['UseSigmaFilter'] },
      { api: 'useSigmaReducer', to: '/interaction', examples: ['UseSigmaReducer'] },
      { api: 'useSigmaCamera', to: '/interaction', examples: ['UseSigmaCamera'] },
      { api: 'useSigmaLayout', to: '/analysis', examples: ['UseSigmaLayout', 'UseSigmaLayoutWorker'] },
      { api: 'useSigmaMetrics', to: '/analysis', examples: ['UseSigmaMetrics'] },
      { api: 'useSigmaExport', to: '/analysis', examples: ['UseSigmaExport'] }
    ]
  },
  {
    title: '工具函数',
    to: '/utils',
    items: [
      { api: 'applyGraphDiff', to: '/utils', examples: ['ApplyGraphDiff'] },
      { api: 'chainReducers', to: '/utils', examples: ['ChainReducers'] },
      { api: 'sampleGraph', to: '/utils', examples: ['SampleGraph'] },
      { api: 'defineSigmaPrimitives', to: '/graph', examples: ['GraphPrimitives'] }
    ]
  },
  {
    title: '规模与逃生舱',
    to: '/scale',
    items: [
      { api: '1k / 5k / 20k 三档', to: '/scale', examples: ['ScaleTiers'] },
      { api: '渲染侧开关的代价', to: '/scale', examples: ['ScaleSettings'] },
      { api: '概览 + 按需扩展', to: '/scale', examples: ['ScaleOverview'] },
      { api: '布局路径对照', to: '/scale', examples: ['ScaleLayout'] },
      { api: '纯原生逃生舱', to: '/escape-hatch', examples: ['EscapeHatch'] }
    ]
  }
]

const total = groups.reduce((sum, group) => sum + group.items.reduce((n, item) => n + item.examples.length, 0), 0)
</script>

<template>
  <div>
    <h1>@movk/sigma</h1>
    <p class="lead">
      基于 sigma v3 的知识图谱可视化 Nuxt 模块。共 {{ total }} 个示例，
      每个都是自包含的单文件组件，除 <code>@movk/sigma</code>、<code>graphology</code>、
      <code>sigma</code> 与 Vue API 外不依赖任何东西，复制即可运行。
    </p>

    <section v-for="group in groups" :key="group.title">
      <h2>{{ group.title }}</h2>
      <table>
        <thead>
          <tr>
            <th>API</th>
            <th>示例</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in group.items" :key="item.api">
            <td><NuxtLink :to="item.to"><code>{{ item.api }}</code></NuxtLink></td>
            <td>
              <span v-for="name in item.examples" :key="name" class="chip">{{ name }}Example</span>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <section>
      <h2>模块选项</h2>
      <p class="note">
        <code>prefix</code>、<code>settings</code>、<code>css</code> 是 <code>nuxt.config.ts</code>
        层面的配置，不适合做成组件示例，说明写在本 playground 的
        <code>nuxt.config.ts</code> 注释里。
      </p>
    </section>
  </div>
</template>

<style scoped>
section {
  margin-block: 28px;
}

h2 {
  margin: 0 0 10px;
  font-size: 17px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

th,
td {
  padding: 6px 8px;
  border-bottom: 1px solid var(--pg-border);
  text-align: left;
  vertical-align: top;
}

th {
  color: var(--pg-muted);
  font-weight: 500;
}

td a {
  text-decoration: none;
}

td a:hover code {
  color: var(--pg-accent);
}

.chip {
  display: inline-block;
  margin: 0 4px 4px 0;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--pg-subtle);
  color: var(--pg-muted);
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, monospace;
}

.note {
  margin: 0;
  color: var(--pg-muted);
  font-size: 14px;
}
</style>
