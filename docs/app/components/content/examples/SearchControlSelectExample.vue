<script setup lang="ts">
import type { SigmaSearchResult } from '@movk/sigma'

// select 在相机动画结束后才抛出，携带完整的结果对象
const picked = shallowRef<SigmaSearchResult | null>(null)

const { data } = await useFetch('/api/data.json')
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaControls position="top-right">
      <SigmaSearchControl :fields="['label', 'category']" @select="picked = $event" />
    </SigmaControls>

    <SigmaControls position="bottom-left" direction="horizontal">
      <UBadge color="neutral" variant="subtle" :label="`命中类型 ${picked?.type ?? '—'}`" />
      <UBadge color="neutral" variant="subtle" :label="`id ${picked?.id ?? '—'}`" />
      <UBadge color="neutral" variant="subtle" :label="`字段 ${picked?.field ?? '—'}`" />
    </SigmaControls>
  </SigmaGraph>
</template>
