<script setup lang="ts">
/**
 * 按属性模糊检索节点与边。
 *
 * 匹配在内存里做，不额外建索引：forEachNode 遍历万级节点是毫秒量级，
 * 而维护索引要处理图变更的同步，得不偿失。
 */
const { query, results, focus } = useSigmaSearch({
  fields: ['label', 'category'],
  limit: 8,
  edges: true
})
</script>

<template>
  <div class="demo-panel" data-at="top-left">
    <div class="demo-row">
      <span class="demo-label">检索</span>
      <input v-model="query" placeholder="试试「技术」或「引用」">
    </div>
    <ul class="demo-log">
      <li v-for="item in results" :key="`${item.type}-${item.id}`">
        <button type="button" @click="focus(item)">
          {{ item.type }} · {{ item.label }} <em>{{ item.field }}</em>
        </button>
      </li>
      <li v-if="query && results.length === 0">
        无匹配
      </li>
    </ul>
  </div>
</template>

<style scoped>
li button {
  border: 0;
  background: none;
  color: inherit;
  cursor: pointer;
  font: inherit;
  padding: 1px 0;
}

em {
  opacity: 0.5;
  font-style: normal;
}
</style>
