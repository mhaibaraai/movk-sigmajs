import type { PrimitivesDeclaration } from 'sigma/primitives'
import type { SigmaLazyPrimitives, SigmaPrimitivesSource } from '../types'

/**
 * 声明一份延迟加载的渲染原语，`SigmaGraph` 会在创建实例前解析它。
 *
 * sigma v4 的每个子路径在模块顶层就读 `WebGL2RenderingContext`，`sigma/rendering`
 * 与 `sigma/primitives` 都不例外，静态 import 会让 SSR 直接 ReferenceError。取用内置的
 * `sdfCircle()` / `layerFill()` 等工厂函数时必须包在这里。
 *
 * 本库的 `sdfPolygon()` / `sdfStar()` 返回纯数据、不引用 sigma 的任何值，可以直接写在
 * 外层，无须延迟。
 *
 * @example
 * ```ts
 * const primitives = defineSigmaPrimitives(async () => {
 *   const { sdfCircle, layerFill } = await import('sigma/rendering')
 *   return {
 *     nodes: {
 *       shapes: [sdfCircle(), sdfPolygon({ sides: 6 })],
 *       layers: [layerFill()]
 *     }
 *   }
 * })
 * ```
 */
export function defineSigmaPrimitives(
  loader: () => PrimitivesDeclaration | Promise<PrimitivesDeclaration>
): SigmaLazyPrimitives {
  return { __sigmaLazyPrimitives: loader }
}

/** 判断是否为延迟声明，`SigmaGraph` 内部用 */
export function isLazySigmaPrimitives(
  source: SigmaPrimitivesSource
): source is SigmaLazyPrimitives {
  return typeof (source as SigmaLazyPrimitives)?.__sigmaLazyPrimitives === 'function'
}
