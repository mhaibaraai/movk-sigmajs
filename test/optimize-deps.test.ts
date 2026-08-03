import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import Module, { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import type { OptimizeDepCandidate, OptimizeDepResolver } from '../src/optimize-deps'
import { createOptimizeDepResolver, OPTIMIZE_DEPS_CANDIDATES, resolveOptimizeDepsInclude } from '../src/optimize-deps'

/**
 * 假 resolver：installed 列出「装了的」id，nested 以 `parent > child` 形式列出
 * 能从宿主目录解析到的传递依赖。未列出的一律当作没装
 */
function fakeResolver(installed: string[], nested: string[] = []): OptimizeDepResolver {
  return {
    canResolve(id, fromDir) {
      return fromDir ? nested.includes(`${fromDir} > ${id}`) : installed.includes(id)
    },
    packageBase(id) {
      return installed.includes(id) ? id : null
    }
  }
}

const CANDIDATES: OptimizeDepCandidate[] = [
  { id: 'graphology' },
  { id: 'graphology-layout' },
  { id: 'events', parent: 'graphology' },
  { id: 'graphology-utils/is-graph', parent: 'graphology-layout' }
]

describe('resolveOptimizeDepsInclude', () => {
  it('装齐时产出全量清单，嵌套条目呈 parent > child 形态', () => {
    const resolver = fakeResolver(
      ['graphology', 'graphology-layout'],
      ['graphology > events', 'graphology-layout > graphology-utils/is-graph']
    )

    expect(resolveOptimizeDepsInclude(resolver, CANDIDATES)).toEqual([
      'graphology',
      'graphology-layout',
      'graphology > events',
      'graphology-layout > graphology-utils/is-graph'
    ])
  })

  it('未安装的可选 peer 被跳过，其余条目不受影响', () => {
    const resolver = fakeResolver(['graphology'], ['graphology > events'])

    expect(resolveOptimizeDepsInclude(resolver, CANDIDATES)).toEqual(['graphology', 'graphology > events'])
  })

  it('嵌套条目的宿主缺失时子条目一并跳过', () => {
    const resolver = fakeResolver(['graphology'], ['graphology-layout > graphology-utils/is-graph'])

    expect(resolveOptimizeDepsInclude(resolver, CANDIDATES)).toEqual(['graphology'])
  })

  it('宿主在但传递依赖解析不到时跳过该条目', () => {
    const resolver = fakeResolver(['graphology', 'graphology-layout'], [])

    expect(resolveOptimizeDepsInclude(resolver, CANDIDATES)).toEqual(['graphology', 'graphology-layout'])
  })

  it('输出去重且保序，不修改传入的候选数组', () => {
    const candidates: OptimizeDepCandidate[] = [{ id: 'sigma' }, { id: 'graphology' }, { id: 'sigma' }]
    const snapshot = [...candidates]

    expect(resolveOptimizeDepsInclude(fakeResolver(['sigma', 'graphology']), candidates)).toEqual(['sigma', 'graphology'])
    expect(candidates).toEqual(snapshot)
  })

  it('内置候选清单本身不含重复条目', () => {
    const keys = OPTIMIZE_DEPS_CANDIDATES.map(({ id, parent }) => (parent ? `${parent} > ${id}` : id))

    expect(new Set(keys).size).toBe(keys.length)
  })
})

describe('createOptimizeDepResolver', () => {
  const resolver = createOptimizeDepResolver(process.cwd())

  it('解析得到已安装的包与深层入口', () => {
    expect(resolver.canResolve('graphology')).toBe(true)
    expect(resolver.canResolve('graphology-metrics/centrality/betweenness')).toBe(true)
  })

  it('未安装的包判定为不可解析', () => {
    expect(resolver.canResolve('@movk/definitely-not-installed')).toBe(false)
    expect(resolver.packageBase('@movk/definitely-not-installed')).toBe(null)
  })

  it('与 Node 内置同名的传递依赖靠 package.json 回退判定', () => {
    const base = resolver.packageBase('graphology')

    expect(base).toBeTruthy()
    expect(resolver.canResolve('events', base!)).toBe(true)
  })

  it('传递依赖从宿主目录解析，从消费方根部则不一定可见', () => {
    const base = resolver.packageBase('graphology-layout')

    expect(base).toBeTruthy()
    expect(resolver.canResolve('graphology-utils/is-graph', base!)).toBe(true)
  })

  it('什么都没装的项目根产出空清单，Vite 拿不到任何解析不了的条目', () => {
    expect(resolveOptimizeDepsInclude(createOptimizeDepResolver(tmpdir()))).toEqual([])
  })
})

/** NODE_PATH 只在进程启动时读进 Module.globalPaths，运行时改了得手动重算 */
const nodeModule = Module as unknown as { _initPaths: () => void }

describe('createOptimizeDepResolver 与 NODE_PATH', () => {
  const originalNodePath = process.env.NODE_PATH
  const workspaces: string[] = []

  afterEach(() => {
    if (originalNodePath === undefined) {
      delete process.env.NODE_PATH
    }
    else {
      process.env.NODE_PATH = originalNodePath
    }
    nodeModule._initPaths()

    for (const workspace of workspaces.splice(0)) {
      rmSync(workspace, { recursive: true, force: true })
    }
  })

  it('只在 NODE_PATH 上可见的包判定为不可解析', () => {
    // pnpm 跑脚本时会把 .pnpm 的 hoist 目录塞进 NODE_PATH，里面躺着一堆没链到项目根的包
    const workspace = realpathSync(mkdtempSync(join(tmpdir(), 'movk-sigma-node-path-')))
    workspaces.push(workspace)

    const hoistRoot = join(workspace, 'hoisted', 'node_modules')
    const hoisted = join(hoistRoot, 'fake-hoisted')
    mkdirSync(hoisted, { recursive: true })
    writeFileSync(join(hoisted, 'package.json'), JSON.stringify({ name: 'fake-hoisted', version: '1.0.0', main: 'index.js' }))
    writeFileSync(join(hoisted, 'index.js'), 'module.exports = {}\n')

    const projectDir = join(workspace, 'project')
    mkdirSync(projectDir)

    process.env.NODE_PATH = hoistRoot
    nodeModule._initPaths()

    // 前提：require.resolve 确实认 NODE_PATH，否则这条用例证明不了任何事
    expect(createRequire(join(projectDir, 'package.json')).resolve('fake-hoisted')).toBe(join(hoisted, 'index.js'))

    // Vite 的解析器不认 NODE_PATH，探测跟着它走才不会产出解析不了的 include 条目
    expect(createOptimizeDepResolver(projectDir).canResolve('fake-hoisted')).toBe(false)
  })
})
