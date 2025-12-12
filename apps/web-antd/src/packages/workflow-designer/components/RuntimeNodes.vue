<script lang="ts" setup>
import { computed, ref, inject, watch } from 'vue'
import { Image } from 'ant-design-vue'
import SvgIcon from './SvgIcon.vue'
import { getIconByComponentName, getIconClassByComponentName } from '../utils/workflow-util'
import { createComponentNameMap } from '../utils/component-map'

interface Props {
  nodes: any[]
  workflow: any
  errorMsg: string
  token?: string
  componentIdMap?: Record<string, string>
}
const props = defineProps<Props>()

const prologue = computed(() => {
  const startNode = (props.workflow?.nodes || []).find((n: any) => n.wfComponent?.name === 'Start')
  return (startNode?.nodeConfig || {}).prologue || ''
})

// 统一获取节点唯一标识（兼容 runtimeNode.uuid / nodeUuid，兜底索引）
function getNodeUuid(node: any, idx?: number): string {
  console.log(node,'node1')
  return node?.nodeUuid || node?.uuid || (typeof idx === 'number' ? String(idx) : '')
}

// 组件ID -> 名称映射（复用公共逻辑，使用外部传入的 map）
const { getNameById, setMap } = createComponentNameMap(props.componentIdMap || {})

// 根据 workflowComponentId 获取组件名称（优先映射，退回固定表）
function getComponentNameByWorkflowComponentId(workflowComponentId: number | string): string {
  return getNameById(workflowComponentId)
}

function getRealFileUrl(fileUrl: string) {
  if (!fileUrl.includes('http') && !fileUrl.includes('/api')) return `/api${fileUrl}`
  return fileUrl
}

// 运行详情组件注册机制：支持在 properties 目录下新增 <Name>NodeRuntime.vue
const runtimeDetailModules = import.meta.glob('../properties/*NodeRuntime.vue', {
  eager: true,
  import: 'default',
}) as Record<string, any>

function toRuntimeKey(path: string) {
  const file = path.substring(path.lastIndexOf('/') + 1)
  return file.replace(/NodeRuntime\.vue$/, '').toLowerCase()
}

const runtimeDetailMap = Object.fromEntries(
  Object.entries(runtimeDetailModules).map(([p, mod]) => [toRuntimeKey(p), mod]),
)

// 默认详情组件：仅展示输入和输出
const DefaultRuntimeDetail = {
  props: ['node'],
  template: `
    <div class="space-y-3">
      <div class="text-base font-semibold">输入</div>
      <div v-if="!node?.input || Object.keys(node.input).length===0" class="text-neutral-400">无输入</div>
      <div v-else v-for="(content, name) in node.input" :key="'input_'+name" class="flex">
        <div class="min-w-24 pr-2">{{ name }}</div>
        <div class="whitespace-pre-wrap break-words">{{ content?.value ?? '' }}</div>
      </div>
      <div class="text-base font-semibold mt-2">输出</div>
      <div v-if="!node?.output || Object.keys(node.output).length===0" class="text-neutral-400">无输出</div>
      <div v-else v-for="(content, name) in node.output" :key="'output_'+name" class="flex">
        <div class="min-w-24 pr-2">{{ name }}</div>
        <div class="whitespace-pre-wrap break-words">{{ content?.value ?? '' }}</div>
      </div>
    </div>
  `,
}

function resolveRuntimeDetailComponent(node: any) {
  const name = node?.wfComponent?.name?.toLowerCase() || ''
  return runtimeDetailMap[name] || DefaultRuntimeDetail
}

// 统一的详情展开控制（由父级或节点点击驱动）
const injectedDetailUuid = inject<any>('wfRuntimeDetailUuid')
const expandedUuid = ref<string | null>(injectedDetailUuid?.value ?? null)

watch(
  () => injectedDetailUuid?.value,
  (val) => {
    expandedUuid.value = val ?? null
  },
  { immediate: true },
)

watch(
  () => props.componentIdMap,
  (map) => {
    if (map) setMap(map)
  },
  { deep: true, immediate: true },
)

