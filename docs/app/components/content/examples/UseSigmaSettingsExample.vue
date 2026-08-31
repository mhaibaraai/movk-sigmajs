<script setup lang="ts">
const { data } = await useFetch('/api/data.json')
</script>

<template>
  <SigmaGraph :data="data">
    <UseSigmaSettingsPanel />
  </SigmaGraph>
</template>
