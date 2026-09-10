<script setup lang="ts">
const groups = useNavigation()
const colorMode = useColorMode()
</script>

<template>
  <div class="bg-default text-default flex min-h-screen">
    <aside class="border-default sticky top-0 flex h-screen w-56 shrink-0 flex-col gap-4 border-r p-4">
      <NuxtLink to="/" class="flex items-center gap-2 font-semibold">
        <UIcon name="i-lucide-share-2" />
        @movk/sigma
      </NuxtLink>

      <nav class="flex flex-col gap-4">
        <div v-for="group in groups" :key="group.title" class="flex flex-col gap-1">
          <span class="text-muted px-2 text-xs font-medium">{{ group.title }}</span>
          <UButton
            v-for="link in group.links"
            :key="link.to"
            :to="link.to"
            :icon="link.icon"
            :label="link.label"
            :variant="$route.path === link.to ? 'soft' : 'ghost'"
            color="neutral"
            size="sm"
            class="justify-start"
          />
        </div>
      </nav>

      <UButton
        class="mt-auto justify-start"
        :icon="colorMode.value === 'dark' ? 'i-lucide-moon' : 'i-lucide-sun'"
        :label="colorMode.value === 'dark' ? '深色' : '浅色'"
        variant="ghost"
        color="neutral"
        size="sm"
        @click="colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'"
      />
    </aside>

    <main class="min-w-0 flex-1 px-6 py-8">
      <div class="mx-auto flex max-w-4xl flex-col gap-8">
        <slot />
      </div>
    </main>
  </div>
</template>
