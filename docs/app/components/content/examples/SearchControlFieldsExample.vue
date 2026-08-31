<script setup lang="ts">
// fields 按顺序取第一个命中的字段作展示；edges 打开后边也参与匹配，
// 数据集的边标签是「源—目标」，所以搜人名会连带出它的关联边
withDefaults(defineProps<{ fields?: string[], edges?: boolean }>(), {
  fields: () => ['label'],
  edges: false
})

const { data } = await useFetch('/api/data.json')
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaControls position="top-right">
      <SigmaSearchControl
        :key="`${fields.join()}-${edges}`"
        :fields="fields"
        :edges="edges"
        placeholder="试试 Javert 或 核心"
      />
    </SigmaControls>
  </SigmaGraph>
</template>
