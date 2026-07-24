<template>
  <div>
    <h1>交互原语</h1>
    <p class="lead">
      选中、邻域、拖拽、检索、过滤与归约。它们共用一条按 <code>order</code> 排序的 reducer 链，
      互不覆盖；用户经 <code>settings</code> 自带的 reducer 始终位于链首。
    </p>

    <ExampleCard
      title="useSigmaSelection"
      name="UseSigmaSelectionExample"
      description="hover / selected / focused 状态机，内建高亮与淡出。核心交互原语。"
    >
      <UseSigmaSelectionExample />
    </ExampleCard>

    <ExampleCard
      title="useSigmaNeighborhood 的 BFS"
      name="UseSigmaNeighborhoodExample"
      description="N 度邻域计算，切换深度看可达范围的变化。"
    >
      <UseSigmaNeighborhoodExample />
    </ExampleCard>

    <ExampleCard
      title="useSigmaNeighborhood 的按需扩展"
      name="UseSigmaNeighborhoodExpandExample"
      description="expand 拉取远端邻域并增量合入，已有节点坐标不变。「点击展开」的落点。"
    >
      <UseSigmaNeighborhoodExpandExample />
    </ExampleCard>

    <ExampleCard
      title="useSigmaDrag"
      name="UseSigmaDragExample"
      description="拖拽移动节点。与迭代型布局互斥，示例里可开关布局对照。"
    >
      <UseSigmaDragExample />
    </ExampleCard>

    <ExampleCard
      title="useSigmaSearch"
      name="UseSigmaSearchExample"
      description="按 label 与任意属性模糊检索节点与边，选中后相机聚焦。"
    >
      <UseSigmaSearchExample />
    </ExampleCard>

    <ExampleCard
      title="useSigmaFilter"
      name="UseSigmaFilterExample"
      description="按分类、度数、边类型过滤，落到 reducer 的 hidden。不改动图数据本身。"
    >
      <UseSigmaFilterExample />
    </ExampleCard>

    <ExampleCard
      title="useSigmaReducer"
      name="UseSigmaReducerExample"
      description="自定义归约与内建的选中高亮、过滤按 order 共存。"
    >
      <UseSigmaReducerExample />
    </ExampleCard>

    <ExampleCard
      title="useSigmaCamera"
      name="UseSigmaCameraExample"
      description="缩放、复位、聚焦节点、容纳全图与坐标换算。fitTo 依赖可选 peer @sigma/utils。"
    >
      <UseSigmaCameraExample />
    </ExampleCard>
  </div>
</template>
