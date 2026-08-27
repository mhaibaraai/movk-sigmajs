import type { SigmaStyles } from '../types'

type NodeRules = NonNullable<SigmaStyles['nodes']>
type EdgeRules = NonNullable<SigmaStyles['edges']>
type StageRules = NonNullable<SigmaStyles['stage']>

function collect<T>(sources: (T | T[] | undefined)[]): T[] {
  const rules: T[] = []
  for (const source of sources) {
    if (source === undefined) {
      continue
    }
    if (Array.isArray(source)) {
      rules.push(...source)
    }
    else {
      rules.push(source)
    }
  }
  return rules
}

/**
 * 按序拼接多份 styles，后者的规则排在后面因而覆盖前者。
 *
 * sigma 拿到 `styles.nodes` 时是**整体替换** `DEFAULT_STYLES.nodes` 而非合并，
 * 用户一传自定义规则就会丢掉标签绑定、`isHidden` 可见性与悬浮反馈，故此处显式合成。
 *
 * 纯数据函数，不 import sigma 的任何值，`DEFAULT_STYLES` 由调用方注入。
 */
export function composeStyles(...sources: (SigmaStyles | undefined)[]): SigmaStyles {
  const nodes = collect<NodeRules>(sources.map(source => source?.nodes))
  const edges = collect<EdgeRules>(sources.map(source => source?.edges))
  const stage = collect<StageRules>(sources.map(source => source?.stage))

  const composed: SigmaStyles = {}
  if (nodes.length > 0) {
    composed.nodes = nodes as NodeRules
  }
  if (edges.length > 0) {
    composed.edges = edges as EdgeRules
  }
  if (stage.length > 0) {
    composed.stage = stage as StageRules
  }
  return composed
}
