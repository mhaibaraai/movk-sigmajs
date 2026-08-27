<script setup lang="ts">
import { shallowRef } from 'vue'
import type { StylesDeclaration } from 'sigma/types'

const data = demoGraph({ nodes: 18, extraEdges: 1 })

// 只声明配色与尺寸，标签、隐藏与悬浮反馈都指望基础规则提供
const styles: StylesDeclaration = { nodes: demoNodeStyle }

const base = shallowRef<'default' | 'none'>('default')
</script>

<template>
  <SigmaGraph :data="data" :styles="styles" :styles-base="base">
    <div class="demo-panel" data-at="top-left">
      <div class="demo-row">
        <span class="demo-label">基础规则</span>
        <button type="button" :aria-pressed="base === 'default'" @click="base = 'default'">
          default
        </button>
        <button type="button" :aria-pressed="base === 'none'" @click="base = 'none'">
          none
        </button>
      </div>
      <span class="demo-tag">
        切到 none 后标签与悬浮反馈全部消失：sigma 拿到 styles.nodes 是整体替换
        DEFAULT_STYLES 而非合并
      </span>
    </div>
  </SigmaGraph>
</template>
