<script setup lang="ts">
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
