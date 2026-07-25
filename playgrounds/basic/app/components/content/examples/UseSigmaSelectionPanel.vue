<script setup lang="ts">
/**
 * hover / selected / focused 状态机，内建高亮与淡出的归约。
 *
 * 焦点节点及其直接邻居保持原样，其余淡出且隐藏标签。归约经 reducer 链登记，
 * 与过滤、图例显隐等共存而不互相覆盖。
 */
const { hovered, selected, focused, highlighted, select, clear } = useSigmaSelection({
  dimColor: '#cbd5e1'
})
</script>

<template>
  <div class="demo-panel demo-hud" data-at="top-left">
    <span class="demo-tag">悬浮 {{ hovered ?? '—' }} · 选中 {{ selected ?? '—' }} · 焦点 {{ focused ?? '—' }}</span>
    <span class="demo-tag">高亮 {{ highlighted.size }} 个（焦点及其直接邻居）</span>
    <div class="demo-row">
      <button type="button" @click="select('n0')">
        选中 n0
      </button>
      <button type="button" @click="clear">
        清空
      </button>
    </div>
  </div>
</template>
