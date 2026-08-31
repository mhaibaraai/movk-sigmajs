<script setup lang="ts">
defineProps<{ fields: string[] }>()

const { data } = await useFetch('/api/data.json')
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaControls position="top-right">
      <SigmaSearchControl
        :key="`fields-${fields.join()}`"
        :fields="fields"
        placeholder="试试 Javert"
      />
    </SigmaControls>
  </SigmaGraph>
</template>
