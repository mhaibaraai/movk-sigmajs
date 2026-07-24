import Graph from 'graphology'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import SigmaGraph from '../src/runtime/components/Graph.vue'
import { useSigmaExport } from '../src/runtime/composables/use-sigma-export'
import type { UseSigmaExportReturn } from '../src/runtime/composables/use-sigma-export'

const state = vi.hoisted(() => ({
  downloads: [] as Array<Record<string, unknown>>,
  blobs: [] as Array<Record<string, unknown>>
}))

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

vi.mock('@sigma/export-image', () => ({
  async downloadAsPNG(_sigma: unknown, options: Record<string, unknown>) {
    state.downloads.push(options)
  },
  async toBlob(_sigma: unknown, options: Record<string, unknown>) {
    state.blobs.push(options)
    return new Blob(['x'], { type: 'image/png' })
  }
}))

async function mountExport() {
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

  return api
}

enableAutoUnmount(afterEach)

beforeEach(() => {
  state.downloads.length = 0
  state.blobs.length = 0
})

describe('useSigmaExport', () => {
  it('默认文件名不会出现重复扩展名', async () => {
    const api = await mountExport()
    await api.download()

    expect(state.downloads[0]).toMatchObject({ fileName: 'graph' })
  })

  it('调用方写不写 .png 得到的文件名一致', async () => {
    const api = await mountExport()

    await api.download('报告.png')
    await api.download('报告')

    expect(state.downloads.map(d => d.fileName)).toEqual(['报告', '报告'])
  })

  it('只剥末尾的扩展名，不影响名字中间的 png', async () => {
    const api = await mountExport()
    await api.download('png-图谱.png')

    expect(state.downloads[0]).toMatchObject({ fileName: 'png-图谱' })
  })

  it('未指定尺寸与图层时传 null，对应上游的「全部」', async () => {
    const api = await mountExport()
    await api.download()

    expect(state.downloads[0]).toMatchObject({ layers: null, width: null, height: null })
  })

  it('省略背景色时不写入该字段，保留上游的透明默认值', async () => {
    const api = await mountExport()
    await api.download()

    expect(state.downloads[0]).not.toHaveProperty('backgroundColor')
  })

  it('显式传入的选项透传给上游', async () => {
    const api = await mountExport()
    await api.download('x', { width: 800, height: 600, backgroundColor: '#fff', layers: ['nodes'] })

    expect(state.downloads[0]).toMatchObject({
      width: 800,
      height: 600,
      backgroundColor: '#fff',
      layers: ['nodes']
    })
  })

  it('toBlob 返回 PNG 数据', async () => {
    const api = await mountExport()
    const blob = await api.toBlob()

    expect(blob.type).toBe('image/png')
    expect(state.blobs).toHaveLength(1)
  })

  it('导出前后 isExporting 复位', async () => {
    const api = await mountExport()

    expect(api.isExporting.value).toBe(false)
    await api.download()
    expect(api.isExporting.value).toBe(false)
  })
})
