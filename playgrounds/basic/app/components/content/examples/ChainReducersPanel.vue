<script setup lang="ts">
import type { NodeDisplayData } from 'sigma/types'

/**
 * 库注册的归约叠在用户自带的之后。
 *
 * 外壳经 settings.nodeReducer 传了一条「统一放大」的基座归约，这里再登记一条
 * 「按分类着色」。两条都生效说明链没有互相覆盖——sigma 本身只接受一个 reducer，
 * 后设置的会覆盖先设置的。
 */
useSigmaReducer({
  order: 100,
  node: (_key, attributes): Partial<NodeDisplayData> => ({
    color: attributes.category === '技术标准' ? '#0ea5e9' : '#94a3b8'
  })
})
</script>

<template>
  <div class="demo-panel" data-at="top-left">
    <span class="demo-tag">基座归约（settings.nodeReducer）把所有节点放大并加了标签前缀</span>
    <span class="demo-tag">链上第二条按分类着色，两者叠加而非互相覆盖</span>
  </div>
</template>
