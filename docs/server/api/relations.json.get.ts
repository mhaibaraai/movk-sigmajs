/**
 * 演示边渲染的小图：一对端点上的平行边、一个自环，每条边带 kind 分类。
 * 其余数据集都是简单图且边不带分类字段，撑不起 parallelPath / selfLoopPath 与 path/head 绑定。
 * 节点只存语义属性，颜色与尺寸不落进图数据，由 styles 的 attribute 绑定在渲染期算
 */
const relationsData = {
  attributes: {},
  options: { type: 'directed' as const, multi: true, allowSelfLoops: true },
  nodes: [
    { key: 'a', attributes: { label: '节点 A', x: 0, y: -180, category: '核心' } },
    { key: 'b', attributes: { label: '节点 B', x: 170, y: -60, category: '次要' } },
    { key: 'c', attributes: { label: '节点 C', x: 105, y: 145, category: '次要' } },
    { key: 'd', attributes: { label: '节点 D', x: -105, y: 145, category: '边缘' } },
    { key: 'e', attributes: { label: '节点 E', x: -170, y: -60, category: '边缘' } }
  ],
  edges: [
    { source: 'a', target: 'b', attributes: { kind: 'flow', label: '关系一' } },
    { source: 'a', target: 'b', attributes: { kind: 'flow', label: '关系二' } },
    { source: 'a', target: 'b', attributes: { kind: 'flow', label: '关系三' } },
    { source: 'b', target: 'c', attributes: { kind: 'flow', label: '流向' } },
    { source: 'c', target: 'd', attributes: { kind: 'dependency', label: '依赖' } },
    { source: 'd', target: 'e', attributes: { kind: 'assoc', label: '关联' } },
    { source: 'e', target: 'a', attributes: { kind: 'assoc', label: '关联' } },
    { source: 'c', target: 'c', attributes: { kind: 'flow', label: '自环' } }
  ]
}

export default eventHandler(async () => relationsData)
