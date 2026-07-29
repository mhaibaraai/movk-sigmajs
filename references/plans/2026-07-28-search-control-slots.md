# SigmaSearchControl 插槽接管实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 给 `SigmaSearchControl` 新增 `#input` 与 `#results` 两个作用域插槽，使输入框可被 `UInput` 等外部组件接管，而库本身不引入任何 UI 依赖。

**Architecture:** 库内继续渲染原生 `<input>` 与 `<ul>` 作为插槽默认内容；`#option` / `#empty` 的出口物理嵌套在 `#results` 的默认内容内部，接管 `#results` 即整体重写下拉。分散在模板修饰符上的键盘逻辑收敛为单个 `onKeydown(event)`，两条渲染路径共用。

**Tech Stack:** Vue 3.5 `<script setup>`、`defineSlots<>()`、vitest + happy-dom + `@vue/test-utils`、`@movk/core` 的 `splitHighlight`。

设计依据：[references/specs/2026-07-28-search-control-slots-design.md](../specs/2026-07-28-search-control-slots-design.md)

## Global Constraints

- **runtime 目录禁用自动导入**：`src/runtime/` 内所有 Vue API、`@movk/core`、`@vueuse/core`、库内 composables 一律显式 `import`，包括 `useSlots`。
- **不引入任何 UI 库依赖**：`package.json` 的 `dependencies` / `peerDependencies` 一行不动。
- **不修改 `docs/app/components/content/examples/SearchControlExample.vue`**：示例依赖白名单禁用 `@nuxt/ui` 自动导入，改了 `pnpm dev:build` 会在 basic 侧失败。
- **`#option` / `#empty` 零 breaking change**：现有作用域字段名与类型（`result: SigmaSearchResult`、`segments: HighlightSegment[]` 数组）保持不变。
- **dev 告警写法**：`if (import.meta.dev)` 包裹 `console.warn('[@movk/sigma] …')`，与 `src/runtime/components/Graph.vue:295` 一致。
- **JSDoc 规范**：默认值用 `@defaultValue`，不写进描述文本；中文描述用全角标点，中英文之间加空格。
- **注释规范**：不写装饰性分隔注释，不写 emoji，不留「修改」「优化」这类标记。
- **提交规范**：Conventional Commits，description / body 用中文，不加 co-author。
- **当前分支**：`feat/search-control-slots`。

---

### Task 1: `#input` 插槽与键盘处理收敛

**Files:**
- Modify: `src/runtime/components/controls/SearchControl.vue`
- Test: `test/controls.test.ts`（在现有 `describe('SigmaSearchControl')` 内追加）

**Interfaces:**
- Consumes: 无（首个任务）
- Produces: `#input` 作用域对象，字段与类型为

  ```ts
  {
    modelValue: string
    placeholder: string
    open: boolean
    activeIndex: number
    onUpdate: (value: string) => void
    onKeydown: (event: KeyboardEvent) => void
    move: (delta: number) => void
    confirm: () => void
    clear: () => void
  }
  ```

  以及组件内部函数 `onKeydown(event: KeyboardEvent): void`，Task 2 的默认插槽路径继续使用它。

- [ ] **Step 1: 写失败测试**

在 `test/controls.test.ts` 的 `describe('SigmaSearchControl', …)` 内、`it('输入为空时不展开结果列表', …)` 之后追加两条用例：

