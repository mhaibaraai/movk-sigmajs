import { NodeProgram, numberToGLSLFloat } from 'sigma/rendering'
import { colorToArray, floatColor } from 'sigma/utils'
import type { Attributes } from 'graphology-types'
import type { NodeHoverDrawingFunction, NodeLabelDrawingFunction, NodeProgramType, ProgramInfo } from 'sigma/rendering'
import type { NodeDisplayData, RenderParams } from 'sigma/types'

/** 描边厚度的计量方式：按节点半径的比例，或固定像素 */
export type SigmaNodeBorderSizeMode = 'relative' | 'pixels'

export type SigmaNodeBorderColor
  = | { value: string }
    | { attribute: string, defaultValue?: string }
    | { transparent: true }

export type SigmaNodeBorderSize
  = | { value: number, mode?: SigmaNodeBorderSizeMode }
    | { attribute: string, defaultValue: number, mode?: SigmaNodeBorderSizeMode }
    | { fill: true }

/** 一层描边环。由外向内依次绘制，`fill` 层均分剩余空间 */
export interface SigmaNodeBorder {
  color: SigmaNodeBorderColor
  size: SigmaNodeBorderSize
}

/** 节点轮廓的形状族 */
export type SigmaNodeShape = 'circle' | 'polygon' | 'star'

export interface CreateNodeShapeProgramOptions<
  N extends Attributes = Attributes,
  E extends Attributes = Attributes,
  G extends Attributes = Attributes
> {
  /**
   * 轮廓形状。`polygon` 为正多边形，`star` 为正星形，`circle` 退化为圆
   * @defaultValue 'polygon'
   */
  shape?: SigmaNodeShape
  /**
   * 正多边形的边数，或星形的角数。小于 3 时退化为圆
   * @defaultValue 6
   */
  sides?: number
  /**
   * 星形的内接半径与外接半径之比，仅 `shape: 'star'` 时生效
   * @defaultValue 0.5
   */
  innerRatio?: number
  /**
   * 整体旋转量（弧度）。0 时首个顶点朝向屏幕右方，正值顺时针，与 `polygonExtent()` 同义
   * @defaultValue 0
   */
  rotation?: number
  /**
   * 形状是否跟随相机旋转。默认抵消相机角度，让节点在任何视角下都保持正立
   * @defaultValue false
   */
  followCamera?: boolean
  /**
   * 由外向内的描边层。与 `@sigma/node-border` 同形，缺省为 10% 厚的 `borderColor` 描边
   * 加一层 `color` 填充
   * @defaultValue `[{ size: { value: 0.1 }, color: { attribute: 'borderColor' } }, { size: { fill: true }, color: { attribute: 'color' } }]`
   */
  borders?: SigmaNodeBorder[]
  /** 覆盖该形状节点的标签绘制，缺省用 sigma 的 `defaultDrawNodeLabel` */
  drawLabel?: NodeLabelDrawingFunction<N, E, G>
  /** 覆盖该形状节点的悬停绘制，缺省用 sigma 的 `defaultDrawNodeHover` */
  drawHover?: NodeHoverDrawingFunction<N, E, G>
}

const DEFAULT_BORDER_SIZE_MODE: SigmaNodeBorderSizeMode = 'relative'

const DEFAULT_COLOR = '#000000'

const DEFAULT_BORDERS: SigmaNodeBorder[] = [
  { size: { value: 0.1 }, color: { attribute: 'borderColor' } },
  { size: { fill: true }, color: { attribute: 'color' } }
]

type ResolvedOptions = Required<Omit<CreateNodeShapeProgramOptions, 'drawLabel' | 'drawHover'>>

