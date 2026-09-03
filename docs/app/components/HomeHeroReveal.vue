<script setup lang="ts">
/** 归位后到聚焦开始之间的停顿 */
const SETTLE_DELAY = 600
/** 聚焦点停留时长 */
const FOCUS_HOLD = 1600
/** 聚焦时的相机比例，越小离得越近 */
const FOCUS_RATIO = 0.7
/** 相机推向焦点的时长 */
const FOCUS_DURATION = 1100

/**
 * 淡出色随明暗切换。alpha 压得比基础边色更低，被淡出的元素才真的退到后面；
 * 用不透明灰会让本来半透明的边在浅色底上反而更显眼
 */
const DIM_COLORS = {
  light: 'rgba(148, 163, 184, 0.08)',
  dark: 'rgba(148, 163, 184, 0.07)'
}

const props = defineProps<{
  /** 社区 key 到可读名，浮层副标题用 */
  clusterLabels: Record<string, string>
}>()

const colorMode = useColorMode()
const reducedMotion = usePreferredReducedMotion()

const { styleOptions, refresh } = useSigma()
const { graph, version } = useSigmaGraph()
const { select } = useSigmaSelection({ dimColor: DIM_COLORS.light })
const { fitTo, gotoNode } = useSigmaCamera()

// dimColor 是运行时 ref 而非构造期常量，改它只触发 refresh，不会重建 sigma 实例；
// 同一次 refresh 也让 HomeHeroDemo 里读明暗的 labelColor 闭包重新求值
watch(() => colorMode.value, (mode) => {
  styleOptions.dimColor.value = mode === 'dark' ? DIM_COLORS.dark : DIM_COLORS.light
  refresh({ skipIndexation: true })
}, { immediate: true })

/** 全图 score 最高的节点，作为入场揭示的落点 */
const heroKey = computed(() => {
  void version.value

  let best: string | undefined
  let bestScore = Number.NEGATIVE_INFINITY

  graph.value.forEachNode((key, attributes) => {
    const score = attributes.score
    if (typeof score === 'number' && score > bestScore) {
      bestScore = score
      best = key
    }
  })

  return best
})

const caption = computed(() => {
  const key = heroKey.value
  if (!key || !graph.value.hasNode(key)) {
    return null
  }

  const attributes = graph.value.getNodeAttributes(key)
  return {
    label: String(attributes.label ?? key),
    cluster: props.clusterLabels[String(attributes.cluster)] ?? ''
  }
})

const isRevealing = shallowRef(false)

let cancelled = false
let timer: ReturnType<typeof setTimeout> | undefined

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    timer = setTimeout(resolve, ms)
  })
}

/** 用户一交互就永久停掉编排，之后的高亮全部交给悬浮与点击 */
function cancel() {
  if (cancelled) {
    return
  }
  cancelled = true
  clearTimeout(timer)
  isRevealing.value = false
}

// 只认按下与滚轮这类明确的操作：相机移动时节点会从静止的光标下经过，enterNode 会误判成交互
useSigmaEvents({
  downStage: cancel,
  downNode: cancel,
  wheelStage: cancel,
  wheelNode: cancel
})

async function reveal() {
  await fitTo(undefined, { animate: false })

  const key = heroKey.value
  if (!key || cancelled || reducedMotion.value === 'reduce') {
    return
  }

  await wait(SETTLE_DELAY)
  if (cancelled) {
    return
  }

  isRevealing.value = true
  select(key)
  await gotoNode(key, { ratio: FOCUS_RATIO, duration: FOCUS_DURATION })
  if (cancelled) {
    return
  }

  await wait(FOCUS_HOLD)
  if (cancelled) {
    return
  }

  isRevealing.value = false
  select(null)
  await fitTo(undefined, { animate: true })
}

onMounted(reveal)

onScopeDispose(() => {
  cancelled = true
  clearTimeout(timer)
})
</script>

<template>
  <SigmaOverlay
    v-if="caption"
    :node="heroKey"
    :offset="[0, -26]"
  >
    <div
      class="-translate-x-1/2 -translate-y-full rounded-lg bg-default/85 px-2.5 py-1.5 shadow-lg ring ring-default backdrop-blur-md transition-opacity duration-500"
      :class="isRevealing ? 'opacity-100' : 'opacity-0'"
    >
      <p class="text-sm/5 font-medium text-highlighted">
        {{ caption.label }}
      </p>
      <p
        v-if="caption.cluster"
        class="text-xs/4 text-muted"
      >
        {{ caption.cluster }}
      </p>
    </div>
  </SigmaOverlay>
</template>
