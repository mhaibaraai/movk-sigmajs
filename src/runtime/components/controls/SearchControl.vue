<script setup lang="ts">
import { splitHighlight } from '@movk/core'
import type { HighlightSegment } from '@movk/core'
import { watchDebounced } from '@vueuse/core'
import { computed, shallowRef, useSlots } from 'vue'
import { useSigmaSearch } from '../../composables/use-sigma-search'
import type { SigmaSearchResult } from '../../composables/use-sigma-search'

defineOptions({ name: 'SigmaSearchControl', inheritAttrs: false })

const props = withDefaults(defineProps<{
  /**
   * 参与匹配的属性名
   * @defaultValue `['label']`
   */
  fields?: string[]
  /**
   * 结果条数上限
   * @defaultValue 10
   */
  limit?: number
  /**
   * 是否同时检索边
   * @defaultValue false
   */
  edges?: boolean
  /**
   * 输入到发起检索的防抖间隔，单位毫秒
   * @defaultValue 200
   */
  debounce?: number
  /**
   * 输入框占位文本
   * @defaultValue '检索节点'
   */
  placeholder?: string
  /**
   * 无结果时的提示文本
   * @defaultValue '无匹配'
   */
  emptyText?: string
}>(), {
  fields: () => ['label'],
  limit: 10,
  edges: false,
  debounce: 200,
  placeholder: '检索节点',
  emptyText: '无匹配'
})

const emit = defineEmits<{
  select: [result: SigmaSearchResult]
}>()

defineSlots<{
  /**
   * 接管输入框。作用域连行为一起给：`onKeydown` 一次绑完上下键、回车与 Esc，
   * `move` / `confirm` / `clear` 供自定义按键映射时使用。
   */
  input: (props: {
    /** 输入框即时值，不是防抖后参与匹配的词 */
    modelValue: string
    /** 透传自 `placeholder` prop */
    placeholder: string
    /** 结果列表是否展开，绑给 `aria-expanded` */
    open: boolean
    /** 当前键盘高亮项下标，未选中为 -1 */
    activeIndex: number
    /** 写回输入值 */
    onUpdate: (value: string) => void
    /** 上下键、回车、Esc 的完整处理 */
    onKeydown: (event: KeyboardEvent) => void
    /** 按增量移动高亮项，越界回绕 */
    move: (delta: number) => void
    /** 选中当前高亮项，未高亮时取第一条 */
    confirm: () => void
    /** 清空输入与高亮 */
    clear: () => void
  }) => unknown
  /**
   * 接管整个结果下拉容器。接管后 `#option` 与 `#empty` 不再渲染，
   * `.sigma-search-results` 的绝对定位、滚动与向上展开规则一并失效，需自行处理。
   */
  results: (props: {
    /** 当前检索结果 */
    results: SigmaSearchResult[]
    /** 当前键盘高亮项下标，未选中为 -1 */
    activeIndex: number
    /** 防抖后真正参与匹配的词 */
    query: string
    /** 按当前 query 切出命中片段 */
    highlight: (result: SigmaSearchResult) => HighlightSegment[]
    /** 聚焦到该结果、抛出 select 事件并清空输入 */
    choose: (result: SigmaSearchResult) => Promise<void>
  }) => unknown
  /** 接管单条结果的内容，`segments` 是已切好的命中片段 */
  option: (props: { result: SigmaSearchResult, segments: HighlightSegment[] }) => unknown
  /** 接管无结果时的提示内容 */
  empty: () => unknown
}>()

const slots = useSlots()

// #option 与 #empty 的出口位于 #results 的默认内容内部，接管后二者静默失效
if (import.meta.dev && slots.results && (slots.option || slots.empty)) {
  console.warn('[@movk/sigma] SigmaSearchControl 已接管 #results，#option 与 #empty 不再渲染')
}

const { query, results, focus } = useSigmaSearch({
  fields: props.fields,
  limit: props.limit,
  edges: props.edges
})

// 输入即时回显，检索按防抖触发：万级节点上每次按键都全量扫一遍会卡输入
const input = shallowRef('')
const activeIndex = shallowRef(-1)

watchDebounced(input, (value) => {
  query.value = value
  activeIndex.value = -1
}, { debounce: props.debounce })

const open = computed(() => input.value.trim().length > 0)

function segments(result: SigmaSearchResult) {
  return splitHighlight(result.label, query.value)
}

async function choose(result: SigmaSearchResult) {
  await focus(result)
  emit('select', result)
  input.value = ''
  query.value = ''
  activeIndex.value = -1
}

function move(delta: number) {
  const total = results.value.length
  if (total === 0) {
    return
  }
  activeIndex.value = (activeIndex.value + delta + total) % total
}

function confirm() {
  const result = results.value[activeIndex.value] ?? results.value[0]
  if (result) {
    choose(result)
  }
}

function clear() {
  input.value = ''
  query.value = ''
  activeIndex.value = -1
}

function setInput(value: string) {
  input.value = value
}

function onKeydown(event: KeyboardEvent) {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      move(1)
      break
    case 'ArrowUp':
      event.preventDefault()
      move(-1)
      break
    case 'Enter':
      event.preventDefault()
      confirm()
      break
    case 'Escape':
      clear()
      break
  }
}
</script>

<template>
  <div
    class="sigma-search"
    v-bind="$attrs"
  >
    <slot
      name="input"
      :model-value="input"
      :placeholder="placeholder"
      :open="open"
      :active-index="activeIndex"
      :on-update="setInput"
      :on-keydown="onKeydown"
      :move="move"
      :confirm="confirm"
      :clear="clear"
    >
      <input
        v-model="input"
        class="sigma-search-input"
        type="search"
        role="combobox"
        aria-autocomplete="list"
        :aria-expanded="open"
        :placeholder="placeholder"
        @keydown="onKeydown"
      >
    </slot>

    <slot
      v-if="open"
      name="results"
      :results="results"
      :active-index="activeIndex"
      :query="query"
      :highlight="segments"
      :choose="choose"
    >
      <ul
        class="sigma-search-results"
        role="listbox"
      >
        <li
          v-for="(result, index) in results"
          :key="result.id"
          role="presentation"
        >
          <button
            type="button"
            class="sigma-search-option"
            role="option"
            :aria-selected="index === activeIndex"
            @click="choose(result)"
          >
            <slot
              :result="result"
              :segments="segments(result)"
              name="option"
            >
              <span
                v-for="(segment, i) in segments(result)"
                :key="i"
                :class="segment.match ? 'sigma-search-match' : undefined"
              >{{ segment.text }}</span>
            </slot>
          </button>
        </li>

        <li
          v-if="results.length === 0"
          class="sigma-search-empty"
        >
          <slot name="empty">
            {{ emptyText }}
          </slot>
        </li>
      </ul>
    </slot>
  </div>
</template>
