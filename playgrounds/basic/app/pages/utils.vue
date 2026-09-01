<template>
  <div>
    <h1>工具函数</h1>
    <p class="lead">
      图与 sigma 领域的逻辑，不属于 <code>@movk/core</code> 的范畴。
      通用能力（<code>debounce</code>、<code>deepMerge</code>、<code>mapRange</code> 等）一律先查 core，
      这里只放领域相关的。
    </p>

    <ExampleCard
      title="applyGraphDiff"
      name="ApplyGraphDiffExample"
      description="增量同步，保留已有节点坐标；prune 控制是否剪除新数据外的部分。"
    >
      <ApplyGraphDiffExample />
    </ExampleCard>

    <ExampleCard
      title="composeStyles"
      name="ComposeStylesExample"
      description="用户规则与 DEFAULT_STYLES 合成，缺了基础规则连 x / y 绑定都会丢。"
    >
      <ComposeStylesExample />
    </ExampleCard>
  </div>
</template>
