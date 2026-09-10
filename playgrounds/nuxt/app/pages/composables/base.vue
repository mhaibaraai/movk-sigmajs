<script setup lang="ts">
useHead({ title: '基础 Composables · @movk/sigma' })
</script>

<template>
  <div class="flex flex-col gap-8">
    <header>
      <h1 class="text-xl font-semibold">
        基础 Composables
      </h1>
      <p class="text-muted mt-1 text-sm">
        取实例、读图、订阅事件与改 settings。
      </p>
    </header>

    <ExampleCard
      title="useSigma()"
      name="UseSigmaExample"
      description="拿到原生 sigma 实例与 graphology 图，whenReady() 等待挂载完成。"
    >
      <UseSigmaExample />
    </ExampleCard>

    <ExampleCard
      title="useSigmaById() / useSigmaIds()"
      name="UseSigmaByIdExample"
      description="在 SigmaGraph 子树之外按 id 拿实例，注册表由 useSigmaIds 列出。"
    >
      <UseSigmaByIdExample />
    </ExampleCard>

    <ExampleCard
      title="useSigmaGraph()"
      name="UseSigmaGraphExample"
      description="order / size / version 随图变更刷新，onGraphUpdate 订阅结构变化。"
    >
      <UseSigmaGraphExample />
    </ExampleCard>

    <ExampleCard
      title="useSigmaEvents()"
      name="UseSigmaEventsExample"
      description="以对象形式订阅 sigma 事件，作用域销毁时自动解绑。"
    >
      <UseSigmaEventsExample />
    </ExampleCard>

    <ExampleCard
      title="useSigmaSettings()"
      name="UseSigmaSettingsExample"
      description="把响应式 settings 接进实例，改动即时生效。"
    >
      <UseSigmaSettingsExample />
    </ExampleCard>

    <ExampleCard
      title="useSigmaState()"
      name="UseSigmaStateExample"
      description="读写节点与图的状态位，配合 styles 的 whenState 驱动外观；支持自定义状态。"
    >
      <UseSigmaStateExample />
    </ExampleCard>
  </div>
</template>
