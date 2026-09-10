<script setup lang="ts">
import type { SigmaStyles } from '@movk/sigma'

const { data } = await useFetch('/api/data.json')

// sigma 拿到 styles.nodes 是整体替换而非合并，composeStyles 把多份声明按序摊平
const base: SigmaStyles = {
  nodes: {
    label: { attribute: 'label' },
    color: { attribute: 'categoryColor', defaultValue: '#94a3b8' }
  },
  edges: { color: '#e2e8f0' }
}

const emphasis: SigmaStyles = {
  nodes: [{ whenData: { category: '核心' }, then: { color: '#f43f5e', labelVisibility: 'visible' } }]
}

const layered = shallowRef(true)

// 后者覆盖前者：关掉 emphasis 后核心节点掉回 base 的分类配色
const styles = computed(() => layered.value ? composeStyles(base, emphasis) : composeStyles(base))
</script>

<template>
  <SigmaGraph :data="data" :styles="styles">
    <SigmaControls>
      <UButton
        size="xs"
        :color="layered ? 'primary' : 'neutral'"
        :label="layered ? '叠加强调规则' : '只用基础规则'"
        @click="layered = !layered"
      />

      <div class="bg-accented text-muted p-2 text-xs">
        拼接顺序即覆盖顺序，规则数组按序求值
      </div>
    </SigmaControls>
  </SigmaGraph>
</template>
