<script setup lang="ts">
const { graph } = useSigmaGraph()
const { degrees, maxDegree, centrality, communities } = useSigmaMetrics()
const { query, results, focus } = useSigmaSearch({ fields: ['label'] })
const { only, reset, hiddenCount } = useSigmaFilter()

const forceAtlas2 = useSigmaLayout('forceatlas2')
const circular = useSigmaLayout('circular')
const { download, isExporting } = useSigmaExport()

const curved = ref(false)

/** 平行边默认完全重叠，分配曲率后才分得开 */
async function separateParallelEdges() {
  await curveParallelEdges(graph.value)
  curved.value = true
}

/** 度数映射尺寸 + 社区着色，两个视觉映射工具的组合 */
async function applyVisualMapping() {
  const sizes = degreeToSize(graph.value, [8, 24])
  for (const [node, size] of Object.entries(sizes)) {
    graph.value.setNodeAttribute(node, 'size', size)
  }

  const colors = communityToColor(await communities())
  for (const [node, color] of Object.entries(colors)) {
    graph.value.setNodeAttribute(node, 'color', color)
  }
  communityCount.value = new Set(Object.values(colors)).size
}

const communityCount = ref(0)
const topCentral = ref('')

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
        @click="applyVisualMapping"
      >
        度数尺寸 + 社区着色
      </button>
      <button
        type="button"
        :disabled="curved"
        @click="separateParallelEdges"
      >
        {{ curved ? '平行边已分开' : '分开平行边' }}
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
      <button
        type="button"
        :disabled="isExporting"
        @click="download('graph.png', { backgroundColor: '#fff' })"
      >
        {{ isExporting ? '导出中…' : '导出 PNG' }}
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
/* 插槽内容跟在占满高度的画布之后按正常流排布，不绝对定位就会被挤出舞台。
   左侧留出小地图的宽度，避免压住它 */
.panel {
  position: absolute;
  inset: auto 8px 8px 160px;
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
