import Graph from 'graphology'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import SigmaGraph from '../src/runtime/components/Graph.vue'
import { useSigmaSearch } from '../src/runtime/composables/use-sigma-search'
import type { UseSigmaSearchOptions, UseSigmaSearchReturn } from '../src/runtime/composables/use-sigma-search'

const state = vi.hoisted(() => ({ animations: [] as unknown[] }))

vi.mock('sigma', () => {
  class MockSigma {
    graph: Graph
    constructor(graph: Graph) {
      this.graph = graph
    }

    getNodeDisplayData(key: string) {
      return this.graph.hasNode(key) ? { x: 1, y: 2 } : undefined
    }

    getCamera() {
      return {
        animate: (target: unknown) => {
          state.animations.push(target)
          return Promise.resolve()
        }
      }
    }

    on() {}
    off() {}
    resize() {}
    kill() {}
    setGraph() {}
    refresh() {}
    setSettings() {}
    getSettings() {
      return {}
    }
  }

  return { default: MockSigma }
})

function seeded() {
  const graph = new Graph()
  graph.addNode('n1', { label: '安全生产管理制度', code: 'AQ-001' })
  graph.addNode('n2', { label: '设备维护规程', code: 'SB-002' })
  graph.addNode('n3', { label: '安全检查细则', code: 'AQ-003' })
  graph.addEdge('n1', 'n3', { label: '引用安全条款' })
  return graph
}

async function mountSearch(options: UseSigmaSearchOptions = {}) {
  let api!: UseSigmaSearchReturn

  const Child = defineComponent({
    setup() {
      api = useSigmaSearch(options)
      return () => h('span')
    }
  })

  const graph = seeded()
  const wrapper = mount(SigmaGraph, {
    props: { graph } as never,
    slots: { default: () => h(Child) }
  })

  await vi.waitFor(() => {
    if (!wrapper.vm.sigma) {
      throw new Error('sigma 尚未就绪')
    }
  })

  return { api, graph }
}

enableAutoUnmount(afterEach)

beforeEach(() => {
  state.animations.length = 0
})

describe('useSigmaSearch', () => {
  it('空检索词返回空结果', async () => {
    const { api } = await mountSearch()
    expect(api.results.value).toEqual([])

    api.query.value = '   '
    expect(api.results.value).toEqual([])
  })

  it('按 label 模糊匹配节点', async () => {
    const { api } = await mountSearch()

    api.query.value = '安全'

    expect(api.results.value.map(r => r.id)).toEqual(['n1', 'n3'])
    expect(api.results.value[0]).toMatchObject({ type: 'node', field: 'label', label: '安全生产管理制度' })
  })

  it('大小写不敏感', async () => {
    const { api } = await mountSearch({ fields: ['code'] })

    api.query.value = 'aq'

    expect(api.results.value.map(r => r.id)).toEqual(['n1', 'n3'])
  })

  it('可指定多个字段，按顺序取首个命中', async () => {
    const { api } = await mountSearch({ fields: ['label', 'code'] })

    api.query.value = 'SB'

    expect(api.results.value).toHaveLength(1)
    expect(api.results.value[0]).toMatchObject({ id: 'n2', field: 'code' })
  })

  it('默认不检索边，开启后才返回', async () => {
    const { api } = await mountSearch()

    api.query.value = '引用'
    expect(api.results.value).toEqual([])

    const withEdges = await mountSearch({ edges: true })
    withEdges.api.query.value = '引用'
    expect(withEdges.api.results.value.map(r => r.type)).toEqual(['edge'])
  })

  it('limit 限制结果条数', async () => {
    const { api } = await mountSearch({ limit: 1 })

    api.query.value = '安全'

    expect(api.results.value).toHaveLength(1)
  })

  it('图变更后结果自动重算', async () => {
    const { api, graph } = await mountSearch()

    api.query.value = '安全'
    expect(api.results.value).toHaveLength(2)

    graph.addNode('n4', { label: '安全应急预案' })
    await nextTick()

    expect(api.results.value).toHaveLength(3)
  })

  it('focus 把相机移到目标节点', async () => {
    const { api } = await mountSearch()

    api.query.value = '安全'
    await api.focus(api.results.value[0]!)

    expect(state.animations[0]).toMatchObject({ x: 1, y: 2 })
  })

  it('focus 边时定位到源节点', async () => {
    const { api, graph } = await mountSearch({ edges: true })

    await api.focus({ type: 'edge', id: graph.edge('n1', 'n3')!, label: '', field: 'label' })

    expect(state.animations).toHaveLength(1)
  })
})
