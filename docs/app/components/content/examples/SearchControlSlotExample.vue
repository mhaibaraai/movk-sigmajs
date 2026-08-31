<script setup lang="ts">
// #input 换输入框、#option 换单条结果、#empty 换无结果提示，
// 作用域连行为一起给：onKeydown 一次绑完上下键、回车与 Esc
const { data } = await useFetch('/api/data.json')
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaControls position="top-right">
      <SigmaSearchControl :fields="['label', 'category']">
        <template #input="{ modelValue, placeholder, open, onUpdate, onKeydown }">
          <UInput
            :model-value="modelValue"
            :placeholder="placeholder"
            :aria-expanded="open"
            role="combobox"
            icon="i-lucide-search"
            size="sm"
            @update:model-value="onUpdate($event as string)"
            @keydown="onKeydown"
          />
        </template>

        <template #option="{ result, segments }">
          <span class="flex w-full items-center gap-2">
            <span class="truncate">
              <span
                v-for="(segment, index) in segments"
                :key="index"
                :class="segment.match && 'text-primary font-medium'"
              >{{ segment.text }}</span>
            </span>
            <UBadge color="neutral" variant="subtle" size="sm" :label="result.field" class="ml-auto" />
          </span>
        </template>

        <template #empty>
          <span class="text-muted">换个词试试</span>
        </template>
      </SigmaSearchControl>
    </SigmaControls>
  </SigmaGraph>
</template>
