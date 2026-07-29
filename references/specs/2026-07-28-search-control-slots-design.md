# SigmaSearchControl 插槽接管设计

日期：2026-07-28
状态：待实现

## 背景

使用方希望检索控件的输入框用 `UInput`（`@nuxt/ui`）实现，以便与项目其余部分的主题、图标、尺寸体系一致。

直接在 `src/runtime/components/controls/SearchControl.vue` 里换成 `<UInput>` 会同时踩两条红线：

- **runtime 目录禁用自动导入**：模块装进消费方 `node_modules` 后不启用自动导入，`UInput` 解析不到，发布后炸。
- **`playgrounds/basic` 零 UI 依赖**：内置控件是「纯原生逃生舱」的说服力来源，引入 `@nuxt/ui` peer 会让这个分区作废。

因此外观接管走插槽，与控件已有的 `#option` / `#empty` 保持同一模式：库内继续渲染原生 `<input>` 与 `<ul>` 作为默认内容，使用方按需接管。

## 目标

- `SigmaSearchControl` 新增 `#input` 与 `#results` 两个作用域插槽，作用域连行为一起交出。
- `playgrounds/ui` 演示用 `UInput` 接管输入框、用 Nuxt UI 组件接管下拉。
- `#option` / `#empty` 的现有写法零改动，无 breaking change。

## 非目标

- 不给库添加任何 UI 库依赖。
- 不修改 `docs/app/components/content/examples/SearchControlExample.vue`。示例的依赖白名单禁用 `@nuxt/ui` 自动导入，改了 `pnpm dev:build` 会在 basic 侧失败。
- 不做虚拟滚动、不做异步检索源，本次只处理外观接管。

## 插槽结构

四个插槽出口的物理嵌套关系是设计的核心：

```vue
<div class="sigma-search" v-bind="$attrs">
  <slot name="input" v-bind="inputScope">
    <input v-model="input" class="sigma-search-input" ... @keydown="onKeydown">
  </slot>

  <slot v-if="open" name="results" v-bind="resultsScope">
    <ul class="sigma-search-results" role="listbox">
      <li v-for="(result, index) in results" :key="result.id" role="presentation">
        <button class="sigma-search-option" role="option" @click="choose(result)">
          <slot name="option" :result="result" :segments="segments(result)">
            <!-- 默认高亮片段 -->
          </slot>
        </button>
      </li>
      <li v-if="results.length === 0" class="sigma-search-empty">
        <slot name="empty">{{ emptyText }}</slot>
      </li>
    </ul>
  </slot>
</div>
```

`#option` 与 `#empty` 的出口位于 `#results` 默认内容的内部，由此得到三层用法：

| 传入 | 行为 |
| --- | --- |
| 都不传 | 库内极简外观，现状 |
| 只传 `#option` / `#empty` | 只换条目内容，白拿容器的绝对定位、滚动、`role="listbox"`、键盘高亮 |
| 传 `#results` | 整个 `<ul>` 被替换，`#option` / `#empty` 的出口随默认内容一起从渲染树消失 |

最后一行是 Vue 插槽的自然行为，不需要额外代码，但会**静默**发生。因此在 `import.meta.dev` 下检测「同时传入 `#results` 与 `#option` / `#empty`」并 `console.warn` 提示后者已失效。

两个粒度都保留：`#option` 是「换外观白拿全部行为」，`#results` 是「连容器带交互一起重写」。删掉 `#option` 既是 breaking change，也把「换个图标」的成本抬到「重写下拉」。

## 作用域字段

### `#input`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `modelValue` | `string` | 输入框即时值，非防抖后的 `query` |
| `placeholder` | `string` | 透传 `placeholder` prop |
| `open` | `boolean` | 下拉是否展开，绑给 `aria-expanded` |
| `activeIndex` | `number` | 当前键盘高亮项下标，未选中为 `-1` |
| `onUpdate` | `(value: string) => void` | 写回输入值 |
| `onKeydown` | `(event: KeyboardEvent) => void` | 一行绑完上下键、回车、Esc |
| `move` | `(delta: number) => void` | 逃生原语，自定义按键映射用 |
| `confirm` | `() => void` | 同上 |
| `clear` | `() => void` | 同上 |

### `#results`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `results` | `SigmaSearchResult[]` | 检索结果 |
| `activeIndex` | `number` | 键盘高亮项下标 |
| `query` | `string` | 防抖后真正参与匹配的词 |
| `highlight` | `(result: SigmaSearchResult) => HighlightSegment[]` | 命中切片，复用 `splitHighlight` |
| `choose` | `(result: SigmaSearchResult) => Promise<void>` | 聚焦 + `select` emit + 清空 |

