<script setup lang="ts">
import type { AnyObject } from '@movk/core'
import type { StylesDeclaration } from 'sigma/types'

/** 保留数据集原色的社区数量，其余压成中性色 */
const FEATURED_COUNT = 5

/**
 * 明暗两色底上都成立的中性色。写死而不随主题变化：styles 只在构造期读取，
 * 换一份对象会重建整个 sigma 实例
 */
const MUTED_NODE = 'rgba(148, 163, 184, 0.75)'
const MUTED_EDGE = 'rgba(148, 163, 184, 0.15)'

/** 标签色，sigma 的默认深色在暗色底上读不出来 */
const LABEL_COLORS = { light: '#0f172a', dark: '#e2e8f0' }

/** 高亮邻域的边色，比基础边色实一档，聚焦时那颗星才立得起来 */
const FOCUS_EDGE = 'rgba(100, 116, 139, 0.55)'

const items = [
  { label: '预览', icon: 'i-lucide-eye', slot: 'preview' as const },
  { label: '代码', icon: 'i-lucide-code-xml', slot: 'code' as const }
]

const colorMode = useColorMode()

const { data: dataset } = await useFetch('/api/wikipedia.json')

const nodes = dataset.value?.data.nodes ?? []
const nodeCount = nodes.length
const edgeCount = dataset.value?.data.edges.length ?? 0

const clusterCounts = new Map<string, number>()
for (const node of nodes) {
  const cluster = String((node.attributes as AnyObject)?.cluster ?? '')
  clusterCounts.set(cluster, (clusterCounts.get(cluster) ?? 0) + 1)
}

const featured = [...clusterCounts]
  .sort((a, b) => b[1] - a[1])
  .slice(0, FEATURED_COUNT)
  .map(([key]) => ({
    key,
    color: dataset.value?.clusterColors[key] ?? MUTED_NODE,
    label: dataset.value?.clusterLabels[key] ?? key
  }))

const featuredColors = Object.fromEntries(featured.map(group => [group.key, group.color]))

const styles: StylesDeclaration = {
  nodes: [{
    label: { attribute: 'label' },
    // 取函数而非常量：styles 只在构造期读取，闭包读 ref 才能跟着明暗切换，由 HomeHeroReveal 触发 refresh
    labelColor: () => (colorMode.value === 'dark' ? LABEL_COLORS.dark : LABEL_COLORS.light),
    color: { attribute: 'cluster', dict: featuredColors, defaultValue: MUTED_NODE },
    size: {
      attribute: 'score',
      min: 6,
      max: 36,
      minValue: dataset.value?.scoreExtent[0],
      maxValue: dataset.value?.scoreExtent[1]
    },
    zIndex: attributes => (String(attributes.cluster) in featuredColors ? 1 : 0)
  }, {
    // 高亮邻域画在最上层，被淡出的那层压不住它
    whenState: 'isHighlighted',
    then: { zIndex: 2 }
  }],
  edges: [
    { color: MUTED_EDGE, size: 1 },
    { whenState: 'isHighlighted', then: { color: FOCUS_EDGE, size: 2 } }
  ]
}

// 默认阈值 6 在全图视角下把标签压得只剩一个，降下来让几个社区的代表节点露出名字
const settings = {
  hideEdgesOnMove: true,
  labelGridCellSize: 120,
  labelRenderedSizeThreshold: 3
}

// 样例里的结束标签拆开写，否则它会提前终止本文件的 script 块
const scriptClose = `</${'script'}>`

