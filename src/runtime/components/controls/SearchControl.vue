<script setup lang="ts">
import { splitHighlight } from '@movk/core'
import { watchDebounced } from '@vueuse/core'
import { computed, shallowRef } from 'vue'
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
</script>

<template>
  <div
    class="sigma-search"
    v-bind="$attrs"
  >
    <input
      v-model="input"
      class="sigma-search-input"
      type="search"
      role="combobox"
      aria-autocomplete="list"
      :aria-expanded="open"
      :placeholder="placeholder"
      @keydown.down.prevent="move(1)"
      @keydown.up.prevent="move(-1)"
      @keydown.enter.prevent="confirm"
      @keydown.esc="clear"
    >

    <ul
      v-if="open"
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
  </div>
</template>
