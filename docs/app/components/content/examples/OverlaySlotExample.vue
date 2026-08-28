<script setup lang="ts">
defineProps<{
  open?: boolean
}>()

const votes = shallowRef(0)

const { data } = await useFetch('/api/data.json')
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaOverlay node="11.0" :offset="[0, -20]" :visible="open">
      <div
        v-if="open"
        class="pointer-events-auto w-50 -translate-x-1/2 -translate-y-full rounded-lg border border-accented bg-default p-3 text-xs shadow-lg"
      >
        <strong>Valjean</strong>
        <p class="mt-1.5 mb-2 text-muted">
          覆盖层不规定内容，表单、按钮、富文本都能放。
        </p>
        <div class="flex gap-1.5">
          <UButton size="xs" variant="soft" :label="`赞同 ${votes}`" @click="votes += 1" />
        </div>
      </div>
    </SigmaOverlay>
  </SigmaGraph>
</template>
