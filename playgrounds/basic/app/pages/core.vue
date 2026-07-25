<template>
  <div>
    <h1>基础 composables</h1>
    <p class="lead">
      实例访问与响应式桥接。<code>useSigma()</code> 是 inject，必须在
      <code>SigmaGraph</code> 子树内调用，所以示例都由「渲染图的外壳 + 消费上下文的面板」两个文件组成；
      树外访问改用 <code>useSigmaById(id)</code>。
    </p>

    <ExampleCard
      title="useSigma"
      name="UseSigmaExample"
      description="返回原生 Sigma 与 Graph 实例本身，不做代理。whenReady() 等待实例创建完成。"
    >
      <UseSigmaExample />
    </ExampleCard>

    <ExampleCard
      title="useSigmaById / useSigmaIds"
      name="UseSigmaByIdExample"
      description="按 id 从全局注册表取实例，供组件树之外或跨路由访问。返回计算属性，实例就绪后自动填上。"
      height="420px"
    >
      <UseSigmaByIdExample />
    </ExampleCard>

    <ExampleCard
      title="useSigmaGraph"
      name="UseSigmaGraphExample"
      description="把 graphology 的可变对象桥接成 version / order / size 与 onGraphUpdate 回调。整个库的地基。"
    >
      <UseSigmaGraphExample />
    </ExampleCard>

    <ExampleCard
      title="useSigmaEvents"
      name="UseSigmaEventsExample"
      description="声明式绑定任意事件名，卸载自动解绑。emits 未覆盖的 afterRender 之类只能走这条。"
    >
      <UseSigmaEventsExample />
    </ExampleCard>

    <ExampleCard
      title="useSigmaSettings"
      name="UseSigmaSettingsExample"
      description="响应式 settings，源变化即 setSettings。"
    >
      <UseSigmaSettingsExample />
    </ExampleCard>
  </div>
</template>
