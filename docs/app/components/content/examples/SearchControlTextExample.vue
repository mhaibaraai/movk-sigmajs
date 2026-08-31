<script setup lang="ts">
// placeholder 与 emptyText 都是纯文案，输入无匹配的词即可看到后者
withDefaults(defineProps<{ placeholder?: string, emptyText?: string }>(), {
  placeholder: '检索节点',
  emptyText: '无匹配'
})

const { data } = await useFetch('/api/data.json')
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaControls position="top-right">
      <SigmaSearchControl :placeholder="placeholder" :empty-text="emptyText" />
    </SigmaControls>
  </SigmaGraph>
</template>
