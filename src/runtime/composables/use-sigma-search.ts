import { computed, shallowRef } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import type { Attributes } from 'graphology-types'
import { useSigma } from './use-sigma'
import { useSigmaGraph } from './use-sigma-graph'

export interface SigmaSearchResult {
  type: 'node' | 'edge'
  /** 节点或边的 key。用 id 而非 key，后者是 Vue 的保留属性 */
  id: string
  /** 用于展示的文本，取自命中的字段 */
  label: string
  /** 命中所在的属性名 */
  field: string
}

export interface UseSigmaSearchOptions {
  /**
   * 参与匹配的属性名，按顺序取第一个命中的作展示
   * @defaultValue `['label']`
   */
  fields?: string[]
  /**
   * 结果条数上限
   * @defaultValue 20
   */
  limit?: number
  /**
   * 是否同时检索边
   * @defaultValue false
   */
  edges?: boolean
}

export interface UseSigmaSearchReturn {
  /** 检索词，可双向绑定 */
  query: Ref<string>
  /** 命中结果，随检索词与图变更重算 */
  results: ComputedRef<SigmaSearchResult[]>
  /** 相机聚焦到某条结果 */
  focus: (result: SigmaSearchResult) => Promise<void>
}

/**
 * 按属性模糊检索节点与边。
 *
 * 匹配在内存里做，不额外建索引：`graph.forEachNode` 遍历万级节点是毫秒量级，
 * 而维护索引要处理图变更的同步，得不偿失。
 */
export function useSigmaSearch(options: UseSigmaSearchOptions = {}): UseSigmaSearchReturn {
  const { fields = ['label'], limit = 20, edges = false } = options
  const { graph, whenReady } = useSigma()
  const { version } = useSigmaGraph()

  const query = shallowRef('')

  function match(attributes: Attributes, needle: string): { label: string, field: string } | null {
    for (const field of fields) {
      const value = attributes[field]
      if (typeof value === 'string' && value.toLowerCase().includes(needle)) {
        return { label: value, field }
      }
    }
    return null
  }

  const results = computed<SigmaSearchResult[]>(() => {
    void version.value

    const needle = query.value.trim().toLowerCase()
    if (!needle) {
      return []
    }

    const found: SigmaSearchResult[] = []

    graph.value.forEachNode((node, attributes) => {
      if (found.length >= limit) {
        return
      }
      const hit = match(attributes, needle)
      if (hit) {
        found.push({ type: 'node', id: node, ...hit })
      }
    })

    if (edges) {
      graph.value.forEachEdge((edge, attributes) => {
        if (found.length >= limit) {
          return
        }
        const hit = match(attributes, needle)
        if (hit) {
          found.push({ type: 'edge', id: edge, ...hit })
        }
      })
    }

    return found
  })

  return {
    query,
    results,

    async focus(result) {
      const instance = await whenReady()
      const node = result.type === 'node' ? result.id : graph.value.source(result.id)
      const display = instance.getNodeDisplayData(node)

      if (!display) {
        return
      }

      await instance.getCamera().animate({ x: display.x, y: display.y }, { duration: 300 })
    }
  }
}
