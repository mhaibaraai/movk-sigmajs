<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { SerializedGraph } from 'graphology-types'
import type { NodeDetail } from '~~/server/api/nodes/[id]/detail.get'

/**
 * 完整场景的交互层。
 *
 * 串起架构方案第十节的四条接口：概览已由父组件取好，这里负责详情懒加载、
 * 邻域按需展开与跨全图检索。
 */
const { order, size } = useSigmaGraph()
const { selected, focused, highlighted } = useSigmaSelection()
const { expand, expanded, isExpanding } = useSigmaNeighborhood()
const { gotoNode } = useSigmaCamera()
const { graph } = useSigma()

const detail = ref<NodeDetail | null>(null)
const pending = ref(false)
const open = ref(false)

// 详情只在选中后才请求，不随图数据一起下发
watch(selected, async (key) => {
  if (!key) {
    return
  }
  open.value = true
  pending.value = true
  detail.value = null
  try {
    detail.value = await $fetch<NodeDetail>(`/api/nodes/${key}/detail`)
  }
  finally {
    pending.value = false
  }
})

const depth = ref(1)

/** 邻域走服务端接口，applyGraphDiff 增量合入且不动已有节点的坐标 */
async function expandSelected() {
  if (!selected.value) {
    return
  }
  await expand(selected.value, key =>
    $fetch<SerializedGraph>(`/api/graph/nodes/${key}/neighbors`, { query: { depth: depth.value } })
  )
}

const query = ref('')

// 跨全图检索：能找到尚未下发到前端的节点，选中后再把它拉进来
const { data: hits, status } = await useFetch('/api/graph/search', {
  query: { q: query },
  default: () => [],
  watch: [query]
})

const searchItems = computed(() =>
  (hits.value ?? []).map(hit => ({
    label: hit.label,
    suffix: `${hit.type} · 度数 ${hit.degree}`,
    value: hit.key
  }))
)

async function pick(key: string) {
  if (!graph.value.hasNode(key)) {
    await expand(key, target =>
      $fetch<SerializedGraph>(`/api/graph/nodes/${target}/neighbors`, { query: { depth: 1 } })
    )
  }
  selected.value = key
  await gotoNode(key, { ratio: 0.25 })
}
</script>

<template>
  <div>
    <div class="absolute left-4 top-4 z-10 w-80 max-w-[calc(100%-2rem)]">
      <UCard :ui="{ body: 'p-3 sm:p-3 space-y-3' }">
        <UInputMenu
          v-model:search-term="query"
          :items="searchItems"
          :loading="status === 'pending'"
          value-key="value"
          icon="i-lucide-search"
          placeholder="检索全图（含尚未加载的节点）"
          size="sm"
          @update:model-value="value => pick(String(value))"
        />

        <div class="flex flex-wrap items-center gap-2 text-xs text-muted">
          <UBadge variant="subtle" color="neutral">
            屏上 {{ order }} 节点 / {{ size }} 边
          </UBadge>
          <UBadge variant="subtle" color="neutral">
            已展开 {{ expanded.size }}
          </UBadge>
          <UBadge v-if="focused" variant="subtle" color="primary">
            高亮 {{ highlighted.size }}
          </UBadge>
        </div>
      </UCard>
    </div>

    <USlideover v-model:open="open" :title="detail?.label ?? '加载中…'" :description="detail ? `${detail.category} · ${detail.domain}` : undefined">
      <template #body>
        <div v-if="pending" class="space-y-2">
          <USkeleton class="h-4 w-3/4" />
          <USkeleton class="h-4 w-full" />
          <USkeleton class="h-4 w-5/6" />
        </div>

        <div v-else-if="detail" class="space-y-4">
          <div class="flex flex-wrap gap-2">
            <UBadge variant="subtle">
              {{ detail.category }}
            </UBadge>
            <UBadge variant="subtle" color="neutral">
              发布于 {{ detail.issuedAt }}
            </UBadge>
            <UBadge variant="subtle" color="neutral">
              关联 {{ detail.degree }} 项
            </UBadge>
          </div>

          <ul class="space-y-2 text-sm">
            <li v-for="clause in detail.clauses" :key="clause.no" class="border-l-2 border-accented pl-3">
              <span class="font-medium">{{ clause.no }}</span>
              <p class="text-muted">
                {{ clause.text }}
              </p>
            </li>
          </ul>
        </div>
      </template>

      <template #footer>
        <div class="flex w-full items-center gap-2">
          <USelect
            v-model="depth"
            :items="[{ label: '一度', value: 1 }, { label: '二度', value: 2 }, { label: '三度', value: 3 }]"
            value-key="value"
            size="sm"
            class="w-28"
          />
          <UButton
            :loading="isExpanding"
            icon="i-lucide-git-branch-plus"
            size="sm"
            @click="expandSelected"
          >
            展开邻域
          </UButton>
          <UButton variant="ghost" color="neutral" size="sm" class="ml-auto" @click="open = false">
            关闭
          </UButton>
        </div>
      </template>
    </USlideover>
  </div>
</template>
