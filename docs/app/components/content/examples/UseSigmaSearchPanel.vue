<script setup lang="ts">
/**
 * 按属性检索节点与边。
 *
 * 子串匹配、大小写不敏感，不做模糊匹配。匹配在内存里做，不额外建索引：
 * forEachNode 遍历万级节点是毫秒量级，而维护索引要处理图变更的同步，得不偿失。
 */
const { query, results, focus } = useSigmaSearch({ limit: 8 })
</script>

<template>
  <SigmaControls>
    <UInput v-model="query" size="xs" placeholder="试试 graph 或 network" />

    <div class="bg-accented p-2 text-muted text-xs">
      <ul class="list-none">
        <li v-for="item in results" :key="`${item.type}-${item.id}`">
          <button type="button" class="cursor-pointer hover:text-highlighted" @click="focus(item)">
            {{ item.type }} · {{ item.label }}
          </button>
        </li>
        <li v-if="query && results.length === 0">
          无匹配
        </li>
      </ul>
    </div>
  </SigmaControls>
</template>
