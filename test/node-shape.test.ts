import { describe, expect, it } from 'vitest'
import { sdfPolygon, sdfStar } from '../src/runtime/utils/node-shape'

/** GLSL 的浮点字面量必须带小数点或指数，整数写法编译不过 */
function floatLiterals(glsl: string) {
  return glsl.match(/(?<![\w.])-?\d+(\.\d+)?(e-?\d+)?(?![\w.])/g) ?? []
}

describe('sdfPolygon', () => {
  it('产出 name 与 glsl 函数名一致的形状', () => {
    const shape = sdfPolygon()

    expect(shape.name).toBe('polygon')
    expect(shape.glsl).toContain('float sdf_polygon(vec2 uv, float size)')
  })

  it('自定义 name 同步反映到函数名，多个形状才能共存', () => {
    const shape = sdfPolygon({ name: 'hex', sides: 6 })

    expect(shape.name).toBe('hex')
    expect(shape.glsl).toContain('float sdf_hex(vec2 uv, float size)')
  })

  it('折进单个扇区求到最近边的垂直距离', () => {
    const shape = sdfPolygon({ sides: 6 })

    expect(shape.glsl).toContain('float theta = mod(a,')
    expect(shape.glsl).toContain('len * cos(theta) - size *')
  })

  it('边数不足以围出多边形时退化为圆', () => {
    const shape = sdfPolygon({ sides: 2 })

    expect(shape.glsl).toContain('return length(uv) - size;')
    expect(shape.inradiusFactor).toBeUndefined()
  })

  it('inradiusFactor 为 cos(π/n)，正方形与 sigma 内置的 sdfSquare 取值一致', () => {
    expect(sdfPolygon({ sides: 4 }).inradiusFactor).toBeCloseTo(Math.SQRT1_2, 10)
    expect(sdfPolygon({ sides: 6 }).inradiusFactor).toBeCloseTo(Math.sqrt(3) / 2, 10)
    expect(sdfPolygon({ sides: 3 }).inradiusFactor).toBeCloseTo(0.5, 10)
  })

  it('旋转量编译进 glsl 而非留作 uniform', () => {
    const shape = sdfPolygon({ sides: 5, rotation: 0.5 })

    expect(shape.glsl).toContain('- 0.5;')
  })

  it('生成的浮点字面量全部合法', () => {
    const glsl = sdfPolygon({ sides: 8, rotation: 1 }).glsl

    for (const literal of floatLiterals(glsl)) {
      expect(literal, `${literal} 缺少小数点`).toMatch(/[.e]/)
    }
  })
})

describe('sdfStar', () => {
  it('把扇区折叠到半边，只描述一条边', () => {
    const shape = sdfStar({ points: 5 })

    expect(shape.name).toBe('star')
    expect(shape.glsl).toContain('phi = min(phi,')
  })

  it('角数不足时退化为圆', () => {
    expect(sdfStar({ points: 2 }).glsl).toContain('return length(uv) - size;')
  })

  it('innerRatio 越小角越尖，内切半径随之变小', () => {
    const sharp = sdfStar({ points: 5, innerRatio: 0.3 }).inradiusFactor!
    const blunt = sdfStar({ points: 5, innerRatio: 0.7 }).inradiusFactor!

    expect(sharp).toBeLessThan(blunt)
  })

  it('innerRatio 为 1 时退化为正 2n 边形，内切比例为 cos(π/2n)', () => {
    expect(sdfStar({ points: 5, innerRatio: 1 }).inradiusFactor)
      .toBeCloseTo(Math.cos(Math.PI / 10), 10)
    expect(sdfStar({ points: 6, innerRatio: 1 }).inradiusFactor)
      .toBeCloseTo(Math.cos(Math.PI / 12), 10)
  })

  it('生成的浮点字面量全部合法', () => {
    const glsl = sdfStar({ points: 7, innerRatio: 0.4, rotation: 2 }).glsl

    for (const literal of floatLiterals(glsl)) {
      expect(literal, `${literal} 缺少小数点`).toMatch(/[.e]/)
    }
  })
})
