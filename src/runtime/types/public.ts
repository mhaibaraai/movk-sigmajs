// 本库的公开类型汇总为根出口。
//
// 定义随各自的 composable / util 就近声明（内聚），此处只做类型汇出。
// 在 Nuxt 里这些类型经 addImportsDir 已自动全局可用，补这一层是为了两件事：
// 从 `@movk/sigma` 根显式 import 也能取到，以及日后的纯 Vue 插件入口共用同一份出口。
//
// 只汇出本库自己的类型。sigma / graphology 的类型一律从原包直接 import，不在此转发。

export type * from './index'

export type { UseSigmaCameraReturn } from '../composables/use-sigma-camera'
export type { UseSigmaDragOptions, UseSigmaDragReturn } from '../composables/use-sigma-drag'
export type { SigmaEventHandlers } from '../composables/use-sigma-events'
export type { SigmaExportOptions, UseSigmaExportReturn } from '../composables/use-sigma-export'
export type { SigmaEdgePredicate, SigmaNodePredicate, UseSigmaFilterOptions, UseSigmaFilterReturn } from '../composables/use-sigma-filter'
export type { UseSigmaGraphReturn } from '../composables/use-sigma-graph'
export type { SigmaLabelTierBreakpoint, UseSigmaLabelTiersOptions, UseSigmaLabelTiersReturn } from '../composables/use-sigma-label-tiers'
export type { UseSigmaLayoutOptions, UseSigmaLayoutReturn } from '../composables/use-sigma-layout'
export type { SigmaCentralityKind, UseSigmaMetricsReturn } from '../composables/use-sigma-metrics'
export type { UseSigmaNeighborhoodOptions, UseSigmaNeighborhoodReturn } from '../composables/use-sigma-neighborhood'
export type { UseSigmaReducerReturn } from '../composables/use-sigma-reducer'
export type { SigmaSearchResult, UseSigmaSearchOptions, UseSigmaSearchReturn } from '../composables/use-sigma-search'
export type { UseSigmaSelectionOptions, UseSigmaSelectionReturn } from '../composables/use-sigma-selection'

export type { ApplyGraphDiffOptions } from '../utils/apply-graph-diff'
export type { CurveParallelEdgesOptions } from '../utils/curve-parallel-edges'
export type { DegreeToTierOptions, LabelPlacementsOptions } from '../utils/graph-visual'
export type {
  PolygonExtentOptions,
  SigmaLabelAnchor,
  SigmaLabelGeometry,
  SigmaLabelPlacement,
  SigmaLabelRect
} from '../utils/label-anchor'
export type { SigmaLabelLayout, SigmaLabelLayoutOptions } from '../utils/label-layout'
export type {
  CreateLabelRendererOptions,
  SigmaEdgeLabelOptions,
  SigmaLabelHaloOptions,
  SigmaLabelHoverOptions,
  SigmaLabelRenderer,
  SigmaLabelTierStyle
} from '../utils/label-renderer'

// 形状程序的类型可以随时取用，值必须经 `@movk/sigma/programs/node-shape` 延迟加载：
// 该模块静态引用 sigma/rendering，从根出口转发会把 WebGL 全局拖进 SSR
export type {
  CreateNodeShapeProgramOptions,
  SigmaNodeBorder,
  SigmaNodeBorderColor,
  SigmaNodeBorderSize,
  SigmaNodeBorderSizeMode,
  SigmaNodeShape
} from '../programs/node-shape'
