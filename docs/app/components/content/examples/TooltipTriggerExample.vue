<script setup lang="ts">
defineProps<{ trigger?: 'hover' | 'click' }>()

const { data } = await useFetch('/api/data.json')
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaTooltip :trigger="trigger" />

    <SigmaControls>
      <div class="bg-accented p-2 text-muted text-xs">
        hover 跟着指针进出；click 点节点打开、点画布空白处关闭。没有插槽时展示的是节点的 label
      </div>
    </SigmaControls>
  </SigmaGraph>
</template>
