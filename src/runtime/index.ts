/**
 * 框架无关的具名导出入口，对应 `@movk/sigma/vue`。
 *
 * Nuxt 侧靠 `addComponentsDir` 与 `addImportsDir` 自动导入，不经过这里；
 * 纯 Vue + Vite 项目既可以接 `@movk/sigma/vite` 自动导入，也可以从这里显式导入。
 * 组件名与 Nuxt 侧保持一致：统一 `Sigma` 前缀，`controls/` 子目录不进名字。
 */

export { default as SigmaContextMenu } from './components/ContextMenu.vue'
export { default as SigmaGraph } from './components/Graph.vue'
export { default as SigmaOverlay } from './components/Overlay.vue'
export { default as SigmaPopover } from './components/Popover.vue'
export { default as SigmaTooltip } from './components/Tooltip.vue'
export { default as SigmaControls } from './components/controls/Controls.vue'
export { default as SigmaFullscreenControl } from './components/controls/FullscreenControl.vue'
export { default as SigmaLegend } from './components/controls/Legend.vue'
export { default as SigmaMiniMap } from './components/controls/MiniMap.vue'
export { default as SigmaSearchControl } from './components/controls/SearchControl.vue'
export { default as SigmaZoomControl } from './components/controls/ZoomControl.vue'

export * from './composables/use-sigma'
export * from './composables/use-sigma-camera'
export * from './composables/use-sigma-drag'
export * from './composables/use-sigma-events'
export * from './composables/use-sigma-export'
export * from './composables/use-sigma-filter'
export * from './composables/use-sigma-graph'
export * from './composables/use-sigma-label-tiers'
export * from './composables/use-sigma-layout'
export * from './composables/use-sigma-metrics'
export * from './composables/use-sigma-neighborhood'
export * from './composables/use-sigma-search'
export * from './composables/use-sigma-selection'
export * from './composables/use-sigma-settings'
export * from './composables/use-sigma-state'

export * from './utils/apply-graph-diff'
export * from './utils/compose-styles'
export * from './utils/define-sigma-primitives'
export * from './utils/graph-visual'
export * from './utils/minimap-projection'
export * from './utils/node-label-atlas'
export * from './utils/node-shape'

export { getSigmaConfig, setSigmaConfig } from './config'
export type { SigmaRuntimeConfig } from './config'
export type * from './types/public'
