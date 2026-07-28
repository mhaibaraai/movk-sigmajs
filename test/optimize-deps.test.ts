import { tmpdir } from 'node:os'
import { describe, expect, it } from 'vitest'
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