```ts
  it('#input 插槽接管后仍能驱动检索与键盘导航', async () => {
    const { wrapper } = await mountControl(() =>
      h(SigmaSearchControl, { debounce: 0 }, {
        input: (scope: {
          modelValue: string
          activeIndex: number
          onUpdate: (value: string) => void
          onKeydown: (event: KeyboardEvent) => void
        }) => h('input', {
          'class': 'custom-input',
          'value': scope.modelValue,
          'data-active': scope.activeIndex,
          'onInput': (event: Event) => scope.onUpdate((event.target as HTMLInputElement).value),
          'onKeydown': scope.onKeydown
        })
      })
    )

    expect(wrapper.find('.sigma-search-input').exists()).toBe(false)

    await wrapper.find('.custom-input').setValue('制度')
    await vi.waitFor(async () => {
      await nextTick()
      if (wrapper.findAll('.sigma-search-option').length !== 2) {
        throw new Error('结果尚未就绪')
      }
    })

    await wrapper.find('.custom-input').trigger('keydown', { key: 'ArrowDown' })
    await nextTick()

    expect(wrapper.find('.custom-input').attributes('data-active')).toBe('0')
    expect(wrapper.findAll('.sigma-search-option')[0]!.attributes('aria-selected')).toBe('true')
  })

  it('#input 作用域的 onKeydown 支持 Esc 清空', async () => {
    const { wrapper } = await mountControl(() =>
      h(SigmaSearchControl, { debounce: 0 }, {
        input: (scope: {
          modelValue: string
          onUpdate: (value: string) => void
          onKeydown: (event: KeyboardEvent) => void
        }) => h('input', {
          class: 'custom-input',
          value: scope.modelValue,
          onInput: (event: Event) => scope.onUpdate((event.target as HTMLInputElement).value),
          onKeydown: scope.onKeydown
        })
      })
    )

    await wrapper.find('.custom-input').setValue('制度')
    await vi.waitFor(async () => {
      await nextTick()
      if (!wrapper.find('.sigma-search-option').exists()) {
        throw new Error('结果尚未就绪')
      }
    })

    await wrapper.find('.custom-input').trigger('keydown', { key: 'Escape' })
    await nextTick()

    expect(wrapper.find('.sigma-search-results').exists()).toBe(false)
    expect((wrapper.find('.custom-input').element as HTMLInputElement).value).toBe('')
  })
```

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm vitest run test/controls.test.ts -t '#input'`

Expected: FAIL。`#input` 插槽尚不存在，组件仍渲染 `.sigma-search-input`，第一条在 `expect(wrapper.find('.sigma-search-input').exists()).toBe(false)` 处失败；`.custom-input` 根本不存在，第二条在 `find('.custom-input').setValue` 处报错。

- [ ] **Step 3: 收敛键盘处理**

在 `src/runtime/components/controls/SearchControl.vue` 的 `<script setup>` 里，`clear()` 函数之后追加：

```ts
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
```

`Escape` 不调 `preventDefault()`，与替换前的 `@keydown.esc="clear"` 保持一致。

- [ ] **Step 4: 声明插槽类型**

在同一个 `<script setup>` 内，`const emit = defineEmits…` 之后追加。类型写成内联字面量，不导出具名 interface——避免牵动 `src/runtime/types/public.ts` 与 `test/type-exports.test-d.ts`：

```ts
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
  /** 接管单条结果的内容，`segments` 是已切好的命中片段 */
  option: (props: { result: SigmaSearchResult, segments: HighlightSegment[] }) => unknown
  /** 接管无结果时的提示内容 */
  empty: () => unknown
}>()
```

同时在文件顶部的 import 区补上类型导入（runtime 禁用自动导入，必须显式写）：

```ts
import type { HighlightSegment } from '@movk/core'
```

- [ ] **Step 5: 模板包上 `#input` 插槽**

把 `<template>` 里的 `<input …>` 整块替换为：

```vue
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
```

四个 `@keydown.*` 修饰符由 `@keydown="onKeydown"` 一条取代。`setInput` 在 `<script setup>` 里定义，紧邻 `clear()`：

```ts
function setInput(value: string) {
  input.value = value
}
```

不直接把 `input` ref 交出去，是为了让作用域字段保持纯值与纯函数，使用方无须了解 ref。

- [ ] **Step 6: 跑测试确认通过**

Run: `pnpm vitest run test/controls.test.ts`

Expected: PASS，`SigmaSearchControl` 下 7 条全绿（原有 5 条 + 新增 2 条）。原有 5 条走默认插槽路径，是键盘收敛的回归守门人。

- [ ] **Step 7: 提交**

