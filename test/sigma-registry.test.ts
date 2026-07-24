import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Graph from 'graphology'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { consola } from 'consola'
import SigmaGraph from '../src/runtime/components/Graph.vue'
import { useSigma, useSigmaById, useSigmaIds } from '../src/runtime/composables/use-sigma'
import type { SigmaContext } from '../src/runtime/types'

vi.mock('sigma', () => {
  class MockSigma {
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

function mountGraph(id: string) {
  return mount(SigmaGraph, { props: { id, graph: new Graph() } as never })
}

async function waitReady(wrapper: ReturnType<typeof mountGraph>) {
  await vi.waitFor(() => {
    if (!wrapper.vm.sigma) {
      throw new Error('sigma 尚未就绪')
    }
  })
}

enableAutoUnmount(afterEach)

describe('实例注册表', () => {
  it('先取引用、后挂载实例，引用会自动填上', async () => {
    // 这是缺陷回归防线：注册表若非响应式，此处会永远停在 undefined
    const context = useSigmaById('late')
    expect(context.value).toBeUndefined()

    const wrapper = mountGraph('late')
    await waitReady(wrapper)
    await nextTick()

    expect(context.value).toBeDefined()
    expect(context.value!.isReady.value).toBe(true)
  })

  it('卸载后引用自动回到 undefined', async () => {
    const wrapper = mountGraph('transient')
    await waitReady(wrapper)

    const context = useSigmaById('transient')
    expect(context.value).toBeDefined()

    wrapper.unmount()
    await nextTick()

    expect(context.value).toBeUndefined()
  })

  it('id 可以是响应式的，切换后指向另一个实例', async () => {
    // 必须顺序挂载：同一 tick 内并发 import('sigma') 会让 vitest 的 mock 漏掉一个
    const first = mountGraph('one')
    await waitReady(first)
    const second = mountGraph('two')
    await waitReady(second)
    await nextTick()

    const id = ref('one')
    const context = useSigmaById(id)
    const before = context.value

    id.value = 'two'

    expect(before).toBeDefined()
    expect(context.value).toBeDefined()
    expect(context.value).not.toBe(before)
  })

  it('取出的是原生实例本身，未被响应式代理', async () => {
    let inner!: SigmaContext

    const Child = defineComponent({
      setup() {
        inner = useSigma()
        return () => h('span')
      }
    })

    const wrapper = mount(SigmaGraph, {
      props: { id: 'raw', graph: new Graph() } as never,
      slots: { default: () => h(Child) }
    })
    await waitReady(wrapper)
    await nextTick()

    const outer = useSigmaById('raw').value!

    // shallowReactive 只追踪键的增删，不深度包装值；这条守的是「不代理实例」红线
    expect(outer).toBe(inner)
    expect(outer.sigma.value).toBe(inner.sigma.value)
    expect(outer.graph.value).toBe(inner.graph.value)
  })

  it('已登记的 id 列表随挂载与卸载更新', async () => {
    const ids = useSigmaIds()
    const before = ids.value.length

    const wrapper = mountGraph('listed')
    await waitReady(wrapper)
    await nextTick()
    expect(ids.value).toContain('listed')

    wrapper.unmount()
    await nextTick()
    expect(ids.value).not.toContain('listed')
    expect(ids.value.length).toBe(before)
  })

  it('两个实例真的抢同一个 id 时告警', async () => {
    const warn = vi.spyOn(consola, 'warn').mockImplementation(() => {})

    // 顺序挂载，理由同上
    const first = mountGraph('clash')
    await waitReady(first)
    const second = mountGraph('clash')
    await waitReady(second)
    await nextTick()

    expect(warn).toHaveBeenCalledOnce()
    expect(String(warn.mock.calls[0]![0])).toContain('clash')

    warn.mockRestore()
  })

  it('组件替换时的交接不误报', async () => {
    const warn = vi.spyOn(consola, 'warn').mockImplementation(() => {})

    // 新实例在 setup 期注册、旧实例到 onBeforeUnmount 才注销，
    // 同步判断会把这种正常交接当成冲突。HMR、路由切换、过渡动画都是这个时序
    const outgoing = mountGraph('handover')
    await waitReady(outgoing)

    const incoming = mountGraph('handover')
    outgoing.unmount()
    await waitReady(incoming)
    await nextTick()

    expect(warn).not.toHaveBeenCalled()
    expect(useSigmaById('handover').value).toBeDefined()

    warn.mockRestore()
  })

  it('注册路径带客户端保护，避免模块级注册表在 SSR 期只增不减', () => {
    // SSR 不触发 onBeforeUnmount，若照常登记，模块级注册表的条目会跨请求残留，
    // 后续渲染还会被误判成 id 冲突；何况服务端 sigma 恒为 null，登记本身没有意义。
    // 测试环境里 import.meta.client 被替换为 true，无法从行为上覆盖服务端分支，
    // 故直接锁住源码结构，防止守卫被误删
    // vitest 里 import.meta.url 不是 file: 协议，用工作目录定位
    const source = readFileSync(resolve(process.cwd(), 'src/runtime/components/Graph.vue'), 'utf8')

    expect(source).toMatch(/if \(props\.id && import\.meta\.client\)/)
  })
})
