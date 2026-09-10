<script setup lang="ts">
useHead({ title: '@movk/sigma · Playground' })

interface Row {
  api: string
  to: string
  example: string
}

const sections: { title: string, rows: Row[] }[] = [
  {
    title: '核心组件',
    rows: [
      { api: 'SigmaGraph', to: '/components/core', example: 'GraphExample' },
      { api: 'SigmaOverlay', to: '/components/core', example: 'OverlayExample' },
      { api: 'SigmaTooltip', to: '/components/core', example: 'TooltipExample' },
      { api: 'SigmaPopover', to: '/components/core', example: 'PopoverExample' },
      { api: 'SigmaContextMenu', to: '/components/core', example: 'ContextMenuExample' }
    ]
  },
  {
    title: '控件',
    rows: [
      { api: 'SigmaControls', to: '/components/controls', example: 'ControlsExample' },
      { api: 'SigmaZoomControl', to: '/components/controls', example: 'ZoomControlExample' },
      { api: 'SigmaFullscreenControl', to: '/components/controls', example: 'FullscreenControlExample' },
      { api: 'SigmaSearchControl', to: '/components/controls', example: 'SearchControlExample' },
      { api: 'SigmaLegend', to: '/components/controls', example: 'LegendExample' },
      { api: 'SigmaMiniMap', to: '/components/controls', example: 'MiniMapExample' }
    ]
  },
  {
    title: '基础 Composables',
    rows: [
      { api: 'useSigma', to: '/composables/base', example: 'UseSigmaExample' },
      { api: 'useSigmaById / useSigmaIds', to: '/composables/base', example: 'UseSigmaByIdExample' },
      { api: 'useSigmaGraph', to: '/composables/base', example: 'UseSigmaGraphExample' },
      { api: 'useSigmaEvents', to: '/composables/base', example: 'UseSigmaEventsExample' },
      { api: 'useSigmaSettings', to: '/composables/base', example: 'UseSigmaSettingsExample' },
      { api: 'useSigmaState', to: '/composables/base', example: 'UseSigmaStateExample' }
    ]
  },
  {
    title: '交互 Composables',
    rows: [
      { api: 'useSigmaCamera', to: '/composables/interaction', example: 'UseSigmaCameraExample' },
      { api: 'useSigmaSelection', to: '/composables/interaction', example: 'UseSigmaSelectionExample' },
      { api: 'useSigmaNeighborhood', to: '/composables/interaction', example: 'UseSigmaNeighborhoodExample' },
      { api: 'useSigmaDrag', to: '/composables/interaction', example: 'UseSigmaDragExample' },
      { api: 'useSigmaSearch', to: '/composables/interaction', example: 'UseSigmaSearchExample' },
      { api: 'useSigmaFilter', to: '/composables/interaction', example: 'UseSigmaFilterExample' },
      { api: 'useSigmaLabelTiers', to: '/composables/interaction', example: 'UseSigmaLabelTiersExample' }
    ]
  },
  {
    title: '布局与分析',
    rows: [
      { api: 'useSigmaLayout', to: '/composables/analysis', example: 'UseSigmaLayoutExample' },
      { api: 'useSigmaMetrics', to: '/composables/analysis', example: 'UseSigmaMetricsExample' },
      { api: 'useSigmaExport', to: '/composables/analysis', example: 'UseSigmaExportExample' }
    ]
  },
  {
    title: '工具函数',
    rows: [
      { api: 'applyGraphDiff', to: '/utils', example: 'ApplyGraphDiffExample' },
      { api: 'composeStyles', to: '/utils', example: 'ComposeStylesExample' },
      { api: 'labelPlacements', to: '/utils', example: 'LabelPlacementsExample' },
      { api: 'degreeToTier', to: '/utils', example: 'DegreeToTierExample' },
      { api: 'sdfPolygon / sdfStar', to: '/utils', example: 'SdfShapesExample' },
      { api: 'defineSigmaPrimitives', to: '/utils', example: 'DefineSigmaPrimitivesExample' }
    ]
  }
]

const total = sections.reduce((sum, section) => sum + section.rows.length, 0)
</script>

<template>
  <div class="flex flex-col gap-8">
    <header>
      <h1 class="text-xl font-semibold">
        @movk/sigma
      </h1>
      <p class="text-muted mt-1 text-sm">
        基于 sigma v4 的知识图谱可视化 Nuxt 模块。共 {{ total }} 个示例，分组与
        <NuxtLink to="https://sigma.movk.top" target="_blank" class="text-primary">
          文档站
        </NuxtLink>
        一一对应。数据来自 docs 的 <code>/api/*.json</code>，示例组件由本 playground 自建。
      </p>
    </header>

    <section v-for="section in sections" :key="section.title" class="flex flex-col gap-2">
      <h2 class="text-sm font-medium">
        {{ section.title }}
      </h2>

      <div class="border-default divide-default divide-y rounded-lg border text-sm">
        <NuxtLink
          v-for="row in section.rows"
          :key="row.api"
          :to="row.to"
          class="hover:bg-elevated flex items-center justify-between gap-3 px-3 py-2"
        >
          <code>{{ row.api }}</code>
          <span class="text-muted text-xs">{{ row.example }}.vue</span>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