```bash
git add src/runtime/components/controls/SearchControl.vue test/controls.test.ts
git commit -m "feat(search): 检索控件新增 #input 插槽

输入框可被外部组件接管，作用域一并给出 onKeydown 与 move/confirm/clear，
接管外观不丢键盘导航。原本散在模板修饰符上的四个按键处理收敛为单个
onKeydown，默认插槽与接管路径共用同一份实现。"
```

---

### Task 2: `#results` 插槽与 dev 告警

**Files:**
- Modify: `src/runtime/components/controls/SearchControl.vue`
- Test: `test/controls.test.ts`

**Interfaces:**
- Consumes: Task 1 建立的 `defineSlots<>()` 块与模板结构。
- Produces: `#results` 作用域对象，字段与类型为

  ```ts
  {
    results: SigmaSearchResult[]
    activeIndex: number
    query: string
    highlight: (result: SigmaSearchResult) => HighlightSegment[]
    choose: (result: SigmaSearchResult) => Promise<void>
  }
  ```

  切片函数命名为 `highlight` 而非 `segments`，避开与 `#option` 作用域中 `segments: HighlightSegment[]`（数组）同名不同型。

- [ ] **Step 1: 写失败测试**

在 `test/controls.test.ts` 的 `describe('SigmaSearchControl')` 内继续追加两条：

```ts
  it('#results 插槽接管整个下拉容器', async () => {
    const { wrapper, instance } = await mountControl(() =>
      h(SigmaSearchControl, { debounce: 0 }, {
        results: (scope: {
          results: Array<{ id: string, label: string }>
          highlight: (result: { id: string, label: string }) => Array<{ text: string, match: boolean }>
          choose: (result: { id: string, label: string }) => Promise<void>
        }) => h('div', { class: 'custom-results' }, scope.results.map(result =>
          h('button', {
            class: 'custom-option',
            onClick: () => scope.choose(result)
          }, scope.highlight(result).map(segment =>
            h('span', { class: segment.match ? 'custom-match' : undefined }, segment.text)
          ))
        ))
      })
    )

    await wrapper.find('input').setValue('条例')
    await vi.waitFor(async () => {
      await nextTick()
      if (!wrapper.find('.custom-option').exists()) {
        throw new Error('结果尚未就绪')
      }
    })

    expect(wrapper.find('.sigma-search-results').exists()).toBe(false)
    expect(wrapper.find('.custom-match').text()).toBe('条例')

    await wrapper.find('.custom-option').trigger('click')
    await vi.waitFor(() => {
      if (instance.camera.animated.length === 0) {
        throw new Error('相机尚未移动')
      }
    })

    expect(wrapper.findComponent(SigmaSearchControl).emitted('select')).toHaveLength(1)
  })

  it('同时传 #results 与 #option 时告警且 #option 不渲染', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const { wrapper } = await mountControl(() =>
      h(SigmaSearchControl, { debounce: 0 }, {
        results: () => h('div', { class: 'custom-results' }, '自定义下拉'),
        option: () => h('span', { class: 'custom-option-slot' }, '不该出现')
      })
    )

    await wrapper.find('input').setValue('制度')
    await vi.waitFor(async () => {
      await nextTick()
      if (!wrapper.find('.custom-results').exists()) {
        throw new Error('自定义下拉尚未渲染')
      }
    })

    expect(wrapper.find('.custom-option-slot').exists()).toBe(false)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('#results'))

    warn.mockRestore()
  })
```

`vi.spyOn` 必须在 `mountControl` 之前装好——告警在组件 `setup` 期发出。

- [ ] **Step 2: 跑测试确认失败**

Run: `pnpm vitest run test/controls.test.ts -t '#results'`

Expected: FAIL。`#results` 插槽尚不存在，`.custom-option` 永不出现，两条都卡在 `vi.waitFor` 超时。

- [ ] **Step 3: 补 dev 告警**

在 `src/runtime/components/controls/SearchControl.vue` 的 `<script setup>` 里，`defineSlots<>()` 之后追加：

