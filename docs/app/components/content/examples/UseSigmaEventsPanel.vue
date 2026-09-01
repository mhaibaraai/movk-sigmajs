<script setup lang="ts">
const log = shallowRef<string[]>([])
const frames = shallowRef(0)

function push(line: string) {
  log.value = [line, ...log.value].slice(0, 4)
}

useSigmaEvents({
  clickNode: ({ node }) => push(`clickNode ${node}`),
  doubleClickNode: ({ node }) => push(`doubleClickNode ${node}`),
  wheelStage: () => push('wheelStage'),
  resize: () => push('resize'),
  afterRender: () => {
    frames.value += 1
  }
})
</script>

<template>
  <SigmaControls>
    <div class="bg-accented p-2">
      <span class="text-muted text-xs">已渲染 {{ frames }} 帧</span>
      <ul class="list-none text-muted text-xs font-mono">
        <li v-for="(line, index) in log" :key="`${line}-${index}`">
          {{ line }}
        </li>
      </ul>
    </div>
  </SigmaControls>
</template>
