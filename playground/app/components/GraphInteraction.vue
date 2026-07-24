<script setup lang="ts">
import type { SerializedGraph } from 'graphology-types'

/** 模拟服务端的邻域接口：返回新节点及其与中心节点的关系 */
async function loadNeighbors(key: string): Promise<SerializedGraph> {
  await new Promise(resolve => setTimeout(resolve, 200))
  const suffix = Math.random().toString(36).slice(2, 5)
  const added = `${key}-${suffix}`

  return {
    attributes: {},
    options: { type: 'mixed', multi: false, allowSelfLoops: true },
    nodes: [{ key: added, attributes: { label: `扩展 ${added}`, x: Math.random() * 20 - 10, y: Math.random() * 20 - 10, size: 8, color: '#94a3b8' } }],
    edges: [{ source: key, target: added, attributes: { label: '扩展' } }]
  }
}

/** 模拟详情接口：节点的详细条目按需加载，不随图数据一起下发 */
const details = ref<Record<string, string[]>>({})

async function loadDetail(key: string) {
  if (details.value[key]) {
    return
  }
  await new Promise(resolve => setTimeout(resolve, 150))
  details.value = { ...details.value, [key]: [`${key} 第一条`, `${key} 第二条`, `${key} 第三条`] }
}

const { order, size, version } = useSigmaGraph()
const { selected, hovered, focused, highlighted, clear } = useSigmaSelection()
const { expand, expanded, isExpanding, neighborhood } = useSigmaNeighborhood()

watch(selected, (key) => {
  if (key) {
    loadDetail(key)
  }
})
</script>

<template>
  <div>
    <div class="hud">
      <span>节点 {{ order }} · 边 {{ size }} · v{{ version }}</span>
      <span>悬浮 {{ hovered ?? '—' }} · 选中 {{ selected ?? '—' }}</span>
      <span v-if="focused">二度邻域 {{ neighborhood(focused, 2).size }} 个 · 高亮 {{ highlighted.size }} 个</span>
    </div>

    <SigmaTooltip>
      <template #default="{ id, attributes }">
        <strong>{{ attributes.label ?? id }}</strong>
      </template>
    </SigmaTooltip>

    <SigmaPopover :node="selected">
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
          <footer>
            <button
              type="button"
              :disabled="isExpanding"
              @click="expand(node, loadNeighbors)"
            >
              {{ expanded.has(node) ? '再展开一层' : '展开邻域' }}
            </button>
            <button
              type="button"
              @click="clear"
            >
              取消选中
            </button>
          </footer>
        </div>
      </template>
    </SigmaPopover>

    <SigmaContextMenu>
      <template #default="{ id, close }">
        <div class="menu">
          <button
            type="button"
            @click="expand(id!, loadNeighbors); close()"
          >
            展开 {{ id }} 的邻域
          </button>
        </div>
      </template>
    </SigmaContextMenu>
  </div>
</template>

<style scoped>
.hud {
  position: absolute;
  inset: 8px 8px auto 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 6px 10px;
  border-radius: 6px;
  background: rgb(255 255 255 / 88%);
  font-size: 13px;
  pointer-events: none;
}

.detail {
  min-width: 180px;
}

.detail header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.detail ul {
  margin: 6px 0;
  padding-left: 18px;
}

.detail footer {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}

button {
  cursor: pointer;
}
</style>
