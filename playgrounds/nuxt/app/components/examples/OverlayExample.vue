<script setup lang="ts">
const { data } = await useFetch('/api/small.json')

const votes = shallowRef(0)
const open = shallowRef(true)
</script>

<template>
  <SigmaGraph :data="data">
    <SigmaOverlay node="a" :offset="[0, -24]">
      <UBadge color="neutral" variant="solid" class="-translate-x-1/2 -translate-y-full whitespace-nowrap">
        锚定在节点 A
      </UBadge>
    </SigmaOverlay>

    <SigmaOverlay node="d" :offset="[0, -20]" :visible="open">
      <div
        v-if="open"
        class="border-accented bg-default pointer-events-auto w-50 -translate-x-1/2 -translate-y-full rounded-lg border p-3 text-xs shadow-lg"
      >
        <strong>覆盖层内容不受限制</strong>
        <p class="text-muted mt-1.5 mb-2">
          表单、按钮、富文本都能放，位置由图坐标驱动。
        </p>
        <UButton size="xs" variant="soft" :label="`赞同 ${votes}`" @click="votes += 1" />
      </div>
    </SigmaOverlay>

    <SigmaControls>
      <UButton size="xs" color="neutral" :label="open ? '隐藏卡片' : '显示卡片'" @click="open = !open" />
    </SigmaControls>
  </SigmaGraph>
</template>
