/**
 * 运行环境标记。
 *
 * Nuxt 注入的 `import.meta.dev` 与 `import.meta.client` 在纯 Vite 下不存在，
 * 运行时代码要在两侧等价可用，就不能直接用它们。
 */

/**
 * 开发态标记。
 *
 * `process.env.NODE_ENV` 在 Nuxt 客户端、Nitro 与 Vite 三侧都会被静态替换成字面量，
 * 生产构建里由它守卫的告警会被整段摇掉，Vue 自身的 `__DEV__` 也是这么编译的。
 */
export const isDev: boolean = process.env.NODE_ENV !== 'production'

/** 客户端标记，替代 Nuxt 专属的 `import.meta.client` */
export const isClient: boolean = typeof window !== 'undefined'