function resolveOptions(options: CreateNodeShapeProgramOptions = {}): ResolvedOptions {
  const sides = options.sides ?? 6

  return {
    // 边数不足以围出多边形时没有别的合理解释，退化为圆而不是抛错——
    // 一条退化数据不该让整张图渲染不出来
    shape: sides < 3 && options.shape !== 'circle' ? 'circle' : options.shape ?? 'polygon',
    sides,
    innerRatio: options.innerRatio ?? 0.5,
    rotation: options.rotation ?? 0,
    followCamera: options.followCamera ?? false,
    borders: options.borders ?? DEFAULT_BORDERS
  }
}

/**
 * 形状的有向距离函数，返回值是「等效外接半径」——点落在轮廓上时恰好等于 `v_radius`。
 *
 * 之所以要归一到外接半径而不是几何距离，是为了让描边逻辑原样复用：多环描边全部是拿
 * 距离与 `v_radius` 的比例阈值相比，量纲一致才不必逐形状重推阈值。
 */
function getDistanceFunction(options: ResolvedOptions): string {
  const { shape, sides, innerRatio, rotation, followCamera } = options

  if (shape === 'circle') {
    return `
float shapeDistance(vec2 p) {
  return length(p);
}
`
  }

  const segment = (2 * Math.PI) / sides
  // rotation 取负：v_diffVector 的 y 轴朝上，而 rotation 与标签系统统一按屏幕坐标
  // （y 轴朝下、顺时针为正）声明，两边同一个数值才能描述同一个方向。
  // 相机角度则在 v_diffVector 自己的坐标系里抵消，形状因此在屏幕上保持正立；
  // 反过来若改顶点角度，覆盖三角形会跟着转，边缘会被裁掉
  const angleOffset = followCamera
    ? numberToGLSLFloat(-rotation)
    : `${numberToGLSLFloat(-rotation)} + u_cameraAngle`

  if (shape === 'star') {
    const beta = Math.PI / sides
    const edgeX = innerRatio * Math.cos(beta) - 1
    const edgeY = innerRatio * Math.sin(beta)
    const edgeLength = Math.hypot(edgeX, edgeY)
    // 外接半径为 1 时，外顶点与相邻内顶点连成的边到中心的距离及其法线方向
    const apothem = edgeLength === 0 ? 1 : (innerRatio * Math.sin(beta)) / edgeLength
    const normalAngle = Math.atan2(1 - innerRatio * Math.cos(beta), innerRatio * Math.sin(beta))

    return `
float shapeDistance(vec2 p) {
  float len = length(p);
  if (len == 0.0) return 0.0;

  float a = atan(p.y, p.x) - (${angleOffset});
  float phi = mod(a, ${numberToGLSLFloat(segment)});
  // 每个角关于自身中轴对称，折叠到半个扇区即可只描述一条边
  phi = min(phi, ${numberToGLSLFloat(segment)} - phi);

  return len * cos(phi - ${numberToGLSLFloat(normalAngle)}) / ${numberToGLSLFloat(apothem)};
}
`
  }

  const half = segment / 2

  return `
float shapeDistance(vec2 p) {
  float len = length(p);
  if (len == 0.0) return 0.0;

  float a = atan(p.y, p.x) - (${angleOffset});
  // 折进单个扇区并以中轴为零点，顶点方向取到 cos 的极小值、边中点方向取到极大值
  float theta = mod(a, ${numberToGLSLFloat(segment)}) - ${numberToGLSLFloat(half)};

  return len * cos(theta) / ${numberToGLSLFloat(Math.cos(half))};
}
`
}

