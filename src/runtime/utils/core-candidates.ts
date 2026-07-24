/**
 * 与图和 sigma 无关的通用能力，`@movk/core` 暂时没有。
 * 集中放在本文件便于后续整体搬迁，届时改为从 `@movk/core` import 即可。
 */

/**
 * 把数值钳制到闭区间内
 * @todo 待移入 @movk/core
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * 按 id 存取实例的注册表，供组件树之外或跨路由访问已挂载的实例。
 * `register` 返回注销函数，交给调用方在卸载时执行。
 * @todo 待移入 @movk/core
 */
export interface Registry<T> {
  register: (id: string, value: T) => () => void
  get: (id: string) => T | undefined
  has: (id: string) => boolean
  keys: () => string[]
}

/**
 * 创建一个实例注册表
 * @todo 待移入 @movk/core
 */
export function createRegistry<T>(): Registry<T> {
  const store = new Map<string, T>()

  return {
    register(id, value) {
      store.set(id, value)
      return () => {
        if (store.get(id) === value) {
          store.delete(id)
        }
      }
    },
    get: id => store.get(id),
    has: id => store.has(id),
    keys: () => [...store.keys()]
  }
}
