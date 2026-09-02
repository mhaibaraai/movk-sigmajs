<script setup lang="ts">
const { data } = await useFetch('/api/data.json')
</script>

<template>
  <SigmaGraph :data="data">
    <div class="absolute inset-y-0 left-0 z-10 flex w-60 items-center justify-center border-r border-default bg-default/90 text-muted text-xs">
      侧栏 240px
    </div>

    <UseSigmaCameraInsetsPanel />
  </SigmaGraph>
</template>
