<script setup lang="ts">
import { computed } from 'vue'

/**
 * 组件树之外访问实例。
 *
 * 下面的按钮与 SigmaGraph 是兄弟关系，inject 拿不到上下文，只能按 id 取。
 * 返回的是计算属性而非一次性查表：调用方常在实例挂载之前就取好引用，
 * 实例就绪后引用会自动填上。
 */
const context = useSigmaById('by-id-demo')
const ids = useSigmaIds()

const order = computed(() => context.value?.graph.value.order ?? 0)

function zoomFromOutside() {
  context.value?.sigma.value?.getCamera().animatedZoom({ duration: 300 })
}

function paintFromOutside() {
  context.value?.graph.value.setNodeAttribute('n0', 'color', '#a855f7')
}

const data = demoGraph()
</script>

<template>
  <div class="wrap">
    <div class="outside">
      <button type="button" :disabled="!context" @click="zoomFromOutside">
        树外放大
      </button>
      <button type="button" :disabled="!context" @click="paintFromOutside">
        树外改色
      </button>
      <span class="demo-tag">注册表：{{ ids.join('、') || '空' }} · 节点 {{ order }}</span>
    </div>

    <SigmaGraph id="by-id-demo" :data="data" class="stage" />
  </div>
</template>

<style scoped>
.wrap {
  display: flex;
  flex-direction: column;
  /* .example-stage 是 flex 行容器，不给宽度会缩成内容宽 */
  width: 100%;
  height: 100%;
}

.outside {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--sigma-color-border);
  font-size: 13px;
}

.outside button {
  padding: 3px 8px;
  border: 1px solid var(--sigma-color-border);
  border-radius: 4px;
  background: none;
  color: inherit;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
}

.stage {
  flex: 1;
  min-height: 0;
}
</style>
