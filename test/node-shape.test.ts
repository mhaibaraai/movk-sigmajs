import { describe, expect, it } from 'vitest'
import { buildNodeShapeShaders } from '../src/runtime/programs/node-shape'

describe('buildNodeShapeShaders 形状选型', () => {
  it('默认走正多边形，片元里带折扇区的距离函数', () => {
    const { fragment } = buildNodeShapeShaders()

    expect(fragment).toContain('float shapeDistance(vec2 p)')
    expect(fragment).toContain('float theta = mod(a,')
    expect(fragment).toContain('float dist = shapeDistance(v_diffVector);')
  })

  it('circle 退化为纯半径，不引入相机角度', () => {
    const { fragment } = buildNodeShapeShaders({ shape: 'circle' })

    expect(fragment).toContain('return length(p);')
    expect(fragment).not.toContain('u_cameraAngle')
  })

  it('边数不足以围出多边形时退化为圆', () => {
    const { fragment } = buildNodeShapeShaders({ sides: 2 })

    expect(fragment).toContain('return length(p);')
  })

  it('star 把扇区折叠到半边，只描述一条边', () => {
    const { fragment } = buildNodeShapeShaders({ shape: 'star', sides: 5 })

    expect(fragment).toContain('phi = min(phi,')
  })

  it('拾取分支与可见轮廓用同一个距离函数', () => {
    const { fragment } = buildNodeShapeShaders()
    const picking = fragment.slice(fragment.indexOf('#ifdef PICKING_MODE', fragment.indexOf('void main')))

    expect(picking).toContain('if (dist > v_radius)')
  })
})

describe('buildNodeShapeShaders 相机角度', () => {
  it('默认抵消相机旋转，声明并使用 u_cameraAngle', () => {
    const { fragment } = buildNodeShapeShaders({ sides: 6 })

    expect(fragment).toContain('uniform float u_cameraAngle;')
    expect(fragment).toContain('+ u_cameraAngle)')
  })

  it('followCamera 时不引入相机角度', () => {
    const { fragment } = buildNodeShapeShaders({ sides: 6, followCamera: true })

    expect(fragment).not.toContain('u_cameraAngle')
  })
})

describe('buildNodeShapeShaders 描边展开', () => {
  it('属性取色的层在两个着色器里都声明为 varying', () => {
    const { fragment, vertex } = buildNodeShapeShaders({
      borders: [
        { size: { value: 2, mode: 'pixels' }, color: { attribute: 'borderColor' } },
        { size: { fill: true }, color: { attribute: 'color' } }
      ]
    })

    expect(vertex).toContain('attribute vec4 a_borderColor_1;')
    expect(vertex).toContain('varying vec4 v_borderColor_1;')
    expect(vertex).toContain('v_borderColor_2 = a_borderColor_2;')
    expect(fragment).toContain('varying vec4 v_borderColor_1;')
  })

  it('固定取色的层走 uniform', () => {
    const { fragment, vertex } = buildNodeShapeShaders({
      borders: [
        { size: { value: 0.2 }, color: { value: '#ff0000' } },
        { size: { fill: true }, color: { attribute: 'color' } }
      ]
    })

    expect(fragment).toContain('uniform vec4 u_borderColor_1;')
    expect(vertex).not.toContain('a_borderColor_1')
  })

  it('pixels 模式按修正比例算厚度，relative 按半径', () => {
    const pixels = buildNodeShapeShaders({
      borders: [{ size: { value: 2, mode: 'pixels' }, color: { attribute: 'c' } }, { size: { fill: true }, color: { attribute: 'color' } }]
    }).fragment
    const relative = buildNodeShapeShaders({
      borders: [{ size: { value: 0.2 }, color: { attribute: 'c' } }, { size: { fill: true }, color: { attribute: 'color' } }]
    }).fragment

    expect(pixels).toContain('float borderSize_1 = u_correctionRatio *')
    expect(relative).toContain('float borderSize_1 = v_radius *')
  })

  it('属性取厚度的层声明为 varying', () => {
    const { fragment, vertex } = buildNodeShapeShaders({
      borders: [
        { size: { attribute: 'thickness', defaultValue: 1, mode: 'pixels' }, color: { attribute: 'borderColor' } },
        { size: { fill: true }, color: { attribute: 'color' } }
      ]
    })

    expect(vertex).toContain('attribute float a_borderSize_1;')
    expect(fragment).toContain('varying float v_borderSize_1;')
    expect(fragment).toContain('float borderSize_1 = u_correctionRatio * v_borderSize_1;')
  })

  it('fill 层均分剩余空间，层数正确进入除数', () => {
    const { fragment } = buildNodeShapeShaders({
      borders: [
        { size: { value: 0.1 }, color: { attribute: 'borderColor' } },
        { size: { fill: true }, color: { attribute: 'color' } },
        { size: { fill: true }, color: { transparent: true } }
      ]
    })

    expect(fragment).toContain('float borderSize_2 = fillBorderSize;')
    expect(fragment).toContain('float borderSize_3 = fillBorderSize;')
    expect(fragment).toContain(') ) / 2.0;')
  })

  it('全是 fill 层时剩余空间的减数不会留下空表达式', () => {
    const { fragment } = buildNodeShapeShaders({
      borders: [{ size: { fill: true }, color: { attribute: 'color' } }]
    })

    expect(fragment).toContain('float fillBorderSize = (v_radius - (0.0) ) / 1.0;')
  })

  it('透明层展开为全零颜色', () => {
    const { fragment } = buildNodeShapeShaders({
      borders: [
        { size: { value: 0.1 }, color: { transparent: true } },
        { size: { fill: true }, color: { attribute: 'color' } }
      ]
    })

    expect(fragment).toContain('vec4 borderColor_1 = vec4(0.0, 0.0, 0.0, 0.0);')
  })
})

describe('buildNodeShapeShaders 顶点几何', () => {
  it('顶点着色器不随形状改变，始终发包住外接圆的三角形', () => {
    const polygon = buildNodeShapeShaders({ sides: 6 }).vertex
    const star = buildNodeShapeShaders({ shape: 'star', sides: 6 }).vertex

    expect(polygon).toBe(star)
    expect(polygon).toContain('float size = a_size * u_correctionRatio / u_sizeRatio * 4.0;')
    expect(polygon).toContain('v_radius = size / 2.0;')
  })
})
