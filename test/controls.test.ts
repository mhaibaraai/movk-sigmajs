import Graph from 'graphology'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { h, nextTick } from 'vue'
import SigmaGraph from '../src/runtime/components/Graph.vue'
import SigmaControls from '../src/runtime/components/controls/Controls.vue'
import SigmaZoomControl from '../src/runtime/components/controls/ZoomControl.vue'
import SigmaSearchControl from '../src/runtime/components/controls/SearchControl.vue'
import SigmaLegend from '../src/runtime/components/controls/Legend.vue'

const state = vi.hoisted(() => ({
  instances: [] as Array<{
    settings: Record<string, unknown>
    handlers: Record<string, (payload: unknown) => void>
    camera: { zoomIn: number, zoomOut: number, reset: number, animated: unknown[] }
  }>
}))

vi.mock('sigma', () => {
  class MockSigma {
    settings: Record<string, unknown> = {}
    handlers: Record<string, (payload: unknown) => void> = {}
    camera = { zoomIn: 0, zoomOut: 0, reset: 0, animated: [] as unknown[] }
    graph: Graph

    constructor(graph: Graph, _container: unknown, settings: Record<string, unknown>) {
      this.graph = graph
      this.settings = settings
      state.instances.push(this)
    }

    getCamera() {
      return {
        animatedZoom: async () => {
          this.camera.zoomIn++
        },
        animatedUnzoom: async () => {
          this.camera.zoomOut++
        },
        animatedReset: async () => {
          this.camera.reset++
        },
        animate: async (target: unknown) => {
          this.camera.animated.push(target)
        },
        getState: () => ({ x: 0, y: 0, ratio: 1, angle: 0 })
      }
    }

    getGraph() {
      return this.graph
    }

    getNodeDisplayData(key: string) {
      return this.graph.hasNode(key) ? { x: 0, y: 0, hidden: false } : undefined
    }

    on(event: string, handler: (payload: unknown) => void) {
      this.handlers[event] = handler
    }

    off() {}
    resize() {}
    kill() {}
    setGraph() {}
    refresh() {}
    setSettings(next: Record<string, unknown>) {
      this.settings = next
    }

    getSettings() {
      return this.settings
    }
  }

  return { default: MockSigma }
})

function seededGraph() {
  const graph = new Graph()
  graph.addNode('a', { label: '制度 A', type: '管理', color: '#f00' })
  graph.addNode('b', { label: '制度 B', type: '管理', color: '#f00' })
  graph.addNode('c', { label: '条例 C', type: '技术', color: '#00f' })
  graph.addEdge('a', 'b')
  return graph
}

async function mountControl(child: () => unknown, graph = seededGraph()) {
  const wrapper = mount(SigmaGraph, {
    props: { graph } as never,
    slots: { default: child }
  })

  await vi.waitFor(() => {
    if (!wrapper.vm.sigma) {
      throw new Error('sigma 尚未就绪')
    }
  })

  return { wrapper, graph, instance: state.instances[0]! }
}

enableAutoUnmount(afterEach)

beforeEach(() => {
  state.instances.length = 0
})

describe('SigmaControls', () => {
  it('停靠角与方向落到 data 属性上供 CSS 定位', async () => {
    const { wrapper } = await mountControl(() =>
      h(SigmaControls, { position: 'top-left', direction: 'horizontal' }, () => 'x')
    )

    const el = wrapper.find('.sigma-controls')
    expect(el.attributes('data-position')).toBe('top-left')
    expect(el.attributes('data-direction')).toBe('horizontal')
  })

  it('默认停靠右下且纵向排布', async () => {
    const { wrapper } = await mountControl(() => h(SigmaControls, null, () => 'x'))

    const el = wrapper.find('.sigma-controls')
    expect(el.attributes('data-position')).toBe('bottom-right')
    expect(el.attributes('data-direction')).toBe('vertical')
  })
})

describe('SigmaZoomControl', () => {
  it('三个按钮分别驱动相机的放大、缩小与复位', async () => {
    const { wrapper, instance } = await mountControl(() => h(SigmaZoomControl))

    const buttons = wrapper.findAll('.sigma-control-button')
    expect(buttons).toHaveLength(3)

    await buttons[0]!.trigger('click')
    await buttons[1]!.trigger('click')
    await buttons[2]!.trigger('click')
    await vi.waitFor(() => {
      if (instance.camera.reset === 0) {
        throw new Error('复位尚未执行')
      }
    })

    expect(instance.camera).toMatchObject({ zoomIn: 1, zoomOut: 1, reset: 1 })
  })

  it('reset 为 false 时不渲染复位按钮', async () => {
    const { wrapper } = await mountControl(() => h(SigmaZoomControl, { reset: false }))
    expect(wrapper.findAll('.sigma-control-button')).toHaveLength(2)
  })

  it('每个按钮都有无障碍标签', async () => {
    const { wrapper } = await mountControl(() => h(SigmaZoomControl))

    expect(wrapper.findAll('.sigma-control-button').map(b => b.attributes('aria-label')))
      .toEqual(['放大', '缩小', '复位'])
  })

  it('图标可经具名插槽接管', async () => {
    const { wrapper } = await mountControl(() =>
      h(SigmaZoomControl, null, { 'zoom-in': () => '放大图标' })
    )

    expect(wrapper.text()).toContain('放大图标')
  })
})

