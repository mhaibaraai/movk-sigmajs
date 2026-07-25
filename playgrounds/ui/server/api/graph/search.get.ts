export interface SearchHit {
  key: string
  label: string
  type: string
  degree: number
}

/**
 * 检索接口。按 label 与 category 模糊匹配，按度数降序返回。
 *
 * 与前端的 useSigmaSearch 不同：那个只看已加载到图上的节点，
 * 这个能检索到尚未下发的部分，选中后再走邻域接口把它拉进来。
 */
export default defineEventHandler((event): SearchHit[] => {
  const { q } = getQuery(event)
  const keyword = String(q ?? '').trim().toLowerCase()

  if (keyword.length === 0) {
    return []
  }

  return corpus().nodes
    .filter((node) => {
      const attributes = node.attributes ?? {}
      return String(attributes.label ?? '').toLowerCase().includes(keyword)
        || String(attributes.category ?? '').toLowerCase().includes(keyword)
    })
    .sort((a, b) => (b.attributes?.degree ?? 0) - (a.attributes?.degree ?? 0))
    .slice(0, 20)
    .map(node => ({
      key: String(node.key),
      label: String(node.attributes?.label ?? node.key),
      type: String(node.attributes?.category ?? ''),
      degree: Number(node.attributes?.degree ?? 0)
    }))
})
