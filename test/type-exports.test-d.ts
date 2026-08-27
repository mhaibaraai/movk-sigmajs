// 编译期守卫：确保本库的公开类型能从 `@movk/sigma` 根出口取到。
//
// Nuxt 里这些类型经自动导入已全局可用，但根显式 import 是另一条独立通道
// （纯 Vue 插件入口、以及偏好显式 import 的项目走的就是它）。这个文件不含运行期逻辑，
// 由 `vue-tsc --noEmit` 覆盖：任一类型从根出口漏掉，typecheck 立即失败。
//
// 断言用 `import type`，运行期完全擦除；此文件不进 vitest（后缀 test-d.ts）。

import type {
  ApplyGraphDiffOptions,
  DegreeToTierOptions,
  LabelPlacementsOptions,
  SdfPolygonOptions,
  SdfStarOptions,
  SigmaCentralityKind,
  SigmaContext,
  SigmaEdgePredicate,
  SigmaEventHandlers,
  SigmaExportOptions,
  SigmaFitInsets,
  SigmaFitOptions,
  SigmaLabelTierBreakpoint,
  SigmaLayoutComponentOptions,
  SigmaLayoutName,
  SigmaNodePredicate,
  SigmaSearchResult,
  SigmaStyleOptions,
  SigmaStyles,
  SigmaStylesBase,
  UseSigmaCameraReturn,
  UseSigmaDragOptions,
  UseSigmaDragReturn,
  UseSigmaExportReturn,
  UseSigmaFilterReturn,
  UseSigmaGraphReturn,
  UseSigmaLabelTiersOptions,
  UseSigmaLabelTiersReturn,
  UseSigmaLayoutOptions,
  UseSigmaLayoutReturn,
  UseSigmaMetricsReturn,
  UseSigmaNeighborhoodReturn,
  UseSigmaSearchReturn,
  UseSigmaSelectionReturn,
  UseSigmaStateReturn
} from '@movk/sigma'

// 用一次每个类型，未解析的类型会在此处报错
type Assert<T> = T
export type _Exports = [
  Assert<ApplyGraphDiffOptions>,
  Assert<DegreeToTierOptions>,
  Assert<LabelPlacementsOptions>,
  Assert<SdfPolygonOptions>,
  Assert<SdfStarOptions>,
  Assert<SigmaCentralityKind>,
  Assert<SigmaContext>,
  Assert<SigmaEdgePredicate>,
  Assert<SigmaEventHandlers>,
  Assert<SigmaExportOptions>,
  Assert<SigmaFitInsets>,
  Assert<SigmaFitOptions>,
  Assert<SigmaLabelTierBreakpoint>,
  Assert<SigmaLayoutComponentOptions>,
  Assert<SigmaLayoutName>,
  Assert<SigmaNodePredicate>,
  Assert<SigmaSearchResult>,
  Assert<SigmaStyleOptions>,
  Assert<SigmaStyles>,
  Assert<SigmaStylesBase>,
  Assert<UseSigmaCameraReturn>,
  Assert<UseSigmaDragOptions>,
  Assert<UseSigmaDragReturn>,
  Assert<UseSigmaExportReturn>,
  Assert<UseSigmaFilterReturn>,
  Assert<UseSigmaGraphReturn>,
  Assert<UseSigmaLabelTiersOptions>,
  Assert<UseSigmaLabelTiersReturn>,
  Assert<UseSigmaLayoutOptions>,
  Assert<UseSigmaLayoutReturn>,
  Assert<UseSigmaMetricsReturn>,
  Assert<UseSigmaNeighborhoodReturn>,
  Assert<UseSigmaSearchReturn>,
  Assert<UseSigmaSelectionReturn>,
  Assert<UseSigmaStateReturn>
]

// 一个具体值断言，确认结构而不止于名字可解析
const _hit: SigmaSearchResult = { type: 'node', id: 'n0', label: '节点', field: 'label' }
const _kind: SigmaCentralityKind = 'betweenness'
const _shape: SdfPolygonOptions = { name: 'hex', sides: 6 }
const _fit: SigmaFitOptions = { animate: false, minRatio: 0.12, insets: { top: 96, left: 288 } }
export const _samples = [_hit, _kind, _shape, _fit]
