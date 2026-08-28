<script setup lang="ts">
const tooltip = useTemplateRef('tooltip')

const { data } = await useFetch('/api/data.json')
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaTooltip ref="tooltip" trigger="click" />

    <SigmaControls>
      <UButton label="hide()" @click="tooltip?.hide()" />
      <div class="bg-accented p-2 text-muted text-xs">
        点节点打开提示层，再点这个按钮关掉；点画布空白处同样会关闭
      </div>
    </SigmaControls>
  </SigmaGraph>
</template>