```ts
const slots = useSlots()

// #option 与 #empty 的出口位于 #results 的默认内容内部，接管后二者静默失效
if (import.meta.dev && slots.results && (slots.option || slots.empty)) {
  console.warn('[@movk/sigma] SigmaSearchControl 已接管 #results，#option 与 #empty 不再渲染')
}
```

`useSlots` 加进文件顶部的 vue 导入：

```ts
import { computed, shallowRef, useSlots } from 'vue'
```

- [ ] **Step 4: 声明 `#results` 插槽类型**

在 Task 1 建立的 `defineSlots<>()` 块内，`input` 之后、`option` 之前插入：

```ts
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
```

- [ ] **Step 5: 模板包上 `#results` 插槽**

把 `<template>` 里的 `<ul v-if="open" …>…</ul>` 整块替换为：

```vue
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
```

`v-if="open"` 从 `<ul>` 移到 `<slot>`，接管后的容器同样只在有输入时渲染。`:highlight="segments"` 把组件内已有的 `segments(result)` 函数原样交出，不新增实现。

- [ ] **Step 6: 跑测试确认通过**

Run: `pnpm vitest run test/controls.test.ts`

Expected: PASS，`SigmaSearchControl` 下 9 条全绿。

- [ ] **Step 7: 类型检查与 lint**

Run: `pnpm exec vue-tsc --noEmit && pnpm lint`

Expected: 两条都退出码 0。`vue-tsc` 覆盖 `src/` 依赖根 `tsconfig.json` 的 `extends: "./.nuxt/tsconfig.json"`，若报找不到 `.nuxt`，先跑 `pnpm dev:prepare`。

- [ ] **Step 8: 提交**

```bash
git add src/runtime/components/controls/SearchControl.vue test/controls.test.ts
git commit -m "feat(search): 检索控件新增 #results 插槽

下拉容器可整体重写，作用域给出 results/activeIndex/query/highlight/choose，
切片函数命名为 highlight 以避开 #option 作用域中同名的 segments 数组。
#option 与 #empty 的出口嵌套在 #results 默认内容内部，同时传入时开发环境告警。"
```

---

### Task 3: `playgrounds/ui` 用 UInput 演示接管

**Files:**
- Modify: `playgrounds/ui/app/components/content/examples/ThemedSearchExample.vue`
- Create: `playgrounds/ui/app/components/content/examples/ThemedSearchOptionExample.vue`
- Modify: `playgrounds/ui/app/pages/themed.vue:3-19`

**Interfaces:**
- Consumes: Task 1 的 `#input` 作用域与 Task 2 的 `#results` 作用域，字段名与类型见上。
- Produces: 无（终端任务）

- [ ] **Step 1: 新建 `#option` 演示，保住既有覆盖**

`ThemedSearchExample.vue` 现在演示的是 `#option` / `#empty`，那份价值不能随改动丢掉。先把它整份复制为 `playgrounds/ui/app/components/content/examples/ThemedSearchOptionExample.vue`，只改顶部注释与 `placeholder`：

```vue
<script setup lang="ts">
/**
 * 只接管条目内容的最小粒度。
 *
 * option 作用域给的 segments 是已经切好的命中片段，高亮逻辑不必自己重写，
 * 容器的绝对定位、滚动、role="listbox" 与键盘高亮全部白拿。
 */
const categories = ['管理制度', '技术标准', '操作规程', '应急预案']
const colors = ['#f43f5e', '#3b82f6', '#22c55e', '#a855f7']

const nodes = Array.from({ length: 20 }, (_, index) => {
  const angle = (index / 20) * Math.PI * 2
  return {
    key: `n${index}`,
    attributes: {
      label: `${categories[index % 4]} ${index + 1}`,
      category: categories[index % 4],
      x: Math.cos(angle) * 18,
      y: Math.sin(angle) * 18,
      size: 9,
      color: colors[index % 4]
    }
  }
})

const data = {
  attributes: {},
  options: { type: 'mixed' as const, multi: false, allowSelfLoops: true },
  nodes,
  edges: nodes.slice(1).map((node, index) => ({ source: nodes[index]!.key, target: node.key }))
}
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaControls position="top-right">
      <SigmaSearchControl :fields="['label', 'category']" placeholder="试试「技术」">
        <template #option="{ result, segments }">
          <span class="flex w-full items-center gap-2">
            <UIcon name="i-lucide-file-text" class="size-3.5 shrink-0 opacity-60" />
            <span class="truncate">
              <span
                v-for="(segment, index) in segments"
                :key="index"
                :class="segment.match ? 'text-primary font-medium' : undefined"
              >{{ segment.text }}</span>
            </span>
            <UBadge size="sm" variant="subtle" color="neutral" class="ml-auto shrink-0">
              {{ result.field }}
            </UBadge>
          </span>
        </template>

        <template #empty>
          <span class="inline-flex items-center gap-1.5 text-muted">
            <UIcon name="i-lucide-search-x" class="size-3.5" />
            没有匹配的文件
          </span>
        </template>
      </SigmaSearchControl>
    </SigmaControls>
  </SigmaGraph>
</template>
```

