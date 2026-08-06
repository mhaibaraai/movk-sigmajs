<script setup lang="ts">
const links = [
  { to: '/', label: '知识图谱', icon: 'i-lucide-network' },
  { to: '/themed', label: '插槽接管外观', icon: 'i-lucide-palette' }
]

const colorMode = useColorMode()
</script>

<template>
  <div class="min-h-screen flex flex-col bg-default text-default">
    <header class="flex items-center gap-4 border-b border-default px-6 py-3">
      <span class="font-semibold">@movk/sigma × @movk/nuxt</span>

      <nav class="flex gap-1">
        <UButton
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          :icon="link.icon"
          :variant="$route.path === link.to ? 'soft' : 'ghost'"
          color="neutral"
          size="sm"
        >
          {{ link.label }}
        </UButton>
      </nav>

      <UButton
        class="ml-auto"
        :icon="colorMode.value === 'dark' ? 'i-lucide-moon' : 'i-lucide-sun'"
        variant="ghost"
        color="neutral"
        size="sm"
        aria-label="切换配色"
        @click="colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'"
      />
    </header>

    <main class="flex-1 min-h-0">
      <slot />
    </main>
  </div>
</template>