function toggleDetail(node: any, idx?: number) {
  const nodeId = getNodeUuid(node, idx) || (typeof idx === 'number' ? String(idx) : '')
  if (!nodeId) return
  console.log('[RuntimeNodes] toggle detail', { nodeId, idx, node })
  const next = expandedUuid.value === nodeId ? null : nodeId || null
  expandedUuid.value = next
  if (injectedDetailUuid && typeof injectedDetailUuid.value !== 'undefined') {
    injectedDetailUuid.value = next
  }
}

// 运行态辅助：开始/结束时间与状态
function getStatus(node: any) {
  console.log(node,'node2')
  if (node?.endAt) return 'done'
  return 'running'
}
function getDurationMs(node: any) {
  if (!node?.startAt) return 0
  const end = node?.endAt ? node.endAt : Date.now()
  return Math.max(0, end - node.startAt)
}
</script>

<template>
  <div>
    <div v-if="errorMsg" class="py-2 text-red-500">错误：{{ errorMsg }}</div>
    <div v-else-if="nodes.length === 0" class="text-center py-2 text-neutral-400">无内容</div>
    <div v-show="prologue" class="p-2">{{ prologue }}</div>
    <div
      v-for="(node, idx) in nodes"
      :key="getNodeUuid(node, idx)"
      class="flex flex-col space-y-2 border border-gray-200 p-2 m-2 rounded-md"
      :title="node.nodeTitle"
      :name="getNodeUuid(node, idx)"
    >
      <!-- 调试信息 -->
      <!-- <div class="text-xs text-gray-500">
        Debug: wfComponent={{ node.wfComponent }}, workflowComponentId={{ node.workflowComponentId }}
      </div> -->
      <div class="flex items-center justify-between bg-gray-100 px-2 py-1 rounded-md">
        <div class="flex items-center space-x-1">
        <SvgIcon 
          v-if="node.wfComponent || node.workflowComponentId" 
          class="text-base" 
          :class="node.wfComponent ? getIconClassByComponentName(node.wfComponent.name) : getIconClassByComponentName(getComponentNameByWorkflowComponentId(node.workflowComponentId))" 
          :icon="node.wfComponent ? getIconByComponentName(node.wfComponent.name) : getIconByComponentName(getComponentNameByWorkflowComponentId(node.workflowComponentId))" 
        />
          <div class="text-base">{{ node.nodeTitle || '找不到节点标题' }}</div>
        </div>
        <div class="flex items-center space-x-2">
          <span v-if="getStatus(node) === 'running'" class="text-xs text-blue-500">正在运行</span>
          <span v-else class="text-xs text-green-600">运行完成 · {{ (getDurationMs(node) / 1000).toFixed(1) }}s</span>
          <a class="text-xs cursor-pointer" @click.stop.prevent="toggleDetail(node, idx)">{{ expandedUuid === getNodeUuid(node, idx) ? '收起详情' : '查看详情' }}</a>
        </div>
      </div>
      <div class="flex flex-col space-y-2">
        <div class="text-base border-b border-gray-200 py-1">输入</div>
        <div v-for="(content, name) in node.input" :key="`input_${name}`" class="flex">
          <div class="min-w-24 pr-2">{{ name }}</div>
          <div>{{ content.value || '无内容' }}</div>
        </div>
        <div class="text-base border-b border-gray-200 py-1">输出</div>
        <!-- 优先展示流式增量（chunks），用于未产出最终输出时的实时渲染 -->
        <div v-if="node.chunks" class="flex">
          <!-- <div class="min-w-24 pr-2">回复</div> -->
          <div class="whitespace-pre-wrap break-words">{{ node.chunks }}</div>
        </div>
        <div v-else v-for="(content, name) in node.output" :key="`onput_${name}`" class="flex">
          <template v-if="content.type === 4">
            <Image.PreviewGroup>
              <Image v-for="url in content.value" :key="url" :src="`${getRealFileUrl(url)}?token=${token || ''}`" :width="100" />
            </Image.PreviewGroup>
          </template>
          <template v-else>
            <div class="min-w-24 pr-2">{{ name }}</div>
            <div class="whitespace-pre-wrap break-words">{{ content.value || '无内容' }}</div>
          </template>
        </div>
        <transition name="collapse">
          <div v-if="expandedUuid === getNodeUuid(node, idx)" class="mt-2 border-t pt-2">
            <component :is="resolveRuntimeDetailComponent(node)" :node="node" />
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>


