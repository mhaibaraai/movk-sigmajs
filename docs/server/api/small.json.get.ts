const smallData = {
  attributes: {},
  options: { type: 'mixed' as const, multi: false, allowSelfLoops: true },
  nodes: [
    { key: 'a', attributes: { label: 'A', x: 0, y: 0, size: 20, color: '#e22653' } },
    { key: 'b', attributes: { label: 'B', x: 100, y: -100, size: 40, color: '#e28b53' } },
    { key: 'c', attributes: { label: 'C', x: 300, y: -200, size: 20, color: '#9be225' } },
    { key: 'd', attributes: { label: 'D', x: 100, y: -300, size: 20, color: '#53a4e2' } },
    { key: 'e', attributes: { label: 'E', x: 300, y: -400, size: 40, color: '#7553e2' } },
    { key: 'f', attributes: { label: 'F', x: 400, y: -500, size: 20, color: '#e253d5' } }
  ],
  edges: [
    { source: 'a', target: 'b', attributes: { size: 10 } },
    { source: 'b', target: 'c', attributes: { size: 10 } },
    { source: 'b', target: 'd', attributes: { size: 10 } },
    { source: 'c', target: 'b', attributes: { size: 10 } },
    { source: 'c', target: 'e', attributes: { size: 10 } },
    { source: 'd', target: 'c', attributes: { size: 10 } },
    { source: 'd', target: 'e', attributes: { size: 10 } },
    { source: 'e', target: 'd', attributes: { size: 10 } },
    { source: 'f', target: 'e', attributes: { size: 10 } }
  ]
}

export default eventHandler(async () => smallData)
