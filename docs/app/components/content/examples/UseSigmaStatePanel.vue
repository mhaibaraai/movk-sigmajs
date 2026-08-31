<script setup lang="ts">
import { shallowRef } from 'vue'

/**
 * 交互状态存在 sigma 实例内部，不写进 graphology 的属性，
 * 导出图数据时不会把 UI 状态一并带走。
 *
 * 泛型对应根组件的 customNodeState，写入自定义标志位才有类型。
 */
const { graph } = useSigma()
const { setNodeState, setNodesState, getNodeState, getGraphState } = useSigmaState<{ isPinned: boolean }>()

const info = shallowRef('')

function report() {
  info.value = `n0.isHighlighted=${getNodeState('n0')?.isHighlighted} · hasHighlighted=${getGraphState()?.hasHighlighted}`
}

function highlight() {
  setNodesState(['n0', ...graph.value.neighbors('n0')], { isHighlighted: true })
  report()
}

function pin() {
  setNodeState('n1', { isPinned: true })
  report()
}

function clear() {
  setNodesState(graph.value.nodes(), { isHighlighted: false, isPinned: false })
  report()
}
</script>

<template>
  <SigmaControls>
    <div class="flex gap-1">
      <UButton size="xs" color="neutral" label="高亮 n0 及邻居" @click="highlight" />
      <UButton size="xs" color="neutral" label="钉住 n1" @click="pin" />
      <UButton size="xs" color="neutral" label="清空" @click="clear" />
    </div>

    <div class="bg-accented p-2 text-muted text-xs font-mono">
      {{ info || '点上面的按钮写状态' }}
    </div>
  </SigmaControls>
</template>
