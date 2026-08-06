import type { CustomNodeShape } from 'sigma/primitives'

export interface SdfPolygonOptions {
  /**
   * 形状名，用于 styles 的 `shape` 字段。同一实例内注册多个多边形时必须区分
   * @defaultValue 'polygon'
   */
  name?: string
  /**
   * 正多边形的边数，小于 3 时退化为圆
   * @defaultValue 6
   */
  sides?: number
  /**
   * 旋转量（弧度），逆时针为正，0 时首个顶点朝向 +x 轴
   * @defaultValue 0
   */
  rotation?: number
}

export interface SdfStarOptions {
  /**
   * 形状名，用于 styles 的 `shape` 字段
   * @defaultValue 'star'
   */
  name?: string
  /**
   * 星形的角数，小于 3 时退化为圆
   * @defaultValue 5
   */
  points?: number
  /**
   * 内接半径与外接半径之比
   * @defaultValue 0.5
   */
  innerRatio?: number
  /**
   * 旋转量（弧度），逆时针为正
   * @defaultValue 0
   */
  rotation?: number
}

function glslFloat(value: number): string {
  const text = String(value)

  return text.includes('.') || text.includes('e') ? text : `${text}.0`
}

function sdfCircleFallback(name: string): CustomNodeShape {
  return {
    name,
    glsl: `
float sdf_${name}(vec2 uv, float size) {
  return length(uv) - size;
}
`
  }
}

/**
 * 正多边形节点形状。
 *
 * 折进单个扇区后取到最近一条边的垂直距离：外接半径为 `size` 的正 n 边形，
 * 内切半径是 `size * cos(π/n)`。
 *
 * @example
 * ```ts
 * const primitives = { nodes: { shapes: [sdfPolygon({ sides: 6 })] } }
 * const styles = { nodes: { shape: 'polygon' } }
 * ```
 */
export function sdfPolygon(options: SdfPolygonOptions = {}): CustomNodeShape {
  const { name = 'polygon', sides = 6, rotation = 0 } = options

  if (sides < 3) {
    return sdfCircleFallback(name)
  }

  const segment = (2 * Math.PI) / sides
  const half = segment / 2
  const inradiusFactor = Math.cos(half)

  return {
    name,
    glsl: `
float sdf_${name}(vec2 uv, float size) {
  float len = length(uv);
  if (len == 0.0) return -size;

  float a = atan(uv.y, uv.x) - ${glslFloat(rotation)};
  // 折进单个扇区并以中轴为零点，顶点方向落在扇区两端
  float theta = mod(a, ${glslFloat(segment)}) - ${glslFloat(half)};

  return len * cos(theta) - size * ${glslFloat(inradiusFactor)};
}
`,
    inradiusFactor
  }
}

/**
 * 正星形节点形状。
 *
 * 每个角关于自身中轴对称，折叠到半个扇区即可只描述一条边；`innerRatio` 越小角越尖。
 *
 * @example
 * ```ts
 * const primitives = { nodes: { shapes: [sdfStar({ points: 5, innerRatio: 0.4 })] } }
 * ```
 */
export function sdfStar(options: SdfStarOptions = {}): CustomNodeShape {
  const { name = 'star', points = 5, innerRatio = 0.5, rotation = 0 } = options

  if (points < 3) {
    return sdfCircleFallback(name)
  }

  const segment = (2 * Math.PI) / points
  const beta = Math.PI / points
  const edgeX = innerRatio * Math.cos(beta) - 1
  const edgeY = innerRatio * Math.sin(beta)
  const edgeLength = Math.hypot(edgeX, edgeY)
  // 外接半径为 1 时，外顶点与相邻内顶点连成的边到中心的距离及其法线方向
  const inradiusFactor = edgeLength === 0 ? 1 : (innerRatio * Math.sin(beta)) / edgeLength
  const normalAngle = Math.atan2(1 - innerRatio * Math.cos(beta), innerRatio * Math.sin(beta))

  return {
    name,
    glsl: `
float sdf_${name}(vec2 uv, float size) {
  float len = length(uv);
  if (len == 0.0) return -size;

  float a = atan(uv.y, uv.x) - ${glslFloat(rotation)};
  float phi = mod(a, ${glslFloat(segment)});
  phi = min(phi, ${glslFloat(segment)} - phi);

  return len * cos(phi - ${glslFloat(normalAngle)}) - size * ${glslFloat(inradiusFactor)};
}
`,
    inradiusFactor
  }
}
