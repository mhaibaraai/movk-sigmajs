<script setup lang="ts">
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
    title: '检索',
    name: 'ThemedSearchExample',
    description: 'option 插槽拿到的 segments 是切好的命中片段，高亮逻辑不必重写。'
  }
]
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-8 p-6">
    <div class="space-y-2">
      <h1 class="text-xl font-semibold">
        插槽接管外观
      </h1>
      <p class="text-sm text-muted">
        内置控件零第三方依赖，自带极简 CSS 与 CSS 变量。这一页把外观全部换成 Nuxt UI，
        用来验证「封装只提供行为与无障碍结构，外观可全接管」这条设计前提。
      </p>
      <p class="text-sm text-muted">
        右上角的配色切换会往 <code>&lt;html&gt;</code> 上写 <code>.dark</code>，
        未被接管的部分（如小地图）应当跟着变——这是内置样式深色模式的两条通道之一，
        只监听 <code>prefers-color-scheme</code> 是不够的。
      </p>
    </div>

    <UCard v-for="example in examples" :key="example.name" :ui="{ body: 'p-0 sm:p-0' }">
      <template #header>
        <div class="space-y-1">
          <div class="flex items-baseline gap-2">
            <h2 class="font-medium">
              {{ example.title }}
            </h2>
            <code class="text-xs text-muted">{{ example.name }}.vue</code>
          </div>
          <p class="text-sm text-muted">
            {{ example.description }}
          </p>
        </div>
      </template>

      <div class="h-80">
        <component :is="example.name" />
      </div>
    </UCard>
  </div>
</template>
