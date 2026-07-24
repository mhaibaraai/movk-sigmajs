/**
 * sigma 在模块顶层用 WebGL 常量建查找表，happy-dom 不提供这两个全局，
 * 静态导入 `sigma` 或 `sigma/settings` 会直接 ReferenceError。
 *
 * 这里补一组桩，让测试能加载真实的 sigma 模块去断言内置渲染程序等行为。
 * 常量只被当作对象键使用，取值只需互不相同。
 * 生产代码不依赖本文件，它经动态导入把 sigma 推迟到客户端加载。
 */
const GL_CONSTANTS = [
  'BOOL', 'BYTE', 'UNSIGNED_BYTE', 'SHORT', 'UNSIGNED_SHORT', 'INT', 'UNSIGNED_INT', 'FLOAT',
  'BOOL_VEC2', 'BOOL_VEC3', 'BOOL_VEC4',
  'INT_VEC2', 'INT_VEC3', 'INT_VEC4',
  'FLOAT_VEC2', 'FLOAT_VEC3', 'FLOAT_VEC4',
  'FLOAT_MAT2', 'FLOAT_MAT3', 'FLOAT_MAT4'
]

function createContextStub(): Record<string, number> {
  return Object.fromEntries(GL_CONSTANTS.map((name, index) => [name, 0x8B00 + index]))
}

Object.assign(globalThis, {
  WebGLRenderingContext: createContextStub(),
  WebGL2RenderingContext: createContextStub()
})
