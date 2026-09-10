<script setup lang="ts">
const props = withDefaults(defineProps<{
  /** 示例标题，通常就是被验证的 API 名 */
  title: string
  /** 一句话说明这个示例验证什么 */
  description?: string
  /** 示例组件名，用于定位源码 */
  name?: string
  /**
   * 舞台高度
   * @defaultValue '500px'
   */
  height?: string
}>(), {
  height: '500px'
})

const root = useTemplateRef<HTMLElement>('root')
const active = shallowRef(false)
const open = shallowRef(false)
const copied = shallowRef(false)

let observer: IntersectionObserver | undefined
let copiedTimer: ReturnType<typeof setTimeout> | undefined

// eager 是为了让折叠展开时无需等待网络；这里不做语法高亮，高亮版看文档站
const sources = import.meta.glob<string>('../components/examples/*.vue', {
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
 * rootMargin 必须是 0：一张卡不一定只有一个实例，放宽后同屏实例数会翻倍而超限。
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
  <section ref="root" class="scroll-mt-6">
    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <template #header>
        <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 class="font-semibold">
            {{ title }}
          </h3>
          <code v-if="name" class="text-muted text-xs">{{ name }}.vue</code>
        </div>
        <p v-if="description" class="text-muted mt-1 text-sm">
          {{ description }}
        </p>
      </template>

      <div class="relative" :style="{ height }">
        <slot v-if="active" />
        <p v-else class="text-muted flex h-full items-center justify-center text-sm">
          滚动到此处后加载
        </p>
      </div>

      <template v-if="source" #footer>
        <div class="flex items-center gap-2">
          <UButton
            size="xs"
            variant="ghost"
            color="neutral"
            :icon="open ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
            label="查看源码"
            @click="open = !open"
          />
          <UButton
            v-if="open"
            size="xs"
            variant="ghost"
            color="neutral"
            :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
            :label="copied ? '已复制' : '复制'"
            @click="copy"
          />
        </div>

        <pre v-if="open" class="border-default mt-3 overflow-x-auto border-t pt-3 text-xs leading-relaxed"><code>{{ source }}</code></pre>
      </template>
    </UCard>
  </section>
</template>
