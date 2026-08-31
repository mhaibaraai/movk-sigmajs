<script setup lang="ts">
const { selected } = useSigmaSelection()

const details = ref<Record<string, string[]>>({})
const open = ref(true)

async function loadDetail(key: string) {
  if (details.value[key]) {
    return
  }
  await new Promise(resolve => setTimeout(resolve, 200))
  details.value = { ...details.value, [key]: ['出场章节 12', '关联人物 8', '社区 3'] }
}

watch(selected, (key) => {
  if (key) {
    open.value = true
    loadDetail(key)
  }
})
</script>

<template>
  <SigmaPopover v-model:open="open" :node="selected">
    <template #default="{ node, attributes, close }">
      <div class="min-w-40">
        <header class="flex items-center justify-between gap-3">
          <strong>{{ attributes.label ?? node }}</strong>
          <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-x" @click="close" />
        </header>
        <ul v-if="details[node]" class="mt-1.5 list-disc pl-4.5">
          <li v-for="line in details[node]" :key="line">
            {{ line }}
          </li>
        </ul>
        <p v-else class="mt-1.5 text-muted">
          加载中…
        </p>
      </div>
    </template>
  </SigmaPopover>
</template>
