<template>
  <div>
    <h1>SigmaGraph</h1>
    <p class="lead">
      根组件。客户端创建 Sigma 实例与 graphology 图，下发上下文并登记到全局注册表。
      数据有 <code>data</code> 与 <code>graph</code> 两条互斥通道，配置整体透传不做白名单。
    </p>

    <ExampleCard
      title="data 通道"
      name="GraphBasicExample"
      description="传 SerializedGraph，库负责 applyGraphDiff 增量同步。"
    >
      <GraphBasicExample />
    </ExampleCard>

    <ExampleCard
      title="graph 通道"
      name="GraphExternalExample"
      description="传外部 graphology 实例，库完全不碰数据，只负责渲染与生命周期。"
    >
      <GraphExternalExample />
    </ExampleCard>

    <ExampleCard
      title="settings 全透传"
      name="GraphSettingsExample"
      description="传入一个库不认识的配置键，从 sigma.getSettings() 原样读回。"
      height="260px"
    >
      <GraphSettingsExample />
    </ExampleCard>

    <ExampleCard
      title="渲染原语"
      name="GraphPrimitivesExample"
      description="primitives 声明可用的形状与路径，styles 决定谁用哪个。平行边由 parallelPath 自动分散。"
    >
      <GraphPrimitivesExample />
    </ExampleCard>

    <ExampleCard
      title="事件"
      name="GraphEventsExample"
      description="emits 覆盖 sigma 事件全集，node / edge / stage 三组直接可监听。"
    >
      <GraphEventsExample />
    </ExampleCard>

    <ExampleCard
      title="多实例并存"
      name="GraphMultiInstanceExample"
      description="两个独立实例各自带 id，登记进全局注册表后可在组件树外取用。"
    >
      <GraphMultiInstanceExample />
    </ExampleCard>
  </div>
</template>
