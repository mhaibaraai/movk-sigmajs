<script setup lang="ts">
import { computed } from 'vue'

/**
 * 组件树之外访问实例。
 *
 * 下面的按钮与 SigmaGraph 是兄弟关系，inject 拿不到上下文，只能按 id 取。
 * 返回的是计算属性而非一次性查表：调用方常在实例挂载之前就取好引用，
 * 实例就绪后引用会自动填上。
 */
const context = useSigmaById('by-id-demo')
const ids = useSigmaIds()

const order = computed(() => context.value?.graph.value.order ?? 0)

function zoomFromOutside() {
  context.value?.sigma.value?.getCamera().zoomIn({ duration: 300 })
}

function paintFromOutside() {
  context.value?.graph.value.setNodeAttribute('n0', 'color', '#a855f7')
}

const data = demoGraph()
</script>

<template>
  <!-- .example-stage 是 flex 行容器，不给宽度会缩成内容宽 -->
  <div class="flex flex-col w-full h-full">
    <div class="flex items-center flex-wrap gap-2 p-2 border-b border-default">
      <UButton size="xs" color="neutral" label="树外放大" :disabled="!context" @click="zoomFromOutside" />
      <UButton size="xs" color="neutral" label="树外改色" :disabled="!context" @click="paintFromOutside" />
      <span class="text-muted text-xs">注册表：{{ ids.join('、') || '空' }} · 节点 {{ order }}</span>
    </div>

    <SigmaGraph id="by-id-demo" :styles="demoStyles" :data="data" class="flex-1 min-h-0" />
  </div>
</template>
