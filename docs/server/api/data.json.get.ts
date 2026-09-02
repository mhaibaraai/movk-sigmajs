import data from '../../public/data/data.json'

/**
 * 原始数据集只有 x / y / size / label / color，缺分类字段与边标签。
 * 转换下沉到接口，`public/data/data.json` 保持原样。
 */
const tiers = [
  { name: '核心', color: '#e11d48' },
  { name: '次要', color: '#f59e0b' },
  { name: '边缘', color: '#64748b' }
]

const degrees = new Map<string, number>()
for (const edge of data.edges) {
  degrees.set(edge.source, (degrees.get(edge.source) ?? 0) + 1)
  degrees.set(edge.target, (degrees.get(edge.target) ?? 0) + 1)
}

// 按度数排名分档而非按绝对值：档位是排名，与度数的绝对大小无关
const ranked = [...data.nodes]
  .sort((a, b) => (degrees.get(b.key) ?? 0) - (degrees.get(a.key) ?? 0))
  .map(node => node.key)

const tierOf = new Map(
  ranked.map((key, index) => [
    key,
    tiers[Math.min(Math.floor((index / ranked.length) * tiers.length), tiers.length - 1)]!
  ])
)

const labels = new Map(data.nodes.map(node => [node.key, node.attributes.label]))

const enriched = {
  ...data,
  nodes: data.nodes.map(node => ({
    ...node,
    attributes: {
      ...node.attributes,
      category: tierOf.get(node.key)!.name,
      // 原始 color 是一条度数渐变，同档内取值不一；这一个是每档一色，供 colorField 对比
      categoryColor: tierOf.get(node.key)!.color
    }
  })),
  edges: data.edges.map(edge => ({
    ...edge,
    attributes: {
      ...edge.attributes,
      label: `${labels.get(edge.source)}—${labels.get(edge.target)}`
    }
  }))
}

export default eventHandler(async () => enriched)
