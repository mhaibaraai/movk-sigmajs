<script setup lang="ts">
const { data } = await useFetch('/api/small.json')

const starred = shallowRef<string[]>([])

function star(key: string) {
  starred.value = starred.value.includes(key)
    ? starred.value.filter(item => item !== key)
    : [...starred.value, key]
}
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaControls direction="horizontal">
      <UButton
        v-for="node in data?.nodes"
        :key="node.key"
        size="xs"
        :variant="starred.includes(node.key) ? 'solid' : 'soft'"
        :label="node.attributes.label"
        @click="star(node.key)"
      />
    </SigmaControls>

    <SigmaControls position="bottom-right">
      <UBadge color="neutral" variant="subtle" :label="`已标记 ${starred.length} 个`" />
      <SigmaZoomControl :reset="false" />
    </SigmaControls>
  </SigmaGraph>
</template>
