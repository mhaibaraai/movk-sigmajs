export interface NodeDetail {
  key: string
  label: string
  category: string
  domain: string
  degree: number
  issuedAt: string
  clauses: Array<{ no: string, text: string }>
}

/**
 * 详情接口。条款正文只在点击后才请求，不随图数据一起下发——
 * 节点属性只带渲染必需的字段，是 1000+ 规模下的基本要求。
 */
export default defineEventHandler((event): NodeDetail => {
  const id = getRouterParam(event, 'id')
  const node = id ? findNode(id) : undefined

  if (!node) {
    throw createError({ statusCode: 404, statusMessage: `节点 ${id} 不存在` })
  }

  const attributes = node.attributes ?? {}
  const seed = Number(String(node.key).replace(/\D/g, '')) || 0

  return {
    key: String(node.key),
    label: String(attributes.label ?? node.key),
    category: String(attributes.category ?? ''),
    domain: String(attributes.domain ?? ''),
    degree: Number(attributes.degree ?? 0),
    issuedAt: new Date(Date.UTC(2018 + (seed % 8), seed % 12, (seed % 27) + 1)).toISOString().slice(0, 10),
    clauses: Array.from({ length: 3 + (seed % 4) }, (_, index) => ({
      no: `第 ${index + 1} 条`,
      text: `${attributes.domain ?? ''}相关要求的第 ${index + 1} 项规定，适用于本${attributes.category ?? '文件'}覆盖的全部场景。`
    }))
  }
})