const source = `\`\`\`vue [pages/index.vue]
<script setup lang="ts">
const { data: dataset } = await useFetch('/api/wikipedia.json')

// featuredColors：前 5 大社区的原色，其余落到 defaultValue
const styles: StylesDeclaration = {
  nodes: [
    {
      label: { attribute: 'label' },
      color: { attribute: 'cluster', dict: featuredColors, defaultValue: MUTED },
      size: { attribute: 'score', min: 6, max: 36, minValue, maxValue }
    },
    { whenState: 'isHighlighted', then: { zIndex: 2 } }
  ],
  edges: [
    { color: EDGE, size: 1 },
    { whenState: 'isHighlighted', then: { color: FOCUS_EDGE, size: 2 } }
  ]
}
${scriptClose}

<template>
  <SigmaGraph
    :data="dataset.data"
    :styles="styles"
    :settings="{ hideEdgesOnMove: true }"
  >
    <SigmaControls position="middle-right">
      <SigmaZoomControl />
      <SigmaFullscreenControl />
    </SigmaControls>

    <SigmaTooltip />
  </SigmaGraph>
</template>
\`\`\``

const { data: ast } = await useAsyncData('home-hero-demo-source', () => cachedParseMarkdown(source))
</script>

<template>
  <UTabs
    :items="items"
    color="primary"
    variant="pill"
    size="xs"
    default-value="0"
    :unmount-on-hide="false"
    :ui="{
      root: 'relative flex flex-col items-stretch h-96 sm:h-128 gap-0 rounded-xl ring ring-default bg-default overflow-hidden',
      list: 'absolute top-3 right-3 z-20 w-auto rounded-lg bg-default/70 ring ring-default backdrop-blur-md',
      trigger: 'grow-0 px-2.5',
      content: 'mt-0 min-h-0 flex-1',
    }"
  >
    <template #preview>
      <div class="flex h-full flex-col">
        <SigmaGraph
          :data="dataset?.data"
          :styles="styles"
          :settings="settings"
          class="min-h-0 flex-1"
        >
          <SigmaControls position="middle-right">
            <SigmaZoomControl />
            <SigmaFullscreenControl />
          </SigmaControls>

          <SigmaTooltip />

          <HomeHeroReveal :cluster-labels="dataset?.clusterLabels ?? {}" />
        </SigmaGraph>

        <div class="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-t border-default px-3 py-2 text-[11px] text-muted">
          <ul class="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <li
              v-for="group in featured"
              :key="group.key"
              class="flex items-center gap-1.5 whitespace-nowrap"
            >
              <span
                class="size-1.5 shrink-0 rounded-full"
                :style="{ backgroundColor: group.color }"
              />
              {{ group.label }}
            </li>
          </ul>

          <p class="ms-auto flex shrink-0 items-center gap-3 tabular-nums whitespace-nowrap">
            <span>{{ nodeCount }} 节点</span>
            <span>{{ edgeCount }} 边</span>
          </p>
        </div>
      </div>
    </template>

    <template #code>
      <div class="hero-code h-full">
        <MDCRenderer v-if="ast" :body="ast.body" :data="ast.data" />
      </div>
    </template>
  </UTabs>
</template>

<style scoped>
/*
 * 代码页要读成面板本身的一部分，而不是嵌在面板里的第二张卡片：
 * 去掉 ProsePre 自带的外框与圆角，文件名条压成顶部一条发丝线分隔的窄带，
 * 右侧留出切换药丸的位置，复制按钮挪到右下角避让
 */
.hero-code,
.hero-code :deep(> div) {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.hero-code :deep(> div) {
  flex: 1;
}

.hero-code :deep(div:has(> pre)) {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  margin: 0;
}

.hero-code :deep(div:has(> pre) > div:first-child) {
  padding: 0.5rem 10rem 0.5rem 0.75rem;
  border: 0;
  border-bottom: 1px solid var(--ui-border);
  border-radius: 0;
}

.hero-code :deep(div:has(> pre) > div:first-child span) {
  font-size: 0.6875rem;
  line-height: 1.25rem;
}

.hero-code :deep(pre) {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 0.75rem 1rem;
  border: 0;
  border-radius: 0;
  overflow: auto;
  font-size: 0.75rem;
  line-height: 1.7;
}

.hero-code :deep(button) {
  top: auto;
  bottom: 0.75rem;
  inset-inline-end: 0.75rem;
}
</style>
