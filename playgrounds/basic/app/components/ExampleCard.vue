<script setup lang="ts">
import { onBeforeUnmount, onMounted, shallowRef } from 'vue'

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

/**
 * 进入视口才挂载示例，离开视口后卸载。
 *
 * 这不是性能优化，是硬约束：浏览器的 WebGL 上下文上限多在 16 个，而每个 Sigma
 * 实例要占 3 个（sigma-edges / sigma-nodes / sigma-hoverNodes 三张画布走 WebGL，
 * 另外四张是 2D）。超出后最早的上下文被强制丢弃，画布直接变空白。
 *
 * rootMargin 取 20% 时同屏最多四个实例、12 个上下文，留出余量给卸载与挂载交叠的那一瞬。
 */
onMounted(() => {
  if (!root.value) {
    return
  }

  observer = new IntersectionObserver(
    (entries) => {
      active.value = entries.some(entry => entry.isIntersecting)
    },
    { rootMargin: '20% 0px' }
  )
  observer.observe(root.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
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
</style>
