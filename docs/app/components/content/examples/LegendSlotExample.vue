<script setup lang="ts">
// 作用域除 groups 外还给了 toggle 与 reset，接管外观不会丢掉显隐切换
const { data } = await useFetch('/api/data.json')
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaControls position="top-right" direction="horizontal">
      <SigmaLegend field="category" color-field="categoryColor">
        <template #default="{ groups, toggle, reset }">
          <div class="flex items-center gap-1">
            <UButton
              v-for="group in groups"
              :key="group.value"
              size="xs"
              color="neutral"
              :variant="group.visible ? 'solid' : 'ghost'"
              @click="toggle(group.value)"
            >
              <span class="size-2 rounded-full" :style="{ background: group.color }" />
              {{ group.value }} · {{ group.count }}
            </UButton>
            <UButton size="xs" variant="link" color="neutral" label="全部显示" @click="reset" />
          </div>
        </template>
      </SigmaLegend>
    </SigmaControls>
  </SigmaGraph>
</template>
