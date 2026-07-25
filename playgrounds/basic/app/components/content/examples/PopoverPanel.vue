<script setup lang="ts">
import { ref, watch } from 'vue'

// useSigmaSelection 与 SigmaPopover 都要在 SigmaGraph 子树内，
// 所以这一层是独立组件而不是写在示例外壳里
const { selected } = useSigmaSelection()

// 详情按需加载，不随图数据一起下发：图上只带渲染必需的字段
const details = ref<Record<string, string[]>>({})
const open = ref(true)

async function loadDetail(key: string) {
  if (details.value[key]) {
    return
  }
  await new Promise(resolve => setTimeout(resolve, 200))
  details.value = { ...details.value, [key]: [`${key} 第一条`, `${key} 第二条`, `${key} 第三条`] }
}

watch(selected, (key) => {
  if (key) {
    open.value = true
    loadDetail(key)
  }
})
</script>

<template>
  <div>
    <SigmaPopover v-model:open="open" :node="selected">
      <template #default="{ node, attributes, close }">
        <div class="detail">
          <header>
            <strong>{{ attributes.label ?? node }}</strong>
            <button
              type="button"
              @click="close"
            >
              ×
            </button>
          </header>
          <ul v-if="details[node]">
            <li
              v-for="line in details[node]"
              :key="line"
            >
              {{ line }}
            </li>
          </ul>
          <p v-else>
            加载中…
          </p>
        </div>
      </template>
    </SigmaPopover>

    <div class="demo-panel" data-at="top-left">
      <span class="demo-tag">点击节点打开常驻浮层，详情在打开后才请求</span>
    </div>
  </div>
</template>

<style scoped>
.detail {
  min-width: 160px;
}

.detail header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.detail header button {
  border: 0;
  background: none;
  color: inherit;
  cursor: pointer;
  font-size: 15px;
}

.detail ul {
  margin: 6px 0 0;
  padding-left: 18px;
}

.detail p {
  margin: 6px 0 0;
  opacity: 0.6;
}
</style>
