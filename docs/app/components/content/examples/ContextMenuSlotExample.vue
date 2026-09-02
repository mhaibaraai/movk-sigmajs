<script setup lang="ts">
const last = shallowRef('')

const { data } = await useFetch('/api/small.json')

function run(action: string, close: () => void) {
  last.value = action
  close()
}
</script>

<template>
  <SigmaGraph :data="data" :settings="{ enableEdgeEvents: true }">
    <SigmaContextMenu :target="['node', 'edge', 'stage']">
      <template #default="{ id, type, attributes, close }">
        <div class="flex min-w-35 flex-col gap-1.5">
          <span class="text-muted text-xs">{{ type }} {{ id ?? '（空白处）' }}</span>
          <UButton
            v-if="type === 'stage'"
            size="xs"
            variant="ghost"
            color="neutral"
            label="在此处新建节点"
            @click="run('在此处新建节点', close)"
          />
          <UButton
            v-else
            size="xs"
            variant="ghost"
            color="neutral"
            :label="`打开「${attributes.label ?? id}」`"
            @click="run(`打开 ${attributes.label ?? id}`, close)"
          />
        </div>
      </template>
    </SigmaContextMenu>
  </SigmaGraph>
</template>
