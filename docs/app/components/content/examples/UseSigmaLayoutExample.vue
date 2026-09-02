<script setup lang="ts">
import type { SigmaLayoutName } from '@movk/sigma'

defineProps<{ name: SigmaLayoutName }>()

const { data } = await useFetch('/api/data.json')
</script>

<template>
  <SigmaGraph :data="data" :settings="{ itemSizesReference: 'screen' }">
    <UseSigmaLayoutPanel :key="name" :name="name" />
  </SigmaGraph>
</template>
