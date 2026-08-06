/**
 * `#app` 的测试替身。
 *
 * `Graph.vue` 从 `#app` 显式 import `useRuntimeConfig()` 读模块级默认 settings，
 * 而这个别名由 Nuxt 在构建期注入，vitest 解析不到。这里只补组件真正用到的那一个，
 * 返回空的 `public.sigma`，等价于「消费方没配全局默认」。
 */
export function useRuntimeConfig() {
  return { public: { sigma: {} } }
}
