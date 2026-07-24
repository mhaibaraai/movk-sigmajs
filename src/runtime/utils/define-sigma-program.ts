import type { SigmaLazyProgram } from '../types'

/**
 * 声明一个延迟加载的渲染程序。
 *
 * `@sigma/*` 程序包与 sigma 本体一样，在模块顶层就读取 WebGL 全局，
 * 在 Nuxt 页面里静态 `import` 会让 SSR 直接崩，连写成 `import(...)` 的 Promise 也不行——
 * 那同样会在服务端求值。因此只能传入一个「用到时才执行」的加载函数。
 *
 * 加载函数与程序类本身都是 function，无法可靠区分，所以这里包一层显式标记。
 * 组件会在创建 sigma 实例之前把它们解析完，不存在程序未就绪就渲染到对应 type 的时间窗。
 *
 * @example
 * ```ts
 * const programs = {
 *   node: {
 *     border: defineSigmaProgram(() =>
 *       import('@sigma/node-border').then(m => m.createNodeBorderProgram())
 *     )
 *   }
 * }
 * ```
 */
export function defineSigmaProgram<T>(loader: () => T | Promise<T>): SigmaLazyProgram<T> {
  return { __sigmaLazyProgram: loader }
}

/** 判断是否为 `defineSigmaProgram` 的产物 */
export function isLazySigmaProgram<T>(value: unknown): value is SigmaLazyProgram<T> {
  return typeof value === 'object' && value !== null && '__sigmaLazyProgram' in value
}
