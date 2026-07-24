<script setup lang="ts">
import { onBeforeUnmount, shallowRef } from 'vue'

const dark = shallowRef(false)
const accent = shallowRef('#3b82f6')

// 换肤只需覆盖 primitive 变量，semantic 层按用途引用它们，不必逐条改
const palette = ['#3b82f6', '#f43f5e', '#22c55e', '#a855f7']

function applyAccent(color: string) {
  accent.value = color
  document.documentElement.style.setProperty('--sigma-color-accent', color)
}

// 深色的第一条通道：祖先的 .dark 类。Nuxt UI / Tailwind 手动切深色走的就是这条
function toggleDark(value: boolean) {
  dark.value = value
  document.documentElement.classList.toggle('dark', value)
}

onBeforeUnmount(() => {
  document.documentElement.style.removeProperty('--sigma-color-accent')
  document.documentElement.classList.remove('dark')
})
</script>

<template>
  <div>
    <h1>内置控件</h1>
    <p class="lead">
      零第三方依赖，只提供行为与无障碍结构，外观经插槽与 CSS 变量全接管。
      选择器一律包 <code>:where()</code> 把优先级降到 0，使用方无需 <code>!important</code>。
    </p>

    <div class="theming">
      <div class="demo-row">
        <span class="demo-label">主色</span>
        <button
          v-for="color in palette"
          :key="color"
          type="button"
          class="swatch"
          :style="{ background: color }"
          :aria-pressed="accent === color"
          @click="applyAccent(color)"
        />
      </div>
      <div class="demo-row">
        <span class="demo-label">配色</span>
        <button type="button" :aria-pressed="!dark" @click="toggleDark(false)">
          跟随系统
        </button>
        <button type="button" :aria-pressed="dark" @click="toggleDark(true)">
          强制深色
        </button>
        <span class="demo-tag">只监听 prefers-color-scheme 不够，应用手动切深色时走的是 html.dark 这条</span>
      </div>
    </div>

    <ExampleCard
      title="SigmaControls 停靠与方向"
      name="ControlsPositionExample"
      description="position 控制四角停靠，direction 控制排布方向，信息落到 data-position / data-direction 上由 CSS 消费。"
    >
      <ControlsPositionExample />
    </ExampleCard>

    <ExampleCard
      title="SigmaZoomControl"
      name="ZoomControlExample"
      description="放大 / 缩小 / 复位，三个图标各有具名插槽。"
    >
      <ZoomControlExample />
    </ExampleCard>

    <ExampleCard
      title="SigmaFullscreenControl"
      name="FullscreenControlExample"
      description="对 .sigma-root 取全屏目标，覆盖层与其他控件一起进入。"
    >
      <FullscreenControlExample />
    </ExampleCard>

    <ExampleCard
      title="SigmaSearchControl"
      name="SearchControlExample"
      description="节点检索输入与结果列表，命中片段自带高亮，选中后相机聚焦。"
    >
      <SearchControlExample />
    </ExampleCard>

    <ExampleCard
      title="SigmaLegend"
      name="LegendExample"
      description="按分类字段聚合，点击切换显隐。field 必须传业务字段，sigma 里的 type 是渲染程序名。"
    >
      <LegendExample />
    </ExampleCard>

    <ExampleCard
      title="SigmaMiniMap"
      name="MiniMapExample"
      description="缩略图与视口框，全程使用 framed 坐标。"
    >
      <MiniMapExample />
    </ExampleCard>

    <ExampleCard
      title="单实例强制深色"
      name="ControlsSchemeExample"
      description="在 SigmaGraph 上写 data-sigma-scheme=&quot;dark&quot;，只让这一张图走深色，不影响页面其余部分。"
    >
      <ControlsSchemeExample />
    </ExampleCard>
  </div>
</template>

<style scoped>
.theming {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  border: 1px solid var(--pg-border);
  border-radius: 8px;
  background: var(--pg-subtle);
  font-size: 13px;
}

.swatch {
  width: 22px;
  height: 22px;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 50%;
  cursor: pointer;
}

.swatch[aria-pressed="true"] {
  border-color: var(--pg-fg);
}

.theming button:not(.swatch) {
  padding: 3px 8px;
  border: 1px solid var(--pg-border);
  border-radius: 4px;
  background: var(--pg-bg);
  color: inherit;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
}

.theming button[aria-pressed="true"]:not(.swatch) {
  border-color: var(--pg-accent);
  color: var(--pg-accent);
}
</style>
