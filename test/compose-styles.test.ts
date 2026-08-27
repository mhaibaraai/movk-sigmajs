import { describe, expect, it } from 'vitest'
import { composeStyles } from '../src/runtime/utils/compose-styles'
import type { StylesDeclaration } from 'sigma/types'

const base = { nodes: { color: '#base' }, edges: { color: '#base' } } as StylesDeclaration
const user = { nodes: { color: '#user' } } as StylesDeclaration
const library = { nodes: [{ color: '#lib' }], edges: [{ color: '#lib' }] } as StylesDeclaration

describe('composeStyles', () => {
  it('按传入次序拼接，后者排在后面才盖得住前者', () => {
    const composed = composeStyles(base, user, library) as { nodes: unknown[] }

    expect(composed.nodes).toEqual([{ color: '#base' }, { color: '#user' }, { color: '#lib' }])
  })

  it('单条规则与规则数组一视同仁地摊平', () => {
    const composed = composeStyles(
      { nodes: { color: '#a' } } as StylesDeclaration,
      { nodes: [{ color: '#b' }, { color: '#c' }] } as StylesDeclaration
    ) as { nodes: unknown[] }

    expect(composed.nodes).toHaveLength(3)
  })

  it('跳过 undefined 的来源', () => {
    const composed = composeStyles(undefined, user, undefined) as { nodes: unknown[] }

    expect(composed.nodes).toEqual([{ color: '#user' }])
  })

  it('某一侧全空时不产出该键，交回 sigma 自己的默认值', () => {
    const composed = composeStyles(user)

    expect(composed.edges).toBeUndefined()
    expect(composed.stage).toBeUndefined()
  })

  it('stage 规则同样按序拼接', () => {
    const composed = composeStyles(
      { stage: { background: '#111' } } as StylesDeclaration,
      { stage: { background: '#222' } } as StylesDeclaration
    ) as { stage: unknown[] }

    expect(composed.stage).toEqual([{ background: '#111' }, { background: '#222' }])
  })
})