function getFragmentShader(options: ResolvedOptions): string {
  const { borders, shape, followCamera } = options
  const fillCounts = numberToGLSLFloat(borders.filter(({ size }) => 'fill' in size).length)
  const needsCameraAngle = shape !== 'circle' && !followCamera

  const sizes = borders.flatMap(({ size }, i) => {
    if ('fill' in size) {
      return []
    }
    const value = 'attribute' in size ? `v_borderSize_${i + 1}` : numberToGLSLFloat(size.value)
    const factor = (size.mode || DEFAULT_BORDER_SIZE_MODE) === 'pixels' ? 'u_correctionRatio' : 'v_radius'

    return [`  float borderSize_${i + 1} = ${factor} * ${value};`]
  })

  const colors = borders.map(({ color }, i) => {
    const declaration = 'attribute' in color
      ? `  vec4 borderColor_${i + 1} = v_borderColor_${i + 1};`
      : 'transparent' in color
        ? `  vec4 borderColor_${i + 1} = vec4(0.0, 0.0, 0.0, 0.0);`
        : `  vec4 borderColor_${i + 1} = u_borderColor_${i + 1};`

    return [
      declaration,
      `  borderColor_${i + 1}.a *= bias;`,
      // 薄到看不见的环直接继承外侧颜色，避免亚像素宽度下的闪烁
      `  if (borderSize_${i + 1} <= 1.0 * u_correctionRatio) { borderColor_${i + 1} = borderColor_${i}; }`
    ].join('\n')
  })

  return `
precision highp float;

varying vec2 v_diffVector;
varying float v_radius;

#ifdef PICKING_MODE
varying vec4 v_color;
#else
${borders.flatMap(({ size }, i) => 'attribute' in size ? [`varying float v_borderSize_${i + 1};`] : []).join('\n')}
${borders.flatMap(({ color }, i) => 'attribute' in color
  ? [`varying vec4 v_borderColor_${i + 1};`]
  : 'value' in color ? [`uniform vec4 u_borderColor_${i + 1};`] : []).join('\n')}
#endif

uniform float u_correctionRatio;
${needsCameraAngle ? 'uniform float u_cameraAngle;' : ''}

const float bias = 255.0 / 254.0;
const vec4 transparent = vec4(0.0, 0.0, 0.0, 0.0);
${getDistanceFunction(options)}
void main(void) {
  float dist = shapeDistance(v_diffVector);
  float aaBorder = 2.0 * u_correctionRatio;
  float v_borderSize_0 = v_radius;
  vec4 v_borderColor_0 = transparent;

  // 拾取模式与可见轮廓必须用同一个距离函数，否则点得中的区域与看得见的形状对不上
  #ifdef PICKING_MODE
  if (dist > v_radius)
    gl_FragColor = transparent;
  else {
    gl_FragColor = v_color;
    gl_FragColor.a *= bias;
  }
  #else
${sizes.join('\n')}
  float fillBorderSize = (v_radius - (${borders.flatMap(({ size }, i) => !('fill' in size) ? [`borderSize_${i + 1}`] : []).join(' + ') || '0.0'}) ) / ${fillCounts};
${borders.flatMap(({ size }, i) => 'fill' in size ? [`  float borderSize_${i + 1} = fillBorderSize;`] : []).join('\n')}

  float adjustedBorderSize_0 = v_radius;
${borders.map((_, i) => `  float adjustedBorderSize_${i + 1} = adjustedBorderSize_${i} - borderSize_${i + 1};`).join('\n')}

  vec4 borderColor_0 = transparent;
${colors.join('\n')}
  if (dist > adjustedBorderSize_0) {
    gl_FragColor = borderColor_0;
  } else ${borders.map((_, i) => `if (dist > adjustedBorderSize_${i} - aaBorder) {
    gl_FragColor = mix(borderColor_${i + 1}, borderColor_${i}, (dist - adjustedBorderSize_${i} + aaBorder) / aaBorder);
  } else if (dist > adjustedBorderSize_${i + 1}) {
    gl_FragColor = borderColor_${i + 1};
  } else `).join('')} { /* Nothing to add here */ }
  #endif
}
`
}

