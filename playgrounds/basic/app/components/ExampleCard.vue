<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, shallowRef } from 'vue'

const props = withDefaults(defineProps<{
  /** 示例标题 */
  title: string
  /** 一句话说明这个示例验证什么 */
  description?: string
  /**
   * 示例组件名，与 docs 的 `:component-example{name}` 对齐
   */
  name?: string
  /**
   * 舞台高度
   * @defaultValue '360px'
   */
  height?: string
}>(), {
  height: '360px'
})

const root = shallowRef<HTMLElement | null>(null)
const active = shallowRef(false)
let observer: IntersectionObserver | undefined

// 源码取自 docs 的示例目录（唯一数据源），eager 是为了让折叠展开时无需等待网络。
// 这里不做语法高亮：basic 的定位是零 UI 依赖的干净项目验证信号，高亮版看文档站
const sources = import.meta.glob<string>('#examples/*.vue', {
  query: '?raw',
  import: 'default',
  eager: true
})

const source = computed(() => {
  if (!props.name) {
    return ''
  }
  const entry = Object.entries(sources).find(([path]) => path.endsWith(`/${props.name}.vue`))
  return entry?.[1] ?? ''
})

const copied = shallowRef(false)
let copiedTimer: ReturnType<typeof setTimeout> | undefined

async function copy() {
  try {
    await navigator.clipboard.writeText(source.value)
    copied.value = true
    clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => {
      copied.value = false
    }, 1600)
  }
  catch {
    // 非安全上下文或用户拒绝授权时静默降级，源码本身仍可手动选中复制
    copied.value = false
  }
}

/**
 * 进入视口才挂载示例，离开视口后卸载。
 *
 * 这不是性能优化，是硬约束：浏览器的 WebGL 上下文上限多在 16 个，而每个 Sigma
 * 实例要占 3 个（sigma-edges / sigma-nodes / sigma-hoverNodes 三张画布走 WebGL，
 * 另外四张是 2D）。超出后最早的上下文被强制丢弃，画布直接变空白。
 *
 * rootMargin 必须是 0：一张卡不一定只有一个实例（多实例示例就带两个），
 * 放宽到 20% 时 SigmaGraph 那页能凑到 6 个实例、18 个上下文，仍会超。
 * 只挂载真正进入视口的卡，同屏最多三张，留出余量给卸载与挂载交叠的那一瞬。
 */
onMounted(() => {
  if (!root.value) {
    return
  }

  observer = new IntersectionObserver(
    (entries) => {
      active.value = entries.some(entry => entry.isIntersecting)
    },
    { rootMargin: '0px' }
  )
  observer.observe(root.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  clearTimeout(copiedTimer)
})
</script>

<template>
  <section
    ref="root"
    class="card"
  >
    <header>
      <h3>{{ props.title }}</h3>
      <code v-if="props.name">{{ props.name }}.vue</code>
    </header>

    <p
      v-if="props.description"
      class="desc"
    >
      {{ props.description }}
    </p>

    <div
      class="stage"
      :style="{ height: props.height }"
    >
      <slot v-if="active" />
      <p
        v-else
        class="idle"
      >
        滚动到此处后加载
      </p>
    </div>

    <details
      v-if="source"
      class="source"
    >
      <summary>
        查看源码
        <button
          type="button"
          @click.prevent="copy"
        >
          {{ copied ? '已复制' : '复制' }}
        </button>
      </summary>
      <pre><code>{{ source }}</code></pre>
    </details>
  </section>
</template>

<style scoped>
.card {
  margin-block: 28px;
}

header {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px;
}

h3 {
  margin: 0;
  font-size: 16px;
}

code {
  color: var(--pg-muted);
  font-size: 12px;
}

.desc {
  margin: 6px 0 10px;
  color: var(--pg-muted);
  font-size: 14px;
  line-height: 1.6;
}

.stage {
  position: relative;
  border: 1px solid var(--pg-border);
  border-radius: 8px;
  overflow: hidden;
}

.idle {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  margin: 0;
  color: var(--pg-muted);
  font-size: 13px;
}

.source {
  margin-top: 8px;
  border: 1px solid var(--pg-border);
  border-radius: 8px;
  font-size: 13px;
}

summary {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  color: var(--pg-muted);
  cursor: pointer;
  user-select: none;
}

summary button {
  margin-left: auto;
  padding: 2px 8px;
  border: 1px solid var(--pg-border);
  border-radius: 4px;
  background: none;
  color: inherit;
  font-size: 12px;
  cursor: pointer;
}

.source pre {
  margin: 0;
  padding: 12px;
  border-top: 1px solid var(--pg-border);
  overflow-x: auto;
  line-height: 1.6;
  tab-size: 2;
}
</style>