- [ ] **Step 2: 改写 `ThemedSearchExample.vue` 为完全接管**

整份替换 `playgrounds/ui/app/components/content/examples/ThemedSearchExample.vue`：

```vue
<script setup lang="ts">
/**
 * 输入框与下拉的完全接管。
 *
 * input 作用域的 onKeydown 一次绑完上下键、回车与 Esc；
 * results 作用域接管容器后要自行绝对定位，库内的 .sigma-search-results 已不参与。
 */
const categories = ['管理制度', '技术标准', '操作规程', '应急预案']
const colors = ['#f43f5e', '#3b82f6', '#22c55e', '#a855f7']

const nodes = Array.from({ length: 20 }, (_, index) => {
  const angle = (index / 20) * Math.PI * 2
  return {
    key: `n${index}`,
    attributes: {
      label: `${categories[index % 4]} ${index + 1}`,
      category: categories[index % 4],
      x: Math.cos(angle) * 18,
      y: Math.sin(angle) * 18,
      size: 9,
      color: colors[index % 4]
    }
  }
})

const data = {
  attributes: {},
  options: { type: 'mixed' as const, multi: false, allowSelfLoops: true },
  nodes,
  edges: nodes.slice(1).map((node, index) => ({ source: nodes[index]!.key, target: node.key }))
}
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaControls position="top-right">
      <SigmaSearchControl :fields="['label', 'category']" placeholder="试试「技术」">
        <template #input="{ modelValue, placeholder, open, onUpdate, onKeydown }">
          <UInput
            :model-value="modelValue"
            :placeholder="placeholder"
            :aria-expanded="open"
            icon="i-lucide-search"
            size="sm"
            role="combobox"
            aria-autocomplete="list"
            @update:model-value="value => onUpdate(String(value))"
            @keydown="onKeydown"
          />
        </template>

        <template #results="{ results, activeIndex, highlight, choose }">
          <div
            class="absolute inset-x-0 top-full z-10 mt-1 flex max-h-52 flex-col gap-1 overflow-y-auto rounded-lg border border-default bg-default p-1"
            role="listbox"
          >
            <UButton
              v-for="(result, index) in results"
              :key="result.id"
              color="neutral"
              :variant="index === activeIndex ? 'soft' : 'ghost'"
              size="xs"
              block
              class="justify-start"
              role="option"
              :aria-selected="index === activeIndex"
              @click="choose(result)"
            >
              <UIcon name="i-lucide-file-text" class="size-3.5 shrink-0 opacity-60" />
              <span class="truncate">
                <span
                  v-for="(segment, i) in highlight(result)"
                  :key="i"
                  :class="segment.match ? 'text-primary font-medium' : undefined"
                >{{ segment.text }}</span>
              </span>
              <UBadge size="sm" variant="subtle" color="neutral" class="ml-auto shrink-0">
                {{ result.field }}
              </UBadge>
            </UButton>

            <p v-if="results.length === 0" class="px-2 py-1.5 text-sm text-muted">
              没有匹配的文件
            </p>
          </div>
        </template>
      </SigmaSearchControl>
    </SigmaControls>
  </SigmaGraph>
</template>
```

