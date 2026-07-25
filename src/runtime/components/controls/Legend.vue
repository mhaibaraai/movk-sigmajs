<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import type { Attributes } from 'graphology-types'
import { useSigmaGraph } from '../../composables/use-sigma-graph'
import { useSigmaFilter } from '../../composables/use-sigma-filter'

defineOptions({ name: 'SigmaLegend', inheritAttrs: false })

export interface SigmaLegendGroup {
  /** 分组值，取自节点的 `field` 属性 */
  value: string
  /** 该组的代表色 */
  color: string
  /** 该组的节点数 */
  count: number
  /** 当前是否可见 */
  visible: boolean
}

const props = withDefaults(defineProps<{
  /**
   * 用于分组的节点属性名
   * @defaultValue 'type'
   */
  field?: string
  /**
   * 取色所用的节点属性名
   * @defaultValue 'color'
   */
  colorField?: string
  /**
   * 分组值缺失时归入的组名
   * @defaultValue '未分类'
   */
  fallback?: string
  /**
   * 点击条目切换该组显隐
   * @defaultValue true
   */
  toggleable?: boolean
  /**
   * reducer 链内次序，需高于选中高亮才能压过其配色
   * @defaultValue 200
   */
  order?: number
}>(), {
  field: 'type',
  colorField: 'color',
  fallback: '未分类',
  toggleable: true,
  order: 200
})

const { graph, version } = useSigmaGraph()
const { nodeFilter } = useSigmaFilter({ order: props.order })

const hidden = shallowRef<ReadonlySet<string>>(new Set())

const groups = computed<SigmaLegendGroup[]>(() => {
  void version.value

  const buckets = new Map<string, { color: string, count: number }>()

  graph.value.forEachNode((_key, attributes: Attributes) => {
    const value = String(attributes[props.field] ?? props.fallback)
    const existing = buckets.get(value)

    if (existing) {
      existing.count++
      return
    }

    buckets.set(value, {
      color: String(attributes[props.colorField] ?? 'currentColor'),
      count: 1
    })
  })

  return [...buckets].map(([value, bucket]) => ({
    value,
    color: bucket.color,
    count: bucket.count,
    visible: !hidden.value.has(value)
  }))
})

function toggle(value: string) {
  if (!props.toggleable) {
    return
  }

  const next = new Set(hidden.value)
  if (next.has(value)) {
    next.delete(value)
  }
  else {
    next.add(value)
  }
  hidden.value = next

  nodeFilter.value = next.size === 0
    ? null
    : (_key, attributes) => !next.has(String(attributes[props.field] ?? props.fallback))
}

function reset() {
  hidden.value = new Set()
  nodeFilter.value = null
}

defineExpose({ reset })
</script>

<template>
  <div
    class="sigma-legend"
    v-bind="$attrs"
  >
    <!-- 作用域连同 toggle / reset 一起给出：只给 groups 的话，接管外观就等于丢掉显隐切换 -->
    <slot
      :groups="groups"
      :toggle="toggle"
      :reset="reset"
    >
      <button
        v-for="group in groups"
        :key="group.value"
        type="button"
        class="sigma-legend-item"
        :aria-pressed="group.visible"
        :disabled="!toggleable"
        @click="toggle(group.value)"
      >
        <span
          class="sigma-legend-swatch"
          :style="{ background: group.color }"
        />
        <span>{{ group.value }}</span>
        <span class="sigma-legend-count">{{ group.count }}</span>
      </button>
    </slot>
  </div>
</template>
