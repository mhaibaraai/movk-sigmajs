import type { SerializedGraph } from 'graphology-types'

const NODES = [
  { key: 'core', label: '知识图谱', x: 0, y: 0, size: 18, color: '#0ea5e9' },
  { key: 'render', label: '渲染', x: 200, y: 100, size: 12, color: '#f97316' },
  { key: 'layout', label: '布局', x: -200, y: 100, size: 12, color: '#22c55e' },
  { key: 'interact', label: '交互', x: 200, y: -100, size: 12, color: '#a855f7' },
  { key: 'analysis', label: '分析', x: -200, y: -100, size: 12, color: '#ef4444' },
  { key: 'webgl', label: 'WebGL', x: 400, y: 200, size: 8, color: '#64748b' },
  { key: 'sdf', label: 'SDF 字形', x: 400, y: 0, size: 8, color: '#64748b' },
  { key: 'forceatlas2', label: 'ForceAtlas2', x: -400, y: 200, size: 8, color: '#64748b' },
  { key: 'louvain', label: 'Louvain', x: -400, y: -200, size: 8, color: '#64748b' },
  { key: 'drag', label: '拖拽', x: 400, y: -200, size: 8, color: '#64748b' }
]

const EDGES: Array<[string, string]> = [
  ['core', 'render'],
  ['core', 'layout'],
  ['core', 'interact'],
  ['core', 'analysis'],
  ['render', 'webgl'],
  ['render', 'sdf'],
  ['layout', 'forceatlas2'],
  ['analysis', 'louvain'],
  ['interact', 'drag'],
  ['render', 'interact']
]

/** 内联的演示数据，playground 不依赖 docs 的 server 接口 */
export function graphData(): SerializedGraph {
  return {
    attributes: {},
    options: { type: 'undirected', multi: false, allowSelfLoops: false },
    nodes: NODES.map(({ key, ...attributes }) => ({ key, attributes })),
    edges: EDGES.map(([source, target]) => ({ source, target, attributes: { size: 2 } }))
  } as SerializedGraph
}