describe('SigmaSearchControl', () => {
  it('输入后按防抖间隔给出结果', async () => {
    const { wrapper } = await mountControl(() => h(SigmaSearchControl, { debounce: 0 }))

    await wrapper.find('input').setValue('制度')
    await vi.waitFor(async () => {
      await nextTick()
      if (wrapper.findAll('.sigma-search-option').length !== 2) {
        throw new Error('结果尚未就绪')
      }
    })

    expect(wrapper.findAll('.sigma-search-option').map(o => o.text()))
      .toEqual(['制度 A', '制度 B'])
  })

  it('命中片段被包成高亮元素', async () => {
    const { wrapper } = await mountControl(() => h(SigmaSearchControl, { debounce: 0 }))

    await wrapper.find('input').setValue('条例')
    await vi.waitFor(async () => {
      await nextTick()
      if (!wrapper.find('.sigma-search-match').exists()) {
        throw new Error('高亮尚未渲染')
      }
    })

    expect(wrapper.find('.sigma-search-match').text()).toBe('条例')
  })

  it('无匹配时给出空态提示', async () => {
    const { wrapper } = await mountControl(() => h(SigmaSearchControl, { debounce: 0 }))

    await wrapper.find('input').setValue('不存在的词')
    await vi.waitFor(async () => {
      await nextTick()
      if (!wrapper.find('.sigma-search-empty').exists()) {
        throw new Error('空态尚未渲染')
      }
    })

    expect(wrapper.find('.sigma-search-empty').text()).toBe('无匹配')
  })

  it('选中结果后聚焦相机、清空输入并抛出事件', async () => {
    const { wrapper, instance } = await mountControl(() => h(SigmaSearchControl, { debounce: 0 }))

    await wrapper.find('input').setValue('条例')
    await vi.waitFor(async () => {
      await nextTick()
      if (!wrapper.find('.sigma-search-option').exists()) {
        throw new Error('结果尚未就绪')
      }
    })

    await wrapper.find('.sigma-search-option').trigger('click')
    await vi.waitFor(() => {
      if (instance.camera.animated.length === 0) {
        throw new Error('相机尚未移动')
      }
    })

    expect(wrapper.findComponent(SigmaSearchControl).emitted('select')).toHaveLength(1)
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('')
  })

  it('输入为空时不展开结果列表', async () => {
    const { wrapper } = await mountControl(() => h(SigmaSearchControl, { debounce: 0 }))
    expect(wrapper.find('.sigma-search-results').exists()).toBe(false)
  })
})

describe('SigmaLegend', () => {
  it('按属性分组并统计数量', async () => {
    const { wrapper } = await mountControl(() => h(SigmaLegend, { field: 'type' }))

    const items = wrapper.findAll('.sigma-legend-item')
    expect(items.map(i => i.text())).toEqual(['管理2', '技术1'])
  })

  it('取色取自节点的 color 属性', async () => {
    const { wrapper } = await mountControl(() => h(SigmaLegend, { field: 'type' }))

    expect(wrapper.find('.sigma-legend-swatch').attributes('style')).toContain('#f00')
  })

  it('分组值缺失时归入兜底组', async () => {
    const graph = new Graph()
    graph.addNode('x', { label: 'X' })

    const { wrapper } = await mountControl(() => h(SigmaLegend, { field: 'type' }), graph)

    expect(wrapper.find('.sigma-legend-item').text()).toContain('未分类')
  })

  it('点击条目切换该组显隐并落到 reducer 的 hidden', async () => {
    const { wrapper, instance } = await mountControl(() => h(SigmaLegend, { field: 'type' }))

    await wrapper.findAll('.sigma-legend-item')[0]!.trigger('click')

    const reducer = instance.settings.nodeReducer as (key: string, data: object) => { hidden?: boolean }
    expect(reducer('a', {}).hidden).toBe(true)
    expect(reducer('c', {}).hidden).toBeFalsy()
    expect(wrapper.findAll('.sigma-legend-item')[0]!.attributes('aria-pressed')).toBe('false')
  })

  it('再次点击恢复显示', async () => {
    const { wrapper, instance } = await mountControl(() => h(SigmaLegend, { field: 'type' }))

    const item = wrapper.findAll('.sigma-legend-item')[0]!
    await item.trigger('click')
    await item.trigger('click')

    // 过滤归约常驻链上，清空后不再隐藏任何节点
    const reducer = instance.settings.nodeReducer as (key: string, data: object) => { hidden?: boolean }
    expect(reducer('a', {}).hidden).toBeFalsy()
    expect(reducer('c', {}).hidden).toBeFalsy()
    expect(item.attributes('aria-pressed')).toBe('true')
  })

  it('toggleable 为 false 时条目禁用', async () => {
    const { wrapper } = await mountControl(() =>
      h(SigmaLegend, { field: 'type', toggleable: false })
    )

    expect(wrapper.find('.sigma-legend-item').attributes('disabled')).toBeDefined()
  })

  it('默认插槽可接管整个列表并拿到分组数据', async () => {
    const { wrapper } = await mountControl(() =>
      h(SigmaLegend, { field: 'type' }, {
        default: ({ groups }: { groups: Array<{ value: string, count: number }> }) =>
          groups.map(g => h('span', `${g.value}:${g.count}`))
      })
    )

    expect(wrapper.text()).toBe('管理:2技术:1')
    expect(wrapper.find('.sigma-legend-item').exists()).toBe(false)
  })
})
