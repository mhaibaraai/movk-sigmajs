<script setup lang="ts">
import type { SigmaStyles } from '@movk/sigma'

const { data } = await useFetch('/api/data.json')
const styles: SigmaStyles = {
  nodes: [
    {
      size: attributes => (attributes.size as number) / 2,
      cursor: 'grab'
    }
  ]
}
</script>

<template>
  <SigmaGraph :data="data" :styles="styles" />
</template>
