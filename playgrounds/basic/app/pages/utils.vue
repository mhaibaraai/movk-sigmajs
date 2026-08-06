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
      title="chainReducers"
      name="ChainReducersExample"
      description="用户自带的 nodeReducer 作为链的基座先执行，库注册的在其后叠加。"
    >
      <ChainReducersExample />
    </ExampleCard>

    <ExampleCard
      title="sampleGraph"
      name="SampleGraphExample"
      description="按度数取 Top-N 得到概览子图，图级 attributes 与 options 原样保留。"
    >
      <SampleGraphExample />
    </ExampleCard>
  </div>
</template>
