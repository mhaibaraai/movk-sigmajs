import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import * as vueEntry from '../src/runtime/index'

const RUNTIME_DIR = resolve(process.cwd(), 'src/runtime')

/** 递归收集 runtime/components 下的 .vue 裸文件名，对齐 addComponentsDir 的 pathPrefix: false */
function componentNames(): string[] {
  const dir = resolve(RUNTIME_DIR, 'components')
  return (readdirSync(dir, { recursive: true }) as string[])
    .filter(file => file.endsWith('.vue'))
    .map(file => file.slice(file.lastIndexOf('/') + 1, -'.vue'.length))
}

/** 目录下每个模块的具名导出，供比对 barrel 是否漏掉文件 */
async function directoryExports(name: string): Promise<string[]> {
  const dir = resolve(RUNTIME_DIR, name)
  const files = readdirSync(dir).filter(file => file.endsWith('.ts'))
  const modules = await Promise.all(files.map(file => import(resolve(dir, file))))
  return modules.flatMap(module => Object.keys(module)).filter(key => key !== 'default')
}

describe('@movk/sigma/vue 具名导出入口', () => {
  it('组件全部导出，且与 Nuxt 侧的自动导入命名一致', () => {
    const expected = componentNames().map(name => `Sigma${name}`).sort()
    const actual = Object.keys(vueEntry).filter(key => key.startsWith('Sigma')).sort()

    expect(actual).toEqual(expect.arrayContaining(expected))
    expect(expected.filter(name => !actual.includes(name))).toEqual([])
  })

  it('composables 目录的具名导出无遗漏', async () => {
    const missing = (await directoryExports('composables')).filter(name => !(name in vueEntry))

    expect(missing).toEqual([])
  })

  it('utils 目录的具名导出无遗漏', async () => {
    const missing = (await directoryExports('utils')).filter(name => !(name in vueEntry))

    expect(missing).toEqual([])
  })

  it('运行时配置读写一并出口', () => {
    expect(typeof vueEntry.getSigmaConfig).toBe('function')
    expect(typeof vueEntry.setSigmaConfig).toBe('function')
  })
})
