<script setup lang="ts">
const tooltip = useTemplateRef('tooltip')

const { data } = await useFetch('/api/data.json')
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaTooltip ref="tooltip" trigger="click" />

    <SigmaControls>
      <UButton label="hide()" @click="tooltip?.hide()" />
    </SigmaControls>
  </SigmaGraph>
</template>
