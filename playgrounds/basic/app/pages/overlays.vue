<template>
  <div>
    <h1>覆盖层</h1>
    <p class="lead">
      sigma 没有 Marker / Popup 概念，覆盖层要自己算位置。
      <code>SigmaOverlay</code> 是通用锚定基座，订阅 <code>afterRender</code> 同步位置，
      Tooltip / Popover / ContextMenu 全部建在它之上。
    </p>

    <ExampleCard
      title="锚定到节点"
      name="OverlayNodeExample"
      description="节点坐标已被 sigma 归一化，内部走 framedGraphToViewport。"
    >
      <OverlayNodeExample />
    </ExampleCard>

    <ExampleCard
      title="两套坐标不能混用"
      name="OverlayPositionExample"
      description="锚 position 走 graphToViewport，锚 node 走 framed 换算。两个标记指向同一个点，错开即说明用错了函数。"
    >
      <OverlayPositionExample />
    </ExampleCard>

    <ExampleCard
      title="SigmaTooltip"
      name="TooltipExample"
      description="悬浮或点击触发，插槽以 { type, id, attributes } 暴露命中项。"
    >
      <TooltipExample />
    </ExampleCard>

    <ExampleCard
      title="SigmaPopover"
      name="PopoverExample"
      description="锚定到指定节点的常驻浮层，「点击节点看详情」的落点。"
    >
      <PopoverExample />
    </ExampleCard>

    <ExampleCard
      title="SigmaContextMenu"
      name="ContextMenuExample"
      description="右键菜单，同时拦住浏览器原生菜单。空白处命中时 id 为 null。"
    >
      <ContextMenuExample />
    </ExampleCard>
  </div>
</template>
