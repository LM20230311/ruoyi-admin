<script setup lang="ts">
import { computed } from 'vue'
import { EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@vue-flow/core'

const props = defineProps<EdgeProps>()
const path = computed(() => getBezierPath(props))
const isRunning = computed(() => (props as any)?.data?.running === true)
</script>

<script lang="ts">
export default { inheritAttrs: false }
</script>

<template>
  <g>
    <defs>
      <marker id="wf-arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#9ca3af" />
      </marker>
    </defs>
    <path
      class="vue-flow__edge-path"
      :d="path[0]"
      :style="{
        stroke: '#9ca3af',
        strokeWidth: 1.5,
        fill: 'none',
        strokeDasharray: isRunning ? '6 3' : '0',
      }"
      marker-end="url(#wf-arrow)"
    />
  </g>
  <EdgeLabelRenderer>
    <div :style="{ pointerEvents: 'none', position: 'absolute', transform: `translate(-50%, -50%) translate(${path[1]}px,${path[2]}px)` }" class="nodrag nopan" />
  </EdgeLabelRenderer>
</template>


