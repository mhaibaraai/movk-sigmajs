<script setup lang="ts">
const { data } = await useFetch('/api/data.json')
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaControls position="top-right">
      <SigmaSearchControl
        :fields="['label', 'category']"
        :limit="5"
        :debounce="120"
        placeholder="试试 Javert"
      >
        <template #results="{ results, query, highlight, choose }">
          <div class="border-accented bg-default absolute z-10 mt-1 w-full overflow-hidden rounded-md border shadow-lg">
            <p v-if="results.length === 0" class="text-muted p-2 text-xs">
              「{{ query }}」无匹配
            </p>
            <UButton
              v-for="result in results"
              :key="result.id"
              variant="ghost"
              color="neutral"
              size="xs"
              class="w-full rounded-none"
              @click="choose(result)"
            >
              <span
                v-for="(segment, index) in highlight(result)"
                :key="index"
                :class="segment.match && 'text-primary font-medium'"
              >{{ segment.text }}</span>
            </UButton>
          </div>
        </template>
      </SigmaSearchControl>
    </SigmaControls>
  </SigmaGraph>
</template>
