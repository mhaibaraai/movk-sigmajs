<script setup lang="ts">
const { graph } = useSigmaGraph()
const { degrees, maxDegree, centrality, communities } = useSigmaMetrics()
const { query, results, focus } = useSigmaSearch({ fields: ['label'] })
const { only, reset, hiddenCount } = useSigmaFilter()

const forceAtlas2 = useSigmaLayout('forceatlas2')
const circular = useSigmaLayout('circular')

const palette = ['#f43f5e', '#3b82f6', '#22c55e', '#a855f7', '#f59e0b', '#14b8a6']
const communityCount = ref(0)
const topCentral = ref('')

/** 社区着色直接改图属性，与走 reducer 的过滤、高亮互不干扰 */
async function colorByCommunity() {
  const result = await communities()
  communityCount.value = new Set(Object.values(result)).size

  for (const [node, community] of Object.entries(result)) {
    graph.value.setNodeAttribute(node, 'color', palette[community % palette.length])
  }
}

async function computeCentrality() {
  const result = await centrality('betweenness')
  topCentral.value = Object.entries(result).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''
}

/** 只保留度数达到最大值的节点，小图上也能看出效果 */
function filterHubs() {
  only(Object.keys(degrees.value).filter(key => degrees.value[key]! >= maxDegree.value))
}
</script>

<template>
  <div class="panel">
    <div class="row">
      <label>布局</label>
      <button
        type="button"
        @click="forceAtlas2.start()"
      >
        ForceAtlas2 启动
      </button>
      <button
        type="button"
        :disabled="!forceAtlas2.isRunning.value"
        @click="forceAtlas2.stop()"
      >
        停止
      </button>
      <button
        type="button"
        @click="circular.assign()"
      >
        环形排布
      </button>
      <span class="tag">{{ forceAtlas2.isRunning.value ? 'worker 迭代中' : '未运行' }}</span>
    </div>

    <div class="row">
      <label>检索</label>
      <input
        v-model="query"
        placeholder="按名称查找"
      >
      <ul
        v-if="results.length"
        class="results"
      >
        <li
          v-for="item in results"
          :key="item.id"
        >
          <button
            type="button"
            @click="focus(item)"
          >
            {{ item.label }}
          </button>
        </li>
      </ul>
    </div>

    <div class="row">
      <label>分析</label>
      <button
        type="button"
        @click="colorByCommunity"
      >
        社区着色
      </button>
      <button
        type="button"
        @click="computeCentrality"
      >
        中心性
      </button>
      <button
        type="button"
        @click="filterHubs"
      >
        只看枢纽
      </button>
      <button
        type="button"
        @click="reset"
      >
        取消过滤
      </button>
      <span class="tag">最大度 {{ maxDegree }} · 已隐藏 {{ hiddenCount }}</span>
    </div>

    <p
      v-if="communityCount || topCentral"
      class="hint"
    >
      <span v-if="communityCount">社区数 {{ communityCount }}</span>
      <span v-if="topCentral"> · 中心性最高 {{ topCentral }}</span>
    </p>
  </div>
</template>

<style scoped>
/* 插槽内容跟在占满高度的画布之后按正常流排布，不绝对定位就会被挤出舞台 */
.panel {
  position: absolute;
  inset: auto 8px 8px;
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid #d0d7de;
  border-radius: 8px;
  background: rgb(255 255 255 / 92%);
  font-size: 14px;
}

.row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

label {
  min-width: 40px;
  color: #57606a;
}

.results {
  display: flex;
  gap: 6px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.tag,
.hint {
  color: #57606a;
}

.hint {
  margin: 0;
  font-size: 13px;
}

button,
input {
  cursor: pointer;
}
</style>
