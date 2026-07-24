<script setup lang="ts">
const links = [
  { to: '/', label: '总览' },
  { to: '/graph', label: '根组件' },
  { to: '/overlays', label: '覆盖层' },
  { to: '/controls', label: '控件' },
  { to: '/core', label: '基础' },
  { to: '/interaction', label: '交互' },
  { to: '/analysis', label: '布局与分析' },
  { to: '/utils', label: '工具函数' },
  { to: '/scale', label: '规模' },
  { to: '/escape-hatch', label: '逃生舱' }
]
</script>

<template>
  <div class="shell">
    <header class="topbar">
      <strong class="brand">@movk/sigma</strong>
      <nav>
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>
    </header>

    <main class="page">
      <slot />
    </main>
  </div>
</template>

<style>
:root {
  color-scheme: light dark;
  --pg-bg: #fff;
  --pg-fg: #1f2328;
  --pg-muted: #57606a;
  --pg-border: #d0d7de;
  --pg-subtle: #f6f8fa;
  --pg-accent: #3b82f6;
}

@media (prefers-color-scheme: dark) {
  :root {
    --pg-bg: #14181d;
    --pg-fg: #e6edf3;
    --pg-muted: #8b949e;
    --pg-border: #2c333b;
    --pg-subtle: #1b2027;
  }
}

body {
  margin: 0;
  background: var(--pg-bg);
  color: var(--pg-fg);
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
}

a {
  color: inherit;
}
</style>

<style scoped>
.topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 16px;
  padding: 10px 24px;
  border-bottom: 1px solid var(--pg-border);
  background: var(--pg-bg);
}

.brand {
  font-size: 15px;
}

nav {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

nav a {
  padding: 4px 10px;
  border-radius: 6px;
  color: var(--pg-muted);
  font-size: 14px;
  text-decoration: none;
}

nav a:hover {
  background: var(--pg-subtle);
}

nav a.router-link-exact-active {
  background: var(--pg-subtle);
  color: var(--pg-accent);
}

.page {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px;
}
</style>
