<script setup lang="ts">
const { data } = await useFetch('/api/small.json')

const starred = shallowRef<string[]>([])

function star(key: string) {
  starred.value = starred.value.includes(key)
    ? starred.value.filter(item => item !== key)
    : [...starred.value, key]
}

/**
 * 控件外观由 --sigma-color-* 驱动。这里把它们接到 Nuxt UI 的色板变量上，
 * 切换深浅色时控件与宿主主题同步，无需额外的暗色样式表。
 */
const themed = shallowRef(false)

const style = computed(() => themed.value
  ? {
      '--sigma-color-bg': 'var(--ui-bg-elevated)',
      '--sigma-color-fg': 'var(--ui-text-highlighted)',
      '--sigma-color-muted': 'var(--ui-text-muted)',
      '--sigma-color-border': 'var(--ui-border-accented)',
      '--sigma-color-accent': 'var(--ui-primary)',
      '--sigma-color-hover': 'var(--ui-bg-accented)',
      '--sigma-color-active': 'var(--ui-bg-inverted)'
    }
  : undefined)
</script>

<template>
  <SigmaGraph :data="data" :style="style">
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

    <SigmaControls position="middle-right">
      <UButton
        size="xs"
        color="neutral"
        :label="themed ? '还原控件配色' : '跟随 Nuxt UI 色板'"
        @click="themed = !themed"
      />
    </SigmaControls>

    <SigmaControls position="bottom-right">
      <UBadge color="neutral" variant="subtle" :label="`已标记 ${starred.length} 个`" />
      <SigmaZoomControl :reset="false" />
    </SigmaControls>
  </SigmaGraph>
</template>
