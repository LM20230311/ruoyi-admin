<script setup lang="ts">
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'
import CommonNodeHeader from '../../components/CommonNodeHeader.vue'
import SvgIcon from '../../components/SvgIcon.vue'
import RuntimeBadge from '../../components/RuntimeBadge.vue'
import { inject, watch } from 'vue'

const props = defineProps<NodeProps>()

const runtimeDetailUuid = inject<any>('wfRuntimeDetailUuid')
const resolveRuntimeDetail = inject<any>('wfResolveRuntimeDetail')
const { updateNodeInternals } = useVueFlow()

function isExpanded(data: any) {
  const id = runtimeDetailUuid?.value ? String(runtimeDetailUuid.value) : ''
  const selfUuid = data?.uuid ? String(data.uuid) : ''
  const selfRuntimeId = data?.__runtime?.nodeUuid || data?.__runtime?.uuid
  const selfRuntimeIdStr = selfRuntimeId ? String(selfRuntimeId) : ''
  return !!id && (id === selfUuid || id === selfRuntimeIdStr)
}

watch(
  () => runtimeDetailUuid?.value,
  () => {
    const id = props.data?.uuid || props.data?.__runtime?.nodeUuid || props.data?.__runtime?.uuid
    if (id) {
      try { updateNodeInternals([String(id)]) } catch {}
    }
  },
  { flush: 'post' },
)
</script>

<template>
  <div class="start-node-root">
    <div class="flex flex-col w-full node-card">
      <Handle type="source" :position="Position.Right" />
      <CommonNodeHeader :wf-node="data" />
      <div class="flex-1 flex-col">
        <div v-for="userInputDef in data.inputConfig.user_inputs" :key="userInputDef.uuid" class="content_line flex justify-items-start px-2">
          <div class="flex-none w-4 content-center mr-1">
            <SvgIcon v-if="userInputDef.type === 1" icon="carbon:string-text" />
            <SvgIcon v-else-if="userInputDef.type === 2" icon="carbon:string-integer" />
            <SvgIcon v-else-if="userInputDef.type === 3" icon="carbon:list-boxes" />
            <SvgIcon v-else-if="userInputDef.type === 4" icon="carbon:list-dropdown" />
            <SvgIcon v-else-if="userInputDef.type === 5" icon="carbon:boolean" />
          </div>
          <div class="w-24 overflow-hidden mr-1">{{ userInputDef.name }}</div>
          <div class="flex-1 overflow-hidden">{{ userInputDef.title }}</div>
        </div>
      </div>
      <RuntimeBadge :wf-node="data" />
    </div>
    <transition name="collapse">
      <div v-if="isExpanded(data) && data?.__runtime" class="runtime-detail-popup">
        <component :is="resolveRuntimeDetail ? resolveRuntimeDetail(data.__runtime || data) : 'div'" :node="data.__runtime || data" />
        <div class="text-[12px] text-gray-400 mt-2">
          <div>runtimeDetailUuid: {{ runtimeDetailUuid?.value }}</div>
          <div>nodeUuid: {{ data?.uuid }}</div>
          <div>runtime.nodeUuid: {{ data?.__runtime?.nodeUuid || data?.__runtime?.uuid }}</div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.start-node-root {
  position: relative;
}
.runtime-detail-popup {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  width: 100%;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  padding: 12px;
  z-index: 5;
}
</style>


