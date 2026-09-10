<script setup lang="ts">
import type { SigmaLayoutName } from '@movk/sigma'

const { data } = await useFetch('/api/data.json')

// name 是 setup 期读取的，切换布局要靠 key 重建面板
const name = shallowRef<SigmaLayoutName>('circular')
</script>

<template>
  <SigmaGraph :data="data" :settings="{ itemSizesReference: 'screen' }">
    <UseSigmaLayoutPanel :key="name" v-model:name="name" />
  </SigmaGraph>
</template>
