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

// 只汇出类型：值必须经 `@movk/sigma/programs/node-shape` 延迟加载
export type {
  CreateNodeShapeProgramOptions,
  SigmaNodeBorder,
  SigmaNodeBorderColor,
  SigmaNodeBorderSize,
  SigmaNodeBorderSizeMode,
  SigmaNodeShape
} from '../programs/node-shape'