`top-full` 靠的是 `.sigma-search` 自带的 `position: relative`，那条规则在库内保留。`@update:model-value` 收到的是 `string | number`，用 `String()` 收窄后再交给 `onUpdate`。

- [ ] **Step 3: 把新示例接进 themed 页**

修改 `playgrounds/ui/app/pages/themed.vue` 的 `examples` 数组（第 3-19 行），把检索一项替换为两项：

```ts
const examples = [
  {
    title: '缩放与全屏',
    name: 'ThemedControlsExample',
    description: '右上是原样外观，右下把图标插槽换成 UIcon。库只负责行为与无障碍结构，aria-label、aria-pressed、焦点顺序都还在。'
  },
  {
    title: '图例',
    name: 'ThemedLegendExample',
    description: '默认插槽以 groups / toggle / reset 暴露聚合结果与行为，换渲染不丢功能。'
  },
  {
    title: '检索：完全接管',
    name: 'ThemedSearchExample',
    description: 'input 与 results 两个插槽把输入框换成 UInput、下拉换成 Nuxt UI 面板。onKeydown 一次绑完上下键、回车与 Esc，键盘导航不丢。'
  },
  {
    title: '检索：只换条目',
    name: 'ThemedSearchOptionExample',
    description: 'option 插槽拿到的 segments 是切好的命中片段，容器的定位、滚动与键盘高亮全部白拿。'
  }
]
```

这一页的 sigma 实例数由此从 3 增至 4，正好落在「同屏不超过四个实例」的上限（4 × 3 = 12 个 WebGL 上下文）。此后不得再往该页加渲染 sigma 的示例。

- [ ] **Step 4: 起 playground 肉眼验证**

Run: `pnpm dev:prepare && pnpm dev:ui`

打开 `/themed`，逐条确认：

1. 检索框是 UInput 外观，带 `i-lucide-search` 图标。
2. 输入「技术」出现 Nuxt UI 面板，下拉正确浮在输入框下方而非撑开控件容器。
3. 上下键能移动高亮（`aria-selected` 生效）、回车跳转、Esc 清空。
4. 「只换条目」那一条仍是库内容器外观，条目里有 UIcon 与 UBadge。
5. 控制台没有 `#results` 相关告警——两个示例都没有同时传 `#results` 与 `#option`。
6. 右上角切深色模式，未接管的小地图跟着变。

`pnpm dev:prepare` 不能省：改过 `src/runtime/` 后 playground 加载的是 `dist/` 里的副本。

- [ ] **Step 5: 验证 basic 与 docs 未被波及**

Run: `pnpm dev:build`

Expected: `playgrounds/basic` 与 `playgrounds/ui` 均构建成功。basic 零 UI 依赖，若本次误把 `@nuxt/ui` 组件写进了 `src/runtime/` 或 docs 的示例目录，这一步会失败。

- [ ] **Step 6: 全量校验**

Run: `pnpm test && pnpm lint && pnpm typecheck`

Expected: 三条都退出码 0。

- [ ] **Step 7: 提交**

```bash
git add playgrounds/ui/app/components/content/examples/ThemedSearchExample.vue \
        playgrounds/ui/app/components/content/examples/ThemedSearchOptionExample.vue \
        playgrounds/ui/app/pages/themed.vue
git commit -m "docs(playground): 检索控件演示 UInput 完全接管

ThemedSearchExample 改为演示 input 与 results 两个插槽的完全接管，
原有的 option/empty 演示拆出为 ThemedSearchOptionExample，两种粒度并列。
themed 页 sigma 实例数达到四个上限，此后加示例需先做懒挂载。"
```

---

## 完成标准

- `pnpm test`、`pnpm lint`、`pnpm typecheck`、`pnpm dev:build` 四条全绿。
- `SigmaSearchControl` 的 `#option` / `#empty` 现有用法一行未改仍然工作（原有 5 条测试是守门人）。
- `package.json` 的依赖字段一行未动。
- `docs/app/components/content/examples/SearchControlExample.vue` 一行未改。