`#results` 的切片函数命名为 `highlight` 而非 `segments`，是为了避开与 `#option` 作用域中 `segments: HighlightSegment[]`（已切好的数组）同名不同型的冲突。`#option` 保持原样不动。

## 键盘处理收敛

现有键盘逻辑写在模板修饰符上（`@keydown.down.prevent="move(1)"` 等），`UInput` 接管后这些修饰符无法复用。收敛为单个 `onKeydown(event)`，逐条等价：

| 按键 | 行为 |
| --- | --- |
| `ArrowDown` | `preventDefault()` + `move(1)` |
| `ArrowUp` | `preventDefault()` + `move(-1)` |
| `Enter` | `preventDefault()` + `confirm()` |
| `Escape` | `clear()`，**不带** `preventDefault()`，与现状一致 |

默认插槽内的原生 `<input>` 同样改用 `@keydown="onKeydown"`，两条路径共用一份实现。

## 样式影响

`src/runtime/index.css` 的 `.sigma-search-*` 规则一行不删，默认内容仍在使用。

`.sigma-search` 的 `position: relative` 保留作定位锚点，但接管 `#results` 后绝对定位与层级由使用方负责——`.sigma-search-results` 现有的 `position: absolute`、`top`、`z-index`、以及 `:where(.sigma-controls[data-position^="bottom"])` 的向上展开规则都随默认内容一起失效。这点写进 `#results` 的 JSDoc。

## 类型声明

用 `defineSlots<>()` 显式标注四个插槽。`HighlightSegment` 从 `@movk/core` 显式 `import type`，`SigmaSearchResult` 从 `../../composables/use-sigma-search` 显式 `import type`——runtime 目录不依赖自动导入。

`vue-component-meta` 目前读不到插槽描述（上游缺口），但类型会出现在 `:component-slots` 表里，JSDoc 照写，IDE hover 可用。

## 示例

`playgrounds/ui/app/components/content/examples/ThemedSearchExample.vue` 改为同时演示两个新插槽：

```vue
<SigmaSearchControl :fields="['label', 'category']" placeholder="试试「技术」">
  <template #input="{ modelValue, placeholder, open, onUpdate, onKeydown }">
    <UInput
      :model-value="modelValue"
      :placeholder="placeholder"
      :aria-expanded="open"
      icon="i-lucide-search"
      @update:model-value="onUpdate"
      @keydown="onKeydown"
    />
  </template>

  <template #results="{ results, activeIndex, highlight, choose }">
    <!-- UCard 容器，自行 absolute 定位 -->
  </template>
</SigmaSearchControl>
```

这正是 `playgrounds/ui` 的既定职责（插槽接管控件外观）。

原示例演示的是 `#option` / `#empty`，那份演示价值不能丢：`ThemedSearchExample.vue` 改为演示 `#input` + `#results` 的完全接管，另新建 `ThemedSearchOptionExample.vue` 保留原有的 `#option` / `#empty` 演示，两者一并列在 `pages/themed.vue`。

该页实例数由此从 3 增至 4，正好落在 AGENTS.md「同屏不超过四个实例」的上限（4 × 3 = 12 个 WebGL 上下文，浏览器上限多为 16）。**此后该页不得再加渲染 sigma 的示例**，要加须先引入视口内懒挂载。

## 测试

`test/controls.test.ts` 在现有 `describe('SigmaSearchControl')` 下补三条：

1. `#input` 接管后，调用作用域的 `onUpdate` 能驱动检索出结果；派发 `ArrowDown` 给 `onKeydown` 能推进 `activeIndex`。
2. `#results` 接管后，调用作用域的 `choose` 能触发相机聚焦与 `select` emit，且输入被清空。
3. 同时传 `#results` 与 `#option` 时，`#option` 内容不出现在 DOM 中，且 `vi.spyOn(console, 'warn')` 捕获到告警（`import.meta.dev` 在 vitest 里被 transform 为 `true`）。

现有 5 条默认路径用例保持通过，验证无回归。

## 风险

- `#results` 接管后使用方漏写绝对定位，下拉会挤在输入框下方撑开控件容器。JSDoc 必须写明，示例必须给出正确写法。
- 同时传 `#results` 与 `#option` 的静默失效，靠 dev 告警兜底。生产构建无告警，这是有意的。
- 改动 `src/runtime/` 后 playground 表现异常需先跑 `pnpm dev:prepare`。