function getVertexShader(options: ResolvedOptions): string {
  const { borders } = options

  return `
attribute vec2 a_position;
attribute float a_size;
attribute float a_angle;

uniform mat3 u_matrix;
uniform float u_sizeRatio;
uniform float u_correctionRatio;

varying vec2 v_diffVector;
varying float v_radius;

#ifdef PICKING_MODE
attribute vec4 a_id;
varying vec4 v_color;
#else
${borders.flatMap(({ size }, i) => 'attribute' in size
  ? [`attribute float a_borderSize_${i + 1};`, `varying float v_borderSize_${i + 1};`]
  : []).join('\n')}
${borders.flatMap(({ color }, i) => 'attribute' in color
  ? [`attribute vec4 a_borderColor_${i + 1};`, `varying vec4 v_borderColor_${i + 1};`]
  : []).join('\n')}
#endif

void main() {
  float size = a_size * u_correctionRatio / u_sizeRatio * 4.0;
  vec2 diffVector = size * vec2(cos(a_angle), sin(a_angle));
  vec2 position = a_position + diffVector;
  gl_Position = vec4(
    (u_matrix * vec3(position, 1)).xy,
    0,
    1
  );

  v_radius = size / 2.0;
  v_diffVector = diffVector;

  #ifdef PICKING_MODE
  v_color = a_id;
  #else
${borders.flatMap(({ size }, i) => 'attribute' in size ? [`  v_borderSize_${i + 1} = a_borderSize_${i + 1};`] : []).join('\n')}
${borders.flatMap(({ color }, i) => 'attribute' in color ? [`  v_borderColor_${i + 1} = a_borderColor_${i + 1};`] : []).join('\n')}
  #endif
}
`
}

/**
 * 生成一份形状程序的着色器源码。
 *
 * 程序类本身要真实的 WebGL 上下文才能实例化，这个函数把「选项如何变成 GLSL」单独暴露出来，
 * 供调试与测试断言；日常使用直接调 {@link createNodeShapeProgram} 即可。
 */
export function buildNodeShapeShaders(
  options: CreateNodeShapeProgramOptions = {}
): { vertex: string, fragment: string } {
  const resolved = resolveOptions(options)

  return {
    vertex: getVertexShader(resolved),
    fragment: getFragmentShader(resolved)
  }
}

/**
 * 创建一个把节点画成正多边形或星形、并支持多层描边的渲染程序。
 *
 * sigma 生态只提供了圆（`sigma/rendering` 的 `NodeCircleProgram`）与方（`@sigma/node-square`）
 * 两种轮廓，后者还不带描边。本程序沿用 `@sigma/node-border` 的多环描边机制，只把它片元着色器里
 * 那句 `length(v_diffVector)` 换成按形状编译出来的有向距离函数——顶点着色器发的是包住外接圆的
 * 三角形，任何内接多边形都落在里面，因此几何一个字都不用改。
 *
 * `size` 的语义是**外接圆半径**，与圆形节点的半径同义。同一个 `size` 下多边形看起来比圆略小，
 * 是顶点之间被切掉的部分，属预期；`@sigma/node-square` 取的是内切半径，两者混用时需自行折算。
 *
 * 本模块顶层静态引用 `sigma/rendering` 与 `sigma/utils`，**必须经 `defineSigmaProgram()` 延迟加载**。
 *
 * @example
 * ```ts
 * const programs = {
 *   node: {
 *     hexagon: defineSigmaProgram(() =>
 *       import('@movk/sigma/programs/node-shape').then(m => m.createNodeShapeProgram({
 *         sides: 6,
 *         borders: [
 *           { size: { value: 1.5, mode: 'pixels' }, color: { attribute: 'borderColor' } },
 *           { size: { fill: true }, color: { attribute: 'color' } }
 *         ]
 *       }))
 *     )
 *   }
 * }
 * ```
 */
export function createNodeShapeProgram<
  N extends Attributes = Attributes,
  E extends Attributes = Attributes,
  G extends Attributes = Attributes
