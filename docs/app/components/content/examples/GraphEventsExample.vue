<script setup lang="ts">
const log = shallowRef<string[]>([])

function push(line: string) {
  log.value = [line, ...log.value].slice(0, 5)
}

const { data } = await useFetch('/api/data.json')
</script>

<template>
  <SigmaGraph
    :data="data"
    :settings="{ renderEdgeLabels: true, enableEdgeEvents: true }"
    @click-node="({ node }) => push(`clickNode ${node}`)"
    @enter-node="({ node }) => push(`enterNode ${node}`)"
    @click-edge="({ edge }) => push(`clickEdge ${edge}`)"
    @click-stage="() => push('clickStage')"
    @ready="() => push('ready')"
  >
    <SigmaControls>
      <div class="bg-accented p-2">
        <span class="demo-tag">最近 5 条事件</span>
        <ul class="demo-log">
          <li v-for="(line, index) in log" :key="`${line}-${index}`">
            {{ line }}
          </li>
        </ul>
      </div>
    </SigmaControls>
  </SigmaGraph>
</template>
