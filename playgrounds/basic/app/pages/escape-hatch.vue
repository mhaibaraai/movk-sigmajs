<template>
  <div>
    <h1>纯原生逃生舱</h1>
    <p class="lead">
      封装库最大的失败模式是成为天花板：库没覆盖的原生能力，用户就用不了。
      本库的设计前提是「封装是加法，不是围墙」，这一页用来证明它可以被完全绕过。
    </p>

    <ul class="claims">
      <li><strong>实例直达</strong>：<code>useSigma()</code> 与 <code>ready</code> 拿到的是原生 <code>Sigma</code> 与 <code>Graph</code>，不是 Proxy 也不是包装对象</li>
      <li><strong>settings 全透传</strong>：不逐字段枚举、不过滤未知键，sigma 新增的配置项立即可用</li>
      <li><strong>事件三通道</strong>：组件 emits、<code>useSigmaEvents()</code>、<code>sigma.on()</code> 并存</li>
      <li><strong>数据可完全接管</strong>：传 <code>graph</code> 后库不碰数据，graphology 生态的任何操作方式都可用</li>
      <li><strong>不重导出</strong>：sigma 与 graphology 的值和类型一律从原包直接 import，避免版本错配</li>
      <li><strong>peer 依赖</strong>：不夹带第二份实例，<code>instanceof</code> 不会失败</li>
    </ul>

    <ExampleCard
      title="只借 SigmaGraph 建实例"
      name="EscapeHatchExample"
      description="不使用本库的任何 composable、控件与工具函数，事件、配置、数据、相机全走原生 API。"
    >
      <EscapeHatchExample />
    </ExampleCard>
  </div>
</template>

<style scoped>
.claims {
  margin: 0 0 8px;
  padding-left: 20px;
  color: var(--pg-muted);
  font-size: 14px;
  line-height: 1.9;
}
</style>
