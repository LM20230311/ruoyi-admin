import { ref } from 'vue'

// 纯映射容器：由外部传入组件列表，内部不做接口请求或写死兜底
export function createComponentNameMap(initialMap: Record<string, string> = {}) {
  const componentIdToNameMap = ref<Record<string, string>>({ ...initialMap })

  function setMap(map: Record<string, string>) {
    componentIdToNameMap.value = { ...(map || {}) }
  }

  function getNameById(workflowComponentId: number | string): string {
    const idStr = String(workflowComponentId)
    return componentIdToNameMap.value[idStr] || 'Unknown'
  }

  return { componentIdToNameMap, getNameById, setMap }
}

export function getNameByIdFromMap(map: Record<string, string>, workflowComponentId: number | string): string {
  const idStr = String(workflowComponentId)
  return map?.[idStr] || 'Unknown'
}

