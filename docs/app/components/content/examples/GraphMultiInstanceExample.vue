<script setup lang="ts">
const { data: left } = await useFetch('/api/small.json')
const { data: right } = await useFetch('/api/data.json')
</script>

<template>
  <div class="flex-1 min-h-0 grid grid-cols-2 gap-2">
    <SigmaGraph id="multi-left" :data="left">
      <SigmaControls>
        <SigmaZoomControl />
      </SigmaControls>
    </SigmaGraph>

    <SigmaGraph id="multi-right" :data="right">
      <SigmaControls>
        <SigmaZoomControl />
      </SigmaControls>
    </SigmaGraph>
  </div>
</template>
