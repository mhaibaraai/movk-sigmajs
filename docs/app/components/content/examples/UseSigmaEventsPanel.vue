<script setup lang="ts">
import { shallowRef } from 'vue'

/**
 * 声明式绑定 sigma 事件，卸载自动解绑。
 *
 * 接受任意事件名，组件 emits 未覆盖的（如 beforeRender / afterRender / resize）
 * 也能绑；再往下 sigma.on() 始终可用，三条通道并存。
 */
const log = shallowRef<string[]>([])
const frames = shallowRef(0)

function push(line: string) {
  log.value = [line, ...log.value].slice(0, 4)
}

useSigmaEvents({
  clickNode: ({ node }) => push(`clickNode ${node}`),
  doubleClickNode: ({ node }) => push(`doubleClickNode ${node}`),
  wheelStage: () => push('wheelStage'),
  resize: () => push('resize'),
  afterRender: () => {
    frames.value += 1
  }
})
</script>

<template>
  <div class="demo-panel" data-at="top-left">
    <span class="demo-tag">已渲染 {{ frames }} 帧（afterRender 不在 emits 里，只能走这条）</span>
    <ul class="demo-log">
      <li v-for="(line, index) in log" :key="`${line}-${index}`">
        {{ line }}
      </li>
    </ul>
  </div>
</template>
