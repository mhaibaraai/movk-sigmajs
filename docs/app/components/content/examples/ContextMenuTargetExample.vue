<script setup lang="ts">
withDefaults(defineProps<{ target?: Array<'node' | 'edge' | 'stage'> }>(), {
  target: () => ['node']
})

const { data } = await useFetch('/api/data.json')
</script>

<template>
  <SigmaGraph :data="data" :settings="{ enableEdgeEvents: true }">
    <SigmaContextMenu :target="target">
      <template #default="{ type, id }">
        <span class="text-xs">{{ type }} {{ id ?? '（空白处）' }}</span>
      </template>
    </SigmaContextMenu>

    <SigmaControls>
      <div class="bg-accented p-2 text-muted text-xs">
        当前接管 {{ target.join(' / ') }}；未接管的目标上右键仍弹浏览器自己的菜单
      </div>
    </SigmaControls>
  </SigmaGraph>
</template>
