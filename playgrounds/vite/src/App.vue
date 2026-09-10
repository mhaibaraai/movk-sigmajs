<script setup lang="ts">
/**
 * 占位骨架。
 *
 * `@movk/sigma` 目前是 Nuxt 模块：组件注册、自动导入与 `#sigma` alias 都依赖
 * `@nuxt/kit`，在纯 Vite 环境下无法直接消费。这个 playground 先保证一个可运行的
 * Vue 3 + Vite 空壳，等模块改造出框架无关的入口后再在此接入。
 */
</script>

<template>
  <main>
    <h1>@movk/sigma · Vite Playground</h1>
    <p>
      模块尚未提供框架无关入口，此处暂不引入 <code>@movk/sigma</code>。
      改造完成后，这里将以纯 Vite + Vue 3 的方式渲染 <code>SigmaGraph</code>。
    </p>
  </main>
</template>

<style>
body {
  margin: 0;
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
  line-height: 1.6;
}

main {
  max-width: 640px;
  margin: 0 auto;
  padding: 48px 24px;
}

code {
  padding: 1px 5px;
  border-radius: 4px;
  background: rgb(0 0 0 / 6%);
  font-size: 0.9em;
}
</style>
