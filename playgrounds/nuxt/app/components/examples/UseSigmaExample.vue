<script setup lang="ts">
const { data } = await useFetch('/api/small.json')
</script>

<template>
  <SigmaGraph :data="data">
    <UseSigmaPanel />
  </SigmaGraph>
</template>