>(options: CreateNodeShapeProgramOptions<N, E, G> = {}): NodeProgramType<N, E, G> {
  const resolved = resolveOptions(options)
  const { borders, shape, followCamera } = resolved
  const { drawLabel, drawHover } = options

  const uniforms = [
    'u_sizeRatio',
    'u_correctionRatio',
    'u_matrix',
    ...(shape !== 'circle' && !followCamera ? ['u_cameraAngle'] : []),
    ...borders.flatMap(({ color }, i) => 'value' in color ? [`u_borderColor_${i + 1}`] : [])
  ]

  class NodeShapeProgram extends NodeProgram<(typeof uniforms)[number], N, E, G> {
    static readonly ANGLE_1 = 0
    static readonly ANGLE_2 = (2 * Math.PI) / 3
    static readonly ANGLE_3 = (4 * Math.PI) / 3

    override drawLabel = drawLabel
    override drawHover = drawHover

    getDefinition() {
      // WebGL 常量在模块顶层取会让服务端加载即崩，推到真正建程序时再读
      const { UNSIGNED_BYTE, FLOAT, TRIANGLES } = WebGLRenderingContext

      return {
        VERTICES: 3,
        VERTEX_SHADER_SOURCE: getVertexShader(resolved),
        FRAGMENT_SHADER_SOURCE: getFragmentShader(resolved),
        METHOD: TRIANGLES,
        UNIFORMS: uniforms,
        ATTRIBUTES: [
          { name: 'a_position', size: 2, type: FLOAT },
          { name: 'a_id', size: 4, type: UNSIGNED_BYTE, normalized: true },
          { name: 'a_size', size: 1, type: FLOAT },
          ...borders.flatMap(({ color }, i) => 'attribute' in color
            ? [{ name: `a_borderColor_${i + 1}`, size: 4, type: UNSIGNED_BYTE, normalized: true }]
            : []),
          ...borders.flatMap(({ size }, i) => 'attribute' in size
            ? [{ name: `a_borderSize_${i + 1}`, size: 1, type: FLOAT }]
            : [])
        ],
        CONSTANT_ATTRIBUTES: [{ name: 'a_angle', size: 1, type: FLOAT }],
        CONSTANT_DATA: [
          [NodeShapeProgram.ANGLE_1],
          [NodeShapeProgram.ANGLE_2],
          [NodeShapeProgram.ANGLE_3]
        ]
      }
    }

    processVisibleItem(nodeIndex: number, startIndex: number, data: NodeDisplayData): void {
      const array = this.array
      let index = startIndex

      array[index++] = data.x
      array[index++] = data.y
      array[index++] = nodeIndex
      array[index++] = data.size

      for (const { color } of borders) {
        if ('attribute' in color) {
          const value = (data as unknown as Record<string, unknown>)[color.attribute]
          array[index++] = floatColor(String(value || color.defaultValue || DEFAULT_COLOR))
        }
      }

      for (const { size } of borders) {
        if ('attribute' in size) {
          const value = (data as unknown as Record<string, unknown>)[size.attribute]
          array[index++] = typeof value === 'number' ? value : size.defaultValue
        }
      }
    }

    setUniforms(params: RenderParams, { gl, uniformLocations }: ProgramInfo): void {
      gl.uniform1f(uniformLocations.u_correctionRatio!, params.correctionRatio)
      gl.uniform1f(uniformLocations.u_sizeRatio!, params.sizeRatio)
      gl.uniformMatrix3fv(uniformLocations.u_matrix!, false, params.matrix)

      if (uniformLocations.u_cameraAngle) {
        gl.uniform1f(uniformLocations.u_cameraAngle, params.cameraAngle)
      }

      borders.forEach(({ color }, i) => {
        if ('value' in color) {
          const [r, g, b, a] = colorToArray(color.value)
          gl.uniform4f(uniformLocations[`u_borderColor_${i + 1}`]!, r! / 255, g! / 255, b! / 255, a! / 255)
        }
      })
    }
  }

  return NodeShapeProgram as unknown as NodeProgramType<N, E, G>
}
