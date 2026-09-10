// @vitest-environment node
// 构建期模块：happy-dom 下 import.meta.url 不是 file: 协议，fileURLToPath 会直接抛错
import { existsSync } from 'node:fs'
import { basename } from 'node:path'
import { describe, expect, it } from 'vitest'
import { sigmaAutoImportDirs, sigmaComponentResolver } from '../src/unplugin'

describe('Sigma* 组件解析器', () => {
  it('解析顶层组件到对应的 .vue 文件', () => {
    const resolved = sigmaComponentResolver().resolve('SigmaGraph')

    expect(resolved).toBeDefined()
    expect(basename(resolved!.from)).toBe('Graph.vue')
    expect(resolved!.name).toBe('default')
  })

  it('controls 子目录不进组件名，与 pathPrefix: false 对齐', () => {
    const resolve = sigmaComponentResolver().resolve

    expect(basename(resolve('SigmaZoomControl')!.from)).toBe('ZoomControl.vue')
    expect(basename(resolve('SigmaMiniMap')!.from)).toBe('MiniMap.vue')
    expect(resolve('SigmaControlsZoomControl')).toBeUndefined()
  })

  it('前缀不匹配或组件不存在时不接管解析', () => {
    const resolve = sigmaComponentResolver().resolve

    expect(resolve('UButton')).toBeUndefined()
    expect(resolve('SigmaNotAComponent')).toBeUndefined()
  })

  it('自定义前缀生效', () => {
    const resolve = sigmaComponentResolver({ prefix: 'Sg' }).resolve

    expect(basename(resolve('SgGraph')!.from)).toBe('Graph.vue')
    expect(resolve('SigmaGraph')).toBeUndefined()
  })
})

describe('自动导入目录', () => {
  it('给出 composables 与 utils 两个真实存在的目录', () => {
    const dirs = sigmaAutoImportDirs()

    expect(dirs).toHaveLength(2)
    expect(dirs.map(dir => basename(dir))).toEqual(['composables', 'utils'])
    expect(dirs.every(dir => existsSync(dir))).toBe(true)
  })
})
