<script setup lang="ts">
import { computed, inject } from 'vue'

interface Props { wfNode: any }
const props = defineProps<Props>()

const openDetail = inject<(node: any) => void>('wfOpenRuntimeDetail')

const status = computed(() => {
  const rt = (props.wfNode as any)?.__runtime
  if (!rt) return 'idle'
  return rt?.endAt ? 'done' : 'running'
})

const text = computed(() => {
  const rt = (props.wfNode as any)?.__runtime
  if (!rt) return ''
  if (!rt.endAt) return '正在运行'
  const ms = Math.max(0, (rt.endAt as number) - (rt.startAt as number))
  return `运行成功 · ${(ms / 1000).toFixed(3)}s`
})
</script>

<template>
  <div v-if="(wfNode as any)?.__runtime" class="w-full mt-1">
    <div class="flex items-center justify-between bg-emerald-50 text-emerald-700 border border-emerald-200 rounded px-2 py-1 text-xs">
      <div>
        <span v-if="status==='running'">正在运行</span>
        <span v-else>{{ text }}</span>
      </div>
      <a class="cursor-pointer" @click.stop="openDetail && openDetail(wfNode)">查看详情</a>
    </div>
  </div>
</template>


