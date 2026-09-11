// @vitest-environment node
// 构建期模块：happy-dom 下 import.meta.url 不是 file: 协议，fileURLToPath 会直接抛错
import { describe, expect, it, vi } from 'vitest'
import { createSigmaUnplugin } from '../src/unplugin'

// unplugin 三件套是可选 peer，缺包时是动态 import 本身 reject
vi.mock('unplugin-vue-components', () => {
  throw new Error('Cannot find module \'unplugin-vue-components\'')
})

describe('unplugin 可选 peer 缺失', () => {
  it('抛出带包名与安装指引的错误，而不是 ERR_MODULE_NOT_FOUND', async () => {
    await expect(createSigmaUnplugin()).rejects.toThrow(
      '[@movk/sigma] 使用 @movk/sigma/vite 需要安装可选依赖 unplugin-vue-components，请执行 pnpm add -D unplugin-vue-components'
    )
  })
})
