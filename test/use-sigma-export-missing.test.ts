import Graph from 'graphology'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import SigmaGraph from '../src/runtime/components/Graph.vue'
import { useSigmaExport } from '../src/runtime/composables/use-sigma-export'
import type { UseSigmaExportReturn } from '../src/runtime/composables/use-sigma-export'

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

// 缺包时是动态 import 本身 reject，工厂抛错才是忠实的模拟
vi.mock('@sigma/export-image', () => {
  throw new Error('Cannot find module \'@sigma/export-image\'')
})

enableAutoUnmount(afterEach)

describe('useSigmaExport 缺少可选依赖', () => {
  it('提示装哪个包，而不是抛出原始的模块解析错误', async () => {
    let api!: UseSigmaExportReturn

    const Child = defineComponent({
      setup() {
        api = useSigmaExport()
        return () => h('span')
      }
    })

    const wrapper = mount(SigmaGraph, {
      props: { graph: new Graph() } as never,
      slots: { default: () => h(Child) }
    })

    await vi.waitFor(() => {
      if (!wrapper.vm.sigma) {
        throw new Error('sigma 尚未就绪')
      }
    })

    await expect(api.download()).rejects.toThrow('pnpm add @sigma/export-image')
    await expect(api.toBlob()).rejects.toThrow('@movk/sigma')
  })
})
