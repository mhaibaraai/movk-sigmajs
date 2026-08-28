<script setup lang="ts">
import type Sigma from 'sigma'
import Graph from 'graphology'

const graph = new Graph()

// Grid layout with varying sizes
const COLS = 8
const ROWS = 6
const SPACING = 100
const COLORS = ['#e22653', '#277da1', '#33cc33', '#ff9900', '#9b59b6', '#1abc9c']

for (let row = 0; row < ROWS; row++) {
  for (let col = 0; col < COLS; col++) {
    const id = `${row}-${col}`
    graph.addNode(id, {
      x: (col - (COLS - 1) / 2) * SPACING,
      y: ((ROWS - 1) / 2 - row) * SPACING,
      color: COLORS[(row + col) % COLORS.length]
    })

    if (col > 0) graph.addEdge(`${row}-${col - 1}`, id)
    if (row > 0) graph.addEdge(`${row - 1}-${col}`, id)
  }
}

const settings = {
  renderEdgeLabels: true,
  labelRenderedSizeThreshold: 0,
  futureUnknownSetting: '库不认识的键'
}

const readBack = shallowRef('')

function onReady(instance: Sigma) {
  const all = instance.getSettings() as unknown as Record<string, unknown>
  readBack.value = String(all.futureUnknownSetting)
}
</script>

<template>
  <SigmaGraph :graph="graph" :settings="settings" @ready="onReady">
    <SigmaControls>
      <div class="bg-accented p-2">
        futureUnknownSetting: {{ readBack }}
      </div>
    </SigmaControls>
  </SigmaGraph>
</template>
