/**
 * 从 public/data/wikipedia.json 派生一份小子集，写进 app/data/wikipedia-subset.json。
 *
 * 示例里的 demoGraph() 是同步调用的，不能去 fetch 完整数据集，所以需要一份能随包
 * 打进 bundle 的小文件。上游 sigma.js 也是这个分工：小示例读 src/examples/_data，
 * 大示例才去 fetch public/data。
 *
 * 重新生成：node docs/scripts/build-wikipedia-subset.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/** 子集节点数，够所有 composable 示例取样（最大的一个要 60 个节点） */
const SUBSET_SIZE = 160

/** 坐标跨度，与 .example-stage 的 420px 减去 stagePadding 后的可用高度对齐 */
const SPAN = 360

const sourcePath = fileURLToPath(new URL('../public/data/wikipedia.json', import.meta.url))
const targetPath = fileURLToPath(new URL('../app/data/wikipedia-subset.json', import.meta.url))

const dataset = JSON.parse(readFileSync(sourcePath, 'utf8'))

const clusterByKey = new Map(dataset.clusters.map(cluster => [cluster.key, cluster]))
const nodeByKey = new Map(dataset.nodes.map(node => [node.key, node]))

// 邻接表。数据集里的边是 [source, target] 二元组，没有属性
const neighbors = new Map(dataset.nodes.map(node => [node.key, []]))
for (const [source, target] of dataset.edges) {
  if (!neighbors.has(source) || !neighbors.has(target)) {
    continue
  }
  neighbors.get(source).push(target)
  neighbors.get(target).push(source)
}

const degreeOf = key => neighbors.get(key).length

/**
 * 从全局度数最高的节点做 BFS。
 *
 * 取 Top-N 度数而非随机取样：随机取的 160 个节点在 5409 条边里几乎连不起来，
 * 得到一堆孤立点，示例里的邻域展开、社区发现全都没得演。枢纽节点跨社区连接，
 * BFS 出来的子图天然覆盖多个 cluster。
 */
function collectSubset() {
  const start = dataset.nodes
    .map(node => node.key)
    .sort((a, b) => degreeOf(b) - degreeOf(a))[0]

  const picked = new Set([start])
  const queue = [start]

  while (queue.length > 0 && picked.size < SUBSET_SIZE) {
    const current = queue.shift()

    // 邻居按度数从高到低入队，让子图优先长在骨架上，视觉结构更清楚
    const ranked = [...neighbors.get(current)].sort((a, b) => degreeOf(b) - degreeOf(a))

    for (const next of ranked) {
      if (picked.size >= SUBSET_SIZE) {
        break
      }
      if (picked.has(next)) {
        continue
      }
      picked.add(next)
      queue.push(next)
    }
  }

  return picked
}

/** 把坐标平移缩放到以原点为中心、长边跨度为 SPAN 的方框内 */
function normalize(nodes) {
  const xs = nodes.map(node => node.x)
  const ys = nodes.map(node => node.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  const extent = Math.max(maxX - minX, maxY - minY) || 1
  const ratio = SPAN / extent
  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2

  return nodes.map(node => ({
    ...node,
    x: Number(((node.x - centerX) * ratio).toFixed(2)),
    y: Number(((node.y - centerY) * ratio).toFixed(2))
  }))
}

const picked = collectSubset()

const nodes = normalize(
  [...picked].map((key) => {
    const node = nodeByKey.get(key)
    const cluster = clusterByKey.get(node.cluster)

    return {
      key,
      label: node.label,
      category: cluster?.clusterLabel ?? '未分类',
      color: cluster?.color ?? '#94a3b8',
      x: node.x,
      y: node.y,
      degree: degreeOf(key)
    }
  })
)

const edges = dataset.edges
  .filter(([source, target]) => picked.has(source) && picked.has(target))
  .map(([source, target]) => [source, target])

const categories = [...new Set(nodes.map(node => node.category))]

writeFileSync(
  targetPath,
  `${JSON.stringify({ nodes, edges }, null, 2)}\n`
)

console.log(`[subset] ${nodes.length} 节点 / ${edges.length} 边 / ${categories.length} 个分类`)
console.log(`[subset] 分类：${categories.join('、')}`)
